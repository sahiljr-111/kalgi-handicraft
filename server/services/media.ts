import { z } from 'zod';
import { connectDB } from '../db';
import { HttpError, notFound } from '../http';
import { Media, Product } from '../models';
import { pagination } from '../slug';
import { deleteStoredImage, verifyCloudinaryUpload } from '../storage';

export async function listMedia(q: Record<string, string | undefined>) {
  await connectDB();
  const { page, limit, skip } = pagination(q, 48, 200);
  const [items, total] = await Promise.all([Media.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), Media.countDocuments()]);
  return { items, total, page, pages: Math.ceil(total / limit) };
}

const cloudinaryResult = z.object({
  public_id: z.string().min(1),
  version: z.union([z.number(), z.string()]),
  signature: z.string().min(1),
  secure_url: z.string().url().refine((u) => u.startsWith('https://res.cloudinary.com/'), 'Not a Cloudinary URL'),
  width: z.number().optional(),
  height: z.number().optional(),
  bytes: z.number().optional(),
  format: z.string().optional(),
  original_filename: z.string().optional(),
});

/** Records an image the browser uploaded straight to Cloudinary. */
export async function registerCloudinaryUpload(input: unknown) {
  const r = cloudinaryResult.parse(input);
  if (!verifyCloudinaryUpload(r.public_id, r.version, r.signature)) throw new HttpError(400, 'Upload could not be verified');
  await connectDB();
  const media = await Media.create({
    url: r.secure_url,
    publicId: r.public_id,
    provider: 'cloudinary',
    filename: r.original_filename ? `${r.original_filename}.${r.format ?? ''}`.replace(/\.$/, '') : r.public_id,
    width: r.width ?? null,
    height: r.height ?? null,
    bytes: r.bytes ?? 0,
    format: r.format ?? '',
  });
  return media.toObject();
}

export async function recordLocalUpload(file: { url: string; publicId: string; bytes: number; format: string }, filename: string) {
  await connectDB();
  return (await Media.create({ ...file, provider: 'local', filename })).toObject();
}

export async function deleteMedia(id: string, force = false) {
  await connectDB();
  const media = await Media.findById(id);
  if (!media) throw notFound('Image');
  const usedBy = await Product.countDocuments({ 'images.url': media.url });
  if (usedBy > 0 && !force) throw new HttpError(409, `This image is used by ${usedBy} product(s). Remove it from those products first.`);
  await deleteStoredImage(media.provider, media.publicId);
  await media.deleteOne();
}
