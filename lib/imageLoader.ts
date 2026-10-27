/**
 * next/image loader.
 * - Cloudinary: resized and converted to WebP/AVIF by Cloudinary's CDN.
 * - /catalog photos: a 400px copy (name-400.webp) is used for small slots.
 * - Other local files are served as they are.
 */
export default function imageLoader({ src, width }: { src: string; width: number; quality?: number }) {
  if (src.startsWith('https://res.cloudinary.com/') && src.includes('/upload/')) {
    return src.replace('/upload/', `/upload/f_auto,q_auto,c_limit,w_${width}/`);
  }
  if (src.startsWith('/catalog/') && src.endsWith('.webp') && !src.endsWith('-400.webp')) {
    return width <= 480 ? src.replace(/\.webp$/, '-400.webp') : src;
  }
  return `${src}${src.includes('?') ? '&' : '?'}w=${width}`;
}
