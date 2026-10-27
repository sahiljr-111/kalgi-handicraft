import type { MetadataRoute } from 'next';
import { getBlogPosts, getBlogTopics, getCategories, getGallery, getProducts } from '@/lib/api';
import { absoluteUrl } from '@/lib/seo';
import { SITE_URL } from '@/lib/utils';

/**
 * Regenerated whenever a product, category or article is saved (see
 * server/revalidate.ts), and at least hourly. Product entries include their
 * photos so they can appear in Google Images. Items marked "hide from Google"
 * (noindex), drafts, scheduled posts and posts canonicalised elsewhere are left out.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [allCategories, allProducts, allPosts, topics, gallery] = await Promise.all([
    getCategories(),
    getProducts({ limit: 1000, sort: 'updated' }),
    getBlogPosts(500),
    getBlogTopics(),
    getGallery(),
  ]);
  const categories = allCategories.filter((c) => !c.noindex);
  const products = { items: allProducts.items.filter((p) => !p.noindex) };
  const posts = allPosts.filter((p) => !p.noindex && !p.canonicalUrl);
  const latest = products.items[0]?.updatedAt ? new Date(products.items[0].updatedAt) : new Date();
  const staticPages = [
    { path: '', priority: 1, changeFrequency: 'daily' as const },
    { path: '/about', priority: 0.5, changeFrequency: 'monthly' as const },
    ...(gallery.length ? [{ path: '/gallery', priority: 0.4, changeFrequency: 'monthly' as const }] : []),
    { path: '/blog', priority: 0.5, changeFrequency: 'weekly' as const },
    { path: '/contact', priority: 0.6, changeFrequency: 'monthly' as const },
  ].map((p) => ({ url: `${SITE_URL}${p.path}`, lastModified: latest, changeFrequency: p.changeFrequency, priority: p.priority }));

  return [
    ...staticPages,
    ...categories.map((c) => ({
      url: `${SITE_URL}/${c.slug}`,
      lastModified: new Date(c.updatedAt ?? latest),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
      images: c.image ? [absoluteUrl(c.image)] : undefined,
    })),
    ...products.items.map((p) => ({
      url: `${SITE_URL}/product/${p.slug}`,
      lastModified: new Date(p.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
      images: p.images.slice(0, 5).map((i) => absoluteUrl(i.url)),
    })),
    ...topics.map((t) => ({ url: `${SITE_URL}/blog/topic/${t.slug}`, lastModified: latest, changeFrequency: 'weekly' as const, priority: 0.4 })),
    ...posts.map((p) => ({
      url: `${SITE_URL}/blog/${p.slug}`,
      lastModified: new Date(p.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
      images: p.featuredImage ? [absoluteUrl(p.featuredImage)] : undefined,
    })),
  ];
}
