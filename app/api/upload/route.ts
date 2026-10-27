import { requireUser } from '@/server/session';
import { cloudinaryEnabled, localUploadsEnabled } from '@/server/env';
import { HttpError, json, route } from '@/server/http';
import { recordLocalUpload } from '@/server/services/media';
import { EXT_BY_MIME, MAX_UPLOAD_BYTES, saveLocal } from '@/server/storage';

/** Tells the dashboard how to upload: straight to Cloudinary, or to local disk (development). */
export const GET = route(async (req) => {
  await requireUser(req);
  return json({ mode: cloudinaryEnabled ? 'cloudinary' : localUploadsEnabled ? 'local' : 'disabled' });
});

/** Local-disk upload (multipart field "files"). Only used when Cloudinary isn't configured. */
export const POST = route(async (req) => {
  await requireUser(req);
  if (!localUploadsEnabled) throw new HttpError(503, 'Image uploads need Cloudinary. Add the CLOUDINARY_* settings.');
  const form = await req.formData();
  const files = form.getAll('files').filter((f): f is File => f instanceof File);
  if (!files.length) throw new HttpError(400, 'No image received');
  const saved = [];
  for (const file of files.slice(0, 12)) {
    if (!EXT_BY_MIME[file.type]) throw new HttpError(400, `${file.name}: use JPG, PNG or WebP images`);
    if (file.size > MAX_UPLOAD_BYTES) throw new HttpError(400, `${file.name} is larger than 8 MB`);
    const stored = await saveLocal(Buffer.from(await file.arrayBuffer()), file.type);
    saved.push(await recordLocalUpload(stored, file.name));
  }
  return json(saved, { status: 201 });
});
