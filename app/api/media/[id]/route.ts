import { requireUser } from '@/server/session';
import { json, route } from '@/server/http';
import { deleteMedia } from '@/server/services/media';

export const DELETE = route<{ id: string }>(async (req, { id }) => {
  await requireUser(req);
  await deleteMedia(id, req.nextUrl.searchParams.get('force') === 'true');
  return json({ ok: true });
});
