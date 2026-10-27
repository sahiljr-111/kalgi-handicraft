import { requireUser } from '@/server/session';
import { json, route } from '@/server/http';
import { deleteRedirect } from '@/server/services/redirects';

export const DELETE = route<{ id: string }>(async (req, { id }) => {
  await requireUser(req, 'owner');
  await deleteRedirect(id);
  return json({ ok: true });
});
