import { signToken, setAuthCookie } from '@/server/auth';
import { json, readJson, route } from '@/server/http';
import { rateLimit } from '@/server/rateLimit';
import { authenticate } from '@/server/services/users';

export const POST = route(async (req) => {
  await rateLimit(req, 'login', 10, 15 * 60, 'Too many login attempts. Please wait 15 minutes and try again.');
  const user = await authenticate(await readJson(req));
  const token = await signToken({ sub: user.id, email: user.email, role: user.role });
  const res = json({ user });
  setAuthCookie(res, token);
  return res;
});
