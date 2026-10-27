import { isValidObjectId } from 'mongoose';
import type { NextRequest } from 'next/server';
import { getUser, type AuthUser, type Role } from './auth';
import { connectDB } from './db';
import { HttpError } from './errors';
import { User } from './models';

/**
 * Admin guard for API routes. Besides checking the JWT, it confirms the
 * account still exists and uses its *current* role, so a deleted user or a
 * demoted owner can't keep using an old token. (Middleware can't do this: it
 * runs on the edge without database access.)
 */
export async function requireUser(req: NextRequest, ...roles: Role[]): Promise<AuthUser> {
  const token = await getUser(req);
  if (!token || !isValidObjectId(token.sub)) throw new HttpError(401, 'Please sign in again');
  await connectDB();
  const user = await User.findById(token.sub).select('email role').lean();
  if (!user) throw new HttpError(401, 'Your account no longer exists. Please sign in again.');
  const role = user.role as Role;
  if (roles.length && !roles.includes(role)) throw new HttpError(403, 'You do not have permission to do that');
  return { sub: String(user._id), email: user.email, role };
}
