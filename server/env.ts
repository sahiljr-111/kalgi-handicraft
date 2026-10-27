/**
 * Server-side configuration. Values are read lazily where a missing secret
 * should fail at request time (not at build time).
 */
export const env = {
  isProd: process.env.NODE_ENV === 'production',
  mongoUri: process.env.MONGODB_URI ?? '',
  adminEmail: process.env.ADMIN_EMAIL ?? 'admin@kalgihandicraft.com',
  adminPassword: process.env.ADMIN_PASSWORD ?? '',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? '',
    apiKey: process.env.CLOUDINARY_API_KEY ?? '',
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? '',
    folder: process.env.CLOUDINARY_FOLDER || 'kalgi',
  },
  allowLocalUploads: process.env.ALLOW_LOCAL_UPLOADS === 'true',
  smtp: {
    host: process.env.SMTP_HOST ?? '',
    port: Number(process.env.SMTP_PORT ?? 587),
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
  },
  emailFrom: process.env.EMAIL_FROM || 'Kalgi Handicraft <no-reply@kalgihandicraft.com>',
  notifyEmail: process.env.NOTIFY_EMAIL ?? '',
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, ''),
};

export const cloudinaryEnabled = Boolean(env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret);

/** Local-disk uploads: always in development; in production only when explicitly allowed (self-hosting with a persistent disk). */
export const localUploadsEnabled = !cloudinaryEnabled && (!env.isProd || env.allowLocalUploads);

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV !== 'production') return 'dev-only-insecure-secret-change-me-please-000';
  throw new Error('JWT_SECRET must be set to a random string of at least 32 characters');
}
