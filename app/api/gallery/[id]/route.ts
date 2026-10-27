import { requireUser } from '@/server/session';
import { json, readJson, route } from '@/server/http';
import { deleteGalleryItem, updateGalleryItem } from '@/server/services/gallery';

export const PUT = route<{ id: string }>(async (req, { id }) => {
  await requireUser(req);
  return json(await updateGalleryItem(id, await readJson(req)));
});

export const DELETE = route<{ id: string }>(async (req, { id }) => {
  await requireUser(req);
  await deleteGalleryItem(id);
  return json({ ok: true });
});
