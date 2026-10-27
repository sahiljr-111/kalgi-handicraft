import { unstable_cache } from 'next/cache';
import { notFound, permanentRedirect, redirect } from 'next/navigation';
import { HttpError } from '@/server/http';
import { getPostBySlug, listPosts, listTopics } from '@/server/services/blog';
import { getCategory as getCategoryDoc, listCategories } from '@/server/services/categories';
import { listGallery } from '@/server/services/gallery';
import { getProductBySlug, listProducts } from '@/server/services/products';
import { resolveRedirect } from '@/server/services/redirects';
import { getSettings as getSettingsDoc } from '@/server/services/settings';
import type { BlogPost, BlogPostDetail, BlogTopic, Category, GalleryItem, Paginated, Product, ProductDetail, Settings } from './types';

/**
 * Data for public pages, read straight from MongoDB and cached with tags.
 * Admin writes call revalidateTag() so changes appear within seconds.
 * If the database is unreachable, pages fall back to empty content instead
 * of crashing (errors are not cached, so the next request retries).
 */

const REVALIDATE = 3600;
const plain = <T>(v: unknown): T => JSON.parse(JSON.stringify(v)) as T;
// Results are JSON-serialised (ObjectIds and Dates become strings), so they are typed at the call site.
const cached = <A extends unknown[]>(fn: (...args: A) => Promise<unknown>, key: string, tags: string[]) =>
  unstable_cache(async (...args: A): Promise<unknown> => plain(await fn(...args)), [key], { tags, revalidate: REVALIDATE });

async function safe<T>(label: string, run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run();
  } catch (err) {
    if (err instanceof HttpError && err.status === 404) return fallback;
    console.warn(`[data] ${label} failed:`, (err as Error).message);
    return fallback;
  }
}

export const DEFAULT_SETTINGS: Settings = {
  businessName: 'Kalgi Handicraft',
  tagline: 'Hand-painted Meenakari woodcraft from Jasdan, Gujarat',
  ownerName: 'Akshay B Hirani',
  phone: '',
  whatsapp: '',
  email: '',
  addressLine: '',
  city: 'Jasdan, Rajkot',
  state: 'Gujarat',
  postalCode: '',
  country: 'IN',
  gstNumber: '',
  establishedYear: 1999,
  rating: 4.5,
  ratingCount: 0,
  mapEmbedUrl: '',
  heroImage: '',
  aboutImage: '',
  hours: [],
  testimonials: [],
  social: { instagram: '', facebook: '', youtube: '', indiamart: '' },
};

const settingsQ = cached(() => getSettingsDoc(), 'settings', ['settings']);
const categoriesQ = cached(() => listCategories(false), 'categories', ['categories']);
const categoryQ = cached((slug: string) => getCategoryDoc(slug, false), 'category', ['categories']);
const productsQ = cached((params: Record<string, string>) => listProducts(params, false), 'products', ['products']);
const productQ = cached((slug: string) => getProductBySlug(slug, false), 'product', ['products']);
const postsQ = cached((params: Record<string, string>) => listPosts(params, false), 'posts', ['blog']);
const topicsQ = cached(() => listTopics(), 'blog-topics', ['blog']);
const postQ = cached((slug: string) => getPostBySlug(slug, false), 'post', ['blog']);
const galleryQ = cached(() => listGallery(), 'gallery', ['gallery']);

const EMPTY_PAGE = { items: [], total: 0, page: 1, pages: 0 };

export const getSettings = () => safe('settings', () => settingsQ() as Promise<Settings>, DEFAULT_SETTINGS);
export const getCategories = () => safe('categories', () => categoriesQ() as Promise<Category[]>, []);
export const getCategory = (slug: string) => safe<Category | null>('category', () => categoryQ(slug) as Promise<Category>, null);
export const getProducts = (params: Record<string, string | number> = {}) =>
  safe<Paginated<Product>>(
    'products',
    () => productsQ(Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))) as Promise<Paginated<Product>>,
    EMPTY_PAGE,
  );
export const getProduct = (slug: string) => safe<ProductDetail | null>('product', () => productQ(slug) as Promise<ProductDetail>, null);
export const getBlogPage = (params: { page?: number; limit?: number; topic?: string; q?: string; exclude?: string } = {}) =>
  safe<Paginated<BlogPost>>(
    'posts',
    () => postsQ(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)]))) as Promise<Paginated<BlogPost>>,
    EMPTY_PAGE,
  );
export const getBlogPosts = async (limit = 50) => (await getBlogPage({ limit })).items;
export const getBlogTopics = () => safe('topics', () => topicsQ() as Promise<BlogTopic[]>, []);
export const getBlogPost = (slug: string) => safe<BlogPostDetail | null>('post', () => postQ(slug) as Promise<BlogPostDetail>, null);
/** Uncached, includes drafts and scheduled posts. Only for signed-in previews (draft mode). */
export const getBlogPostPreview = (slug: string) => safe<BlogPostDetail | null>('post preview', async () => plain<BlogPostDetail>(await getPostBySlug(slug, true)), null);
export const getGallery = () => safe('gallery', () => galleryQ() as Promise<GalleryItem[]>, []);

/**
 * For a missing page: follows a redirect saved for this path (old slugs are
 * recorded automatically when a product, category or post is renamed),
 * otherwise shows the 404 page.
 */
export async function redirectOrNotFound(path: string): Promise<never> {
  const target = await resolveRedirect(path).catch(() => null);
  if (target) (target.permanent ? permanentRedirect : redirect)(target.to);
  notFound();
}
