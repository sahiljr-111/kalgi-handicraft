import { isValidObjectId } from 'mongoose';
import { z } from 'zod';
import { connectDB } from '../db';
import { HttpError, notFound } from '../http';
import { Category, Product } from '../models';
import { revalidate } from '../revalidate';
import { uniqueSlug } from '../slug';
import { recordSlugChange } from './redirects';

// Slugs that would collide with top-level site routes.
const RESERVED = new Set(['admin', 'api', 'about', 'blog', 'contact', 'gallery', 'product', 'thank-you', 'uploads', 'seed', 'sitemap-xml', 'robots-txt', 'icon-svg']);

const categoryInput = z.object({
  name: z.string().trim().min(2, 'Name is required').max(80),
  slug: z.string().trim().max(80).optional().default(''),
  tagline: z.string().trim().max(160).optional().default(''),
  description: z.string().max(10000).optional().default(''),
  seoTitle: z.string().trim().max(120).optional().default(''),
  seoDescription: z.string().trim().max(320).optional().default(''),
  image: z.string().optional().default(''),
  isActive: z.boolean().optional().default(true),
  noindex: z.boolean().optional().default(false),
});

export async function listCategories(showAll = false) {
  await connectDB();
  const categories = await Category.find(showAll ? {} : { isActive: true }).sort({ sortOrder: 1, name: 1 }).lean();
  const counts = await Product.aggregate<{ _id: unknown; count: number }>([
    { $match: showAll ? {} : { status: 'published' } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  const map = new Map(counts.map((c) => [String(c._id), c.count]));
  return categories.map((c) => ({ ...c, productCount: map.get(String(c._id)) ?? 0 }));
}

export async function getCategory(idOrSlug: string, isAdmin = false) {
  await connectDB();
  const category = await Category.findOne(isValidObjectId(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug }).lean();
  if (!category || (!category.isActive && !isAdmin)) throw notFound('Category');
  return category;
}

async function resolveSlug(input: string, excludeId?: string) {
  const slug = await uniqueSlug(Category, input, excludeId);
  if (RESERVED.has(slug)) throw new HttpError(400, `"${slug}" is reserved by the website`, { slug: 'Reserved word' });
  return slug;
}

export async function createCategory(input: unknown) {
  await connectDB();
  const data = categoryInput.parse(input);
  const slug = await resolveSlug(data.slug || data.name);
  const last = await Category.findOne().sort({ sortOrder: -1 }).select('sortOrder').lean();
  const category = await Category.create({ ...data, slug, sortOrder: (last?.sortOrder ?? -1) + 1 });
  revalidate({ tags: ['categories'], paths: [`/${slug}`, '/'] });
  return category.toObject();
}

export async function reorderCategories(input: unknown) {
  await connectDB();
  const { ids } = z.object({ ids: z.array(z.string().refine(isValidObjectId)).min(1) }).parse(input);
  await Category.bulkWrite(ids.map((id, index) => ({ updateOne: { filter: { _id: id }, update: { $set: { sortOrder: index } } } })));
  revalidate({ tags: ['categories'], paths: ['/'] });
}

export async function updateCategory(id: string, input: unknown) {
  await connectDB();
  const data = categoryInput.parse(input);
  const category = await Category.findById(id);
  if (!category) throw notFound('Category');
  const oldSlug = category.slug;
  const slug = await resolveSlug(data.slug || data.name, String(category._id));
  category.set({ ...data, slug });
  await category.save();
  await recordSlugChange('', oldSlug, slug);
  revalidate({ tags: ['categories', 'products'], paths: [`/${slug}`, `/${oldSlug}`, '/'] });
  return category.toObject();
}

export async function deleteCategory(id: string) {
  await connectDB();
  const inUse = await Product.countDocuments({ category: id });
  if (inUse > 0) throw new HttpError(409, `This category still has ${inUse} product(s). Move or delete them first.`);
  const category = await Category.findByIdAndDelete(id);
  if (!category) throw notFound('Category');
  revalidate({ tags: ['categories'], paths: [`/${category.slug}`, '/'] });
}
