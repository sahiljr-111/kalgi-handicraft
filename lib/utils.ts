import clsx, { type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Joins class names; later Tailwind classes override conflicting earlier ones (e.g. w-full → w-auto). */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
/** Image URLs are Cloudinary (absolute) or same-origin paths such as /seed/… and /uploads/…. */
export function mediaUrl(url: string | undefined | null): string {
  if (!url) return '';
  if (/^https?:\/\//.test(url)) return url;
  return url.startsWith('/') ? url : `/${url}`;
}

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
export const formatPrice = (n: number) => inr.format(n);

export function formatDate(value: string | Date, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) {
  return new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', ...opts }).format(new Date(value));
}

export function timeAgo(value: string | Date): string {
  const s = Math.round((Date.now() - new Date(value).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d} day${d === 1 ? '' : 's'} ago`;
  return formatDate(value);
}

export function primaryImage<T extends { url: string; isPrimary: boolean }>(images: T[] | undefined): T | undefined {
  if (!images?.length) return undefined;
  return images.find((i) => i.isPrimary) ?? images[0];
}

export function whatsappLink(number: string, text: string) {
  return `https://wa.me/${number.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
}

export function productWhatsappText(name: string, slug: string) {
  return `Hi Kalgi Handicraft, I'm interested in "${name}" (${SITE_URL}/product/${slug}). Please share the price and details.`;
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Splits plain-text descriptions into paragraphs. */
export const paragraphs = (text: string) => text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

/** Suggested blog topics (the editor can also type a new one). Each topic gets a page at /blog/topic/<slug>. */
export const BLOG_TOPICS = ['Craft & Heritage', 'Buying Guides', 'Gifting', 'Wholesale', 'News'];

/** Postal address as display lines: street / town, district / state – PIN. */
export function addressLines(s: { addressLine: string; city: string; state: string; postalCode: string }) {
  return [s.addressLine, s.city, [s.state, s.postalCode].filter(Boolean).join(' – ')].filter(Boolean);
}
