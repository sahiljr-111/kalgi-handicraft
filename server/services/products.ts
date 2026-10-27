import { isValidObjectId, type SortOrder, type Types } from 'mongoose';
import { z } from 'zod';
import { connectDB } from '../db';
import { HttpError, notFound } from '../http';
import { Category, Product } from '../models';
import { revalidate } from '../revalidate';
import { escapeRegex, pagination, uniqueSlug } from '../slug';
import { recordSlugChange } from './redirects';

const imageInput = z.object({
  url: z.string().min(1, 'Image URL is required'),
  alt: z.string().max(200).optional().default(''),
  isPrimary: z.boolean().optional().default(false),
});

const productInput = z.object({
  name: z.string().trim().min(2, 'Name is required').max(160),
  slug: z.string().trim().max(160).optional().default(''),
  category: z.string().refine(isValidObjectId, 'Choose a category'),
  priceFrom: z.coerce.number().min(0, 'Price must be 0 or more'),
  unit: z.string().trim().max(40).optional().default('per piece'),
  material: z.string().trim().max(120).optional().default(''),
  size: z.string().trim().max(120).optional().default(''),
  colorOptions: z.array(z.string().trim().min(1).max(40)).max(30).optional().default([]),
  // No minimum order any more; kept so old data stays valid.
  moq: z.coerce.number().int().min(1).optional().default(1),
  images: z.array(imageInput).max(20).optional().default([]),
  description: z.string().max(20000).optional().default(''),
  seoTitle: z.string().trim().max(120).optional().default(''),
  seoDescription: z.string().trim().max(320).optional().default(''),
  isFeatured: z.boolean().optional().default(false),
  showInHero: z.boolean().optional().default(false),
  noindex: z.boolean().optional().default(false),
  status: z.enum(['draft', 'published']).optional().default('draft'),
});

/** Exactly one primary image, listed first. */
function normaliseImages(images: z.infer<typeof imageInput>[]) {
  if (!images.length) return images;
  let primaryIdx = images.findIndex((i) => i.isPrimary);
  if (primaryIdx < 0) primaryIdx = 0;
  const ordered = [images[primaryIdx], ...images.filter((_, i) => i !== primaryIdx)];
  return ordered.map((img, i) => ({ ...img, isPrimary: i === 0 }));
}

const SORTS: Record<string, Record<string, SortOrder>> = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  price_asc: { priceFrom: 1, createdAt: -1 },
  price_desc: { priceFrom: -1, createdAt: -1 },
  name: { name: 1 },
  updated: { updatedAt: -1 },
};

/** Public callers only ever see published products; admins may pass status=all|draft. */
export async function listProducts(q: Record<string, string | undefined>, isAdmin = false) {
  await connectDB();
  const { page, limit, skip } = pagination(q, 24, 200);
  const filter: Record<string, unknown> = {};

  if (isAdmin && q.status && q.status !== 'all') filter.status = q.status;
  else if (!isAdmin || !q.status) filter.status = 'published';

  if (q.category) {
    const cat = isValidObjectId(q.category) ? { _id: q.category } : await Category.findOne({ slug: q.category }).select('_id').lean();
    if (!cat) return { items: [], total: 0, page, pages: 0 };
    filter.category = cat._id;
  }
  if (q.featured === 'true') filter.isFeatured = true;
  if (q.hero === 'true') filter.showInHero = true;
  if (q.material) filter.material = new RegExp(escapeRegex(q.material), 'i');
  if (q.minPrice || q.maxPrice) {
    filter.priceFrom = {
      ...(q.minPrice ? { $gte: Number(q.minPrice) } : {}),
      ...(q.maxPrice ? { $lte: Number(q.maxPrice) } : {}),
    };
  }
  if (q.q) {
    const rx = new RegExp(escapeRegex(q.q.trim()), 'i');
    filter.$or = [{ name: rx }, { material: rx }, { slug: rx }];
  }
  if (q.exclude && isValidObjectId(q.exclude)) filter._id = { $ne: q.exclude };

  // Column sorting from the dashboard table: sortBy=<field>&dir=asc|desc
  const SORTABLE: Record<string, string> = { name: 'name', price: 'priceFrom', updated: 'updatedAt', created: 'createdAt', status: 'status' };
  const sortSpec: Record<string, SortOrder> =
    q.sortBy && SORTABLE[q.sortBy] ? { [SORTABLE[q.sortBy]]: q.dir === 'desc' ? -1 : 1, _id: 1 } : SORTS[q.sort ?? ''] ?? SORTS.newest;
  const [items, total] = await Promise.all([
    Product.find(filter).sort(sortSpec).skip(skip).limit(limit).populate('category', 'name slug').lean(),
    Product.countDocuments(filter),
  ]);
  return { items, total, page, pages: Math.ceil(total / limit) };
}

