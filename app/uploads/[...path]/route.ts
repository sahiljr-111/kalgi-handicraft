import fs from 'node:fs/promises';
import path from 'node:path';
import { LOCAL_UPLOAD_DIR, MIME_BY_EXT } from '@/server/storage';

/** Serves locally stored uploads (development / self-hosting without Cloudinary). */
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const name = path.basename((await params).path.join('/'));
  const type = MIME_BY_EXT[path.extname(name).slice(1).toLowerCase()];
  if (!type) return new Response('Not found', { status: 404 });
  try {
    const data = await fs.readFile(path.join(LOCAL_UPLOAD_DIR, name));
    return new Response(new Uint8Array(data), {
      headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
