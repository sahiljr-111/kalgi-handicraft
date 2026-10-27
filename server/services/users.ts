import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { connectDB } from '../db';
import { env } from '../env';
import { HttpError, notFound } from '../http';
import { ROLES, User } from '../models';

export const publicUser = (u: { _id: unknown; email: string; name?: string | null; role: string }) => ({
  id: String(u._id),
  email: u.email,
  name: u.name ?? '',
  role: u.role as 'owner' | 'staff',
});

/** On a fresh database, creates the first owner from ADMIN_EMAIL / ADMIN_PASSWORD. */
export async function ensureOwner() {
  await connectDB();
  if ((await User.countDocuments()) > 0 || !env.adminPassword) return;
  await User.create({ email: env.adminEmail, passwordHash: await bcrypt.hash(env.adminPassword, 12), role: 'owner', name: 'Owner' });
  console.log(`[auth] Created owner account ${env.adminEmail}`);
}

// Compared against when the email is unknown, so response time doesn't reveal which emails exist.
let dummyHash: string | undefined;
const getDummyHash = async () => (dummyHash ??= await bcrypt.hash('timing-equaliser', 12));

export async function authenticate(input: unknown) {
  const { email, password } = z
    .object({ email: z.string().trim().toLowerCase().email('Enter a valid email'), password: z.string().min(1, 'Enter your password') })
    .parse(input);
  await ensureOwner();
  const user = await User.findOne({ email }).select('+passwordHash');
  const ok = await bcrypt.compare(password, user?.passwordHash ?? (await getDummyHash()));
  if (!user || !ok) throw new HttpError(401, 'Incorrect email or password');
  user.lastLoginAt = new Date();
  await user.save();
  return publicUser(user);
}

export async function getUserById(id: string) {
  await connectDB();
  const user = await User.findById(id).lean();
  if (!user) throw new HttpError(401, 'Account no longer exists');
  return publicUser(user);
}

export async function changePassword(userId: string, input: unknown) {
  const { currentPassword, newPassword } = z
    .object({ currentPassword: z.string().min(1, 'Enter your current password'), newPassword: z.string().min(8, 'Use at least 8 characters') })
    .parse(input);
  await connectDB();
  const user = await User.findById(userId).select('+passwordHash');
  if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw new HttpError(400, 'Current password is incorrect', { currentPassword: 'Incorrect' });
  }
  user.passwordHash = await bcrypt.hash(newPassword, 12);
  await user.save();
}

export async function listUsers() {
  await connectDB();
  return User.find().sort({ createdAt: 1 }).lean();
}

export async function createUser(input: unknown) {
  const data = z
    .object({
      name: z.string().trim().max(80).optional().default(''),
      email: z.string().trim().toLowerCase().email('Enter a valid email'),
      password: z.string().min(8, 'Use at least 8 characters'),
      role: z.enum(ROLES).default('staff'),
    })
    .parse(input);
  await connectDB();
  const user = await User.create({ name: data.name, email: data.email, role: data.role, passwordHash: await bcrypt.hash(data.password, 12) });
  const { passwordHash, ...safe } = user.toObject();
  void passwordHash;
  return safe;
}

export async function deleteUser(id: string, currentUserId: string) {
  if (id === currentUserId) throw new HttpError(400, "You can't delete your own account");
  await connectDB();
  const user = await User.findById(id);
  if (!user) throw notFound('User');
  if (user.role === 'owner' && (await User.countDocuments({ role: 'owner' })) <= 1) {
    throw new HttpError(400, 'At least one owner account is required');
  }
  await user.deleteOne();
}
