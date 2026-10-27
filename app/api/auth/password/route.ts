import { requireUser } from '@/server/session';
import { json, readJson, route } from '@/server/http';
import { changePassword } from '@/server/services/users';

export const PUT = route(async (req) => {
  const { sub } = await requireUser(req);
  await changePassword(sub, await readJson(req));
  return json({ ok: true });
});