export async function getProductById(id: string) {
  await connectDB();
  const product = await Product.findById(id).populate('category', 'name slug').lean();
  if (!product) throw notFound('Product');
  return product;
}

export async function getProductBySlug(slug: string, isAdmin = false) {
  await connectDB();
  const product = await Product.findOne({ slug }).populate('category', 'name slug').lean();
  if (!product || (product.status !== 'published' && !isAdmin)) throw notFound('Product');
  const related = await Product.find({
    category: (product.category as unknown as { _id: Types.ObjectId } | null)?._id,
    _id: { $ne: product._id },
    status: 'published',
  })
    .sort({ isFeatured: -1, createdAt: -1 })
    .limit(4)
    .populate('category', 'name slug')
    .lean();
  return { ...product, related };
}

async function assertCategory(id: string) {
  if (!(await Category.exists({ _id: id }))) {
    throw new HttpError(400, 'Selected category does not exist', { category: 'Not found' });
  }
}

async function categorySlug(id: unknown) {
  return (await Category.findById(id).select('slug').lean())?.slug;
}

export async function createProduct(input: unknown) {
  await connectDB();
  const data = productInput.parse(input);
  await assertCategory(data.category);
  const slug = await uniqueSlug(Product, data.slug || data.name);
  const product = await Product.create({ ...data, slug, images: normaliseImages(data.images) });
  revalidate({ tags: ['products', 'categories'], paths: [`/product/${slug}`, `/${await categorySlug(data.category)}`, '/'] });
  return product.toObject();
}

export async function updateProduct(id: string, input: unknown) {
  await connectDB();
  const data = productInput.parse(input);
  const existing = await Product.findById(id);
  if (!existing) throw notFound('Product');
  await assertCategory(data.category);

  const oldSlug = existing.slug;
  const oldCategory = existing.category;
  const slug = await uniqueSlug(Product, data.slug || data.name, String(existing._id));
  existing.set({ ...data, slug, images: normaliseImages(data.images) });
  await existing.save();
  await recordSlugChange('product', oldSlug, slug);

  const paths = new Set([`/product/${slug}`, `/product/${oldSlug}`, '/']);
  for (const c of [oldCategory, existing.category]) {
    const s = await categorySlug(c);
    if (s) paths.add(`/${s}`);
  }
  revalidate({ tags: ['products', 'categories'], paths: [...paths] });
  return existing.toObject();
}

/** Copies a product as a hidden draft. */
export async function duplicateProduct(id: string) {
  await connectDB();
  const source = await Product.findById(id).lean();
  if (!source) throw notFound('Product');
  const { _id, createdAt, updatedAt, __v, ...rest } = source as Record<string, unknown> & typeof source;
  void _id; void createdAt; void updatedAt; void __v;
  const copy = await Product.create({
    ...rest,
    name: `${source.name} (Copy)`,
    slug: await uniqueSlug(Product, `${source.slug}-copy`),
    status: 'draft',
    isFeatured: false,
  });
  return copy.toObject();
}

export async function deleteProduct(id: string) {
  await connectDB();
  const product = await Product.findByIdAndDelete(id);
  if (!product) throw notFound('Product');
  revalidate({ tags: ['products', 'categories'], paths: [`/product/${product.slug}`, `/${await categorySlug(product.category)}`, '/'] });
}
