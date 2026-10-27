import { requireUser } from '@/server/session';
import { json, route } from '@/server/http';
import { deleteUser } from '@/server/services/users';

export const DELETE = route<{ id: string }>(async (req, { id }) => {
  const me = await requireUser(req, 'owner');
  await deleteUser(id, me.sub);
  return json({ ok: true });
});
