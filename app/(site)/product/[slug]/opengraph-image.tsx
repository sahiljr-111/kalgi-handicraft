import fs from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import sharp from 'sharp';
import { getProduct, getSettings } from '@/lib/api';
import { SITE_URL, primaryImage } from '@/lib/utils';

/**
 * Branded share image for each product (WhatsApp, Facebook, Google Discover…).
 * Generated automatically from the product's photo, name and price.
 */
export const runtime = 'nodejs';
export const revalidate = 3600;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/jpeg';
export const alt = 'Kalgi Handicraft product';

const NAVY = '#1e1f33';
const GOLD = '#c1a25f';
const IVORY = '#fbf6ec';

async function download(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

/**
 * A file from /public. Read from disk when it is there (local server); on
 * serverless hosts such as Netlify the public folder sits on the CDN, not next
 * to the function, so it is downloaded from the site instead.
 */
async function publicFile(urlPath: string) {
  try {
    return await fs.readFile(path.join(process.cwd(), 'public', urlPath.replace(/^\//, '')));
  } catch {
    return download(`${SITE_URL}${urlPath}`);
  }
}

/** Loads a product photo as a PNG data URL, since the renderer can't read WebP. */
async function photoDataUrl(url: string): Promise<string | null> {
  try {
    let input: Buffer;
    if (/^https?:\/\//.test(url)) {
      input = await download(url.includes('res.cloudinary.com') ? url.replace('/upload/', '/upload/f_png,w_900/') : url);
    } else if (url.startsWith('/uploads/')) {
      input = await fs.readFile(path.join(process.cwd(), '.uploads', path.basename(url)));
    } else {
      input = await publicFile(url);
    }
    const png = await sharp(input).resize(560, 560, { fit: 'cover' }).png().toBuffer();
    return `data:image/png;base64,${png.toString('base64')}`;
  } catch {
    return null;
  }
}

async function logoDataUrl(): Promise<string | null> {
  try {
    const svg = await publicFile('/brand/kalgi-logo-on-dark.svg');
    const png = await sharp(svg, { density: 200 }).resize({ height: 110 }).png().toBuffer();
    return `data:image/png;base64,${png.toString('base64')}`;
  } catch {
    return null;
  }
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const [product, settings] = await Promise.all([getProduct((await params).slug), getSettings()]);
  const [photo, logo] = await Promise.all([product && primaryImage(product.images) ? photoDataUrl(primaryImage(product.images)!.url) : null, logoDataUrl()]);
  const name = product?.name ?? settings.businessName;
  // The renderer's built-in font has no ₹ glyph, so write "Rs.".
  const price = product && product.priceFrom > 0 ? `From Rs. ${new Intl.NumberFormat('en-IN').format(product.priceFrom)} ${product.unit}` : 'Wholesale prices on request';

  const png = new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: NAVY, color: IVORY, position: 'relative' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 14, background: GOLD, display: 'flex' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 630, height: 616, padding: 35 }}>
          {photo ? (
             
            <img src={photo} width={560} height={560} alt="" style={{ borderRadius: 28, border: `3px solid ${GOLD}`, objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 560, height: 560, borderRadius: 28, border: `3px solid ${GOLD}`, display: 'flex' }} />
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, paddingRight: 56, paddingBottom: 14 }}>
          { }
          {logo ? <img src={logo} height={78} alt="" style={{ height: 78, marginBottom: 36 }} /> : <div style={{ display: 'flex', fontSize: 40, fontWeight: 700, color: GOLD, marginBottom: 36 }}>{settings.businessName}</div>}
          <div style={{ display: 'flex', fontSize: 22, letterSpacing: 4, textTransform: 'uppercase', color: GOLD, marginBottom: 14 }}>
            {product?.category?.name ?? 'Handicraft'}
          </div>
          <div style={{ display: 'flex', fontSize: name.length > 34 ? 46 : 56, lineHeight: 1.08, fontWeight: 700, marginBottom: 26 }}>{name}</div>
          <div style={{ display: 'flex', fontSize: 34, color: GOLD, fontWeight: 700 }}>{price}</div>
          <div style={{ display: 'flex', fontSize: 24, color: 'rgba(251,246,236,0.75)', marginTop: 10 }}>Order any quantity</div>
          <div style={{ display: 'flex', fontSize: 22, color: 'rgba(251,246,236,0.7)', marginTop: 34 }}>
            Hand-crafted in {(settings.city || 'Jasdan').split(',')[0]}, {settings.state || 'Gujarat'}
          </div>
        </div>
      </div>
    ),
    size,
  );
  // JPEG keeps previews small (WhatsApp skips large images).
  const jpeg = await sharp(Buffer.from(await png.arrayBuffer())).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  return new Response(new Uint8Array(jpeg), { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800' } });
}
