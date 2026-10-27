import { requireUser } from '@/server/session';
import { json, queryOf, readJson, route } from '@/server/http';
import { listMedia, registerCloudinaryUpload } from '@/server/services/media';

export const GET = route(async (req) => {
  await requireUser(req);
  return json(await listMedia(queryOf(req)));
});

/** Register an image the browser uploaded directly to Cloudinary. */
export const POST = route(async (req) => {
  await requireUser(req);
  return json(await registerCloudinaryUpload(await readJson(req)), { status: 201 });
});
