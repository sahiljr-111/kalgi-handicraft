import { clearAuthCookie } from '@/server/auth';
import { json, route } from '@/server/http';

export const POST = route(async () => {
  const res = json({ ok: true });
  clearAuthCookie(res);
  return res;
});
