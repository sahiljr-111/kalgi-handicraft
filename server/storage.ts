import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { v2 as cloudinary } from 'cloudinary';
import { cloudinaryEnabled, env } from './env';
import { HttpError } from './http';

export const LOCAL_UPLOAD_DIR = path.join(process.cwd(), '.uploads');

export const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
};
export const MIME_BY_EXT = Object.fromEntries(Object.entries(EXT_BY_MIME).map(([m, e]) => [e, m]));
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

function configureCloudinary() {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });
}

/**
 * Signature for a direct browser → Cloudinary upload. Files never pass
 * through our server, which avoids serverless request-size limits.
 */
export function signUpload() {
  if (!cloudinaryEnabled) throw new HttpError(503, 'Cloudinary is not configured');
  configureCloudinary();
  const timestamp = Math.round(Date.now() / 1000);
  const params = { timestamp, folder: env.cloudinary.folder };
  const signature = cloudinary.utils.api_sign_request(params, env.cloudinary.apiSecret);
  return { ...params, signature, apiKey: env.cloudinary.apiKey, cloudName: env.cloudinary.cloudName };
}

/** Confirms an upload result really came from our Cloudinary account. */
export function verifyCloudinaryUpload(publicId: string, version: number | string, signature: string): boolean {
  if (!cloudinaryEnabled) return false;
  const expected = cloudinary.utils.api_sign_request({ public_id: publicId, version }, env.cloudinary.apiSecret);
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function saveLocal(buffer: Buffer, mimetype: string) {
  const ext = EXT_BY_MIME[mimetype];
  if (!ext) throw new HttpError(400, 'Use JPG, PNG or WebP images');
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
  await fs.mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(LOCAL_UPLOAD_DIR, filename), buffer);
  return { url: `/uploads/${filename}`, publicId: filename, bytes: buffer.length, format: ext };
}

export async function deleteStoredImage(provider: string, publicId: string): Promise<void> {
  try {
    if (provider === 'cloudinary' && cloudinaryEnabled) {
      configureCloudinary();
      await cloudinary.uploader.destroy(publicId);
    } else if (provider === 'local') {
      await fs.unlink(path.join(LOCAL_UPLOAD_DIR, path.basename(publicId)));
    }
    // 'static' seed images ship with the site and are never deleted.
  } catch (err) {
    console.warn('[storage] Could not delete', publicId, err);
  }
}
