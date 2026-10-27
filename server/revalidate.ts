import { revalidatePath, revalidateTag } from 'next/cache';

/** Refreshes cached public pages after an admin edit (on-demand ISR). */
export function revalidate({ tags = [], paths = [] }: { tags?: string[]; paths?: string[] }) {
  // Anything that adds/removes a page also changes the sitemap.
  if (tags.some((t) => ['products', 'categories', 'blog'].includes(t))) paths = [...paths, '/sitemap.xml'];
  try {
    for (const tag of tags) revalidateTag(tag);
    for (const path of paths) if (path.startsWith('/')) revalidatePath(path);
  } catch (err) {
    // Outside a request (e.g. the seed script) there is nothing to revalidate.
    if (process.env.NODE_ENV !== 'production') console.warn('[revalidate] skipped:', (err as Error).message);
  }
}
