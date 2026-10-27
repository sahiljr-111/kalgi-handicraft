import { requireUser } from '@/server/session';
import { json, route } from '@/server/http';
import { getUserById } from '@/server/services/users';

export const GET = route(async (req) => {
  const { sub } = await requireUser(req);
  return json({ user: await getUserById(sub) });
});
