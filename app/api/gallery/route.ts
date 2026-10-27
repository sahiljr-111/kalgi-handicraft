import { requireUser } from '@/server/session';
import { json, readJson, route } from '@/server/http';
import { createGalleryItem, listGallery } from '@/server/services/gallery';

export const GET = route(async () => json(await listGallery()));

export const POST = route(async (req) => {
  await requireUser(req);
  return json(await createGalleryItem(await readJson(req)), { status: 201 });
});
