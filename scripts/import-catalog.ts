/**
 * Imports the product catalogue scraped from the IndiaMART listing
 * (scripts/data/indiamart-import.json, photos in public/catalog/).
 *
 *   npx tsx scripts/import-catalog.ts            # import / update
 *   npx tsx scripts/import-catalog.ts --dry-run  # show what would change
 *
 * Re-runnable: products are matched by their IndiaMART id (sourceId), so a
 * second run updates instead of duplicating. The old sample products are
 * hidden (not deleted) so the website shows real products.
 */
import fs from 'node:fs';
import path from 'node:path';
import { config } from 'dotenv';

config({ path: '.env.local' });
config();

interface Row {
  sourceId: string;
  sourceUrl: string;
  name: string;
  category: string;
  priceFrom: number;
  unit: string;
  moq: number;
  material: string;
  size: string;
  colorOptions: string[];
  description: string;
  status: 'draft' | 'published';
  images: string[];
}

const DRY = process.argv.includes('--dry-run');

/** IndiaMART listings spell materials inconsistently ("WOODEN", "wood", "Wooden"). */
function normaliseMaterial(m: string): string {
  const t = m.trim();
  if (!t) return '';
  const key = t.toLowerCase();
  if (/^(wood|wooden)$/.test(key)) return 'Wooden';
  if (/^(ss|stainless steel|steel)$/.test(key)) return 'Stainless Steel';
  return t.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

async function main() {
  const { connectDB, disconnectDB } = await import('../server/db');
  const { Category, Media, Product, Settings } = await import('../server/models');
  const { uniqueSlug } = await import('../server/slug');

  const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'scripts/data/indiamart-import.json'), 'utf8')) as {
    newCategories: Record<string, { name: string; tagline: string }>;
    products: Row[];
  };
  await connectDB();

  // 1. Categories: reuse existing ones by slug, create the new ones.
  const catIds = new Map<string, string>();
  for (const c of await Category.find().lean()) catIds.set(c.slug, String(c._id));
  let order = (await Category.countDocuments()) || 0;
  for (const slug of new Set(data.products.map((p) => p.category))) {
    if (catIds.has(slug)) continue;
    const meta = data.newCategories[slug] ?? { name: slug, tagline: '' };
    console.log(`+ category ${meta.name}`);
    if (!DRY) {
      const doc = await Category.create({ name: meta.name, slug, tagline: meta.tagline, sortOrder: order++, isActive: true });
      catIds.set(slug, String(doc._id));
    }
  }

  // 2. Products (upsert by sourceId) + media library entries.
  let created = 0;
  let updated = 0;
  for (const r of data.products) {
    const images = r.images.map((fn, i) => ({ url: `/catalog/${fn}`, alt: i === 0 ? r.name : `${r.name}, photo ${i + 1}`, isPrimary: i === 0 }));
    const existing = await Product.findOne({ sourceId: r.sourceId });
    const fields = {
      name: r.name,
      category: catIds.get(r.category),
      priceFrom: r.priceFrom,
      unit: r.unit,
      moq: r.moq,
      material: normaliseMaterial(r.material),
      size: r.size,
      colorOptions: r.colorOptions,
      description: r.description,
      images,
      // Left empty on purpose: the website builds unique SEO text from the product data (lib/seo.ts).
      seoTitle: '',
      seoDescription: '',
    };
    if (DRY) {
      if (existing) updated++;
      else created++;
      continue;
    }
    if (existing) {
      // Keep the owner's own changes to status/featured; refresh the rest.
      existing.set(fields);
      await existing.save();
      updated++;
    } else {
      const slug = await uniqueSlug(Product, r.name);
      await Product.create({ ...fields, slug, sourceId: r.sourceId, status: r.status, isFeatured: false });
      created++;
    }
    for (const img of images) {
      const file = path.join(process.cwd(), 'public', img.url);
      if (!(await Media.exists({ url: img.url })) && fs.existsSync(file)) {
        await Media.create({ url: img.url, publicId: path.basename(img.url), provider: 'static', filename: path.basename(img.url), bytes: fs.statSync(file).size, format: 'webp' });
      }
    }
  }
  console.log(`products: ${created} created, ${updated} updated`);
  if (DRY) return disconnectDB();

  // 3. Hide the generated sample products (reversible from the dashboard).
  const hidden = await Product.updateMany({ sourceId: { $exists: false }, status: 'published' }, { $set: { status: 'draft', isFeatured: false } });
  console.log(`sample products hidden: ${hidden.modifiedCount}`);

  // 4. Feature two real products per category (most photos first) for the home page.
  if (!(await Product.exists({ sourceId: { $exists: true }, isFeatured: true }))) {
    for (const id of catIds.values()) {
      const top = await Product.find({ category: id, sourceId: { $exists: true }, status: 'published' }).lean();
      top.sort((a, b) => b.images.length - a.images.length || b.priceFrom - a.priceFrom);
      await Product.updateMany({ _id: { $in: top.slice(0, 2).map((p) => p._id) } }, { $set: { isFeatured: true } });
    }
  }

  // 5. Replace placeholder category photos and home/about images with real ones.
  for (const [, id] of catIds) {
    const cat = await Category.findById(id);
    if (!cat || (cat.image && !cat.image.startsWith('/seed/'))) continue;
    const p = await Product.findOne({ category: id, sourceId: { $exists: true }, status: 'published' }).sort({ isFeatured: -1 }).lean();
    if (p?.images[0]) {
      cat.image = p.images[0].url;
      await cat.save();
    }
  }
  const settings = await Settings.findOne({ key: 'site' });
  if (settings) {
    if (settings.heroImage?.startsWith('/seed/')) settings.heroImage = '';
    if (!settings.aboutImage || settings.aboutImage.startsWith('/seed/')) {
      const p = await Product.findOne({ sourceId: { $exists: true }, isFeatured: true }).lean();
      if (p?.images[0]) settings.aboutImage = p.images[0].url;
    }
    await settings.save();
  }

  const counts = await Product.aggregate([{ $match: { status: 'published' } }, { $group: { _id: '$category', n: { $sum: 1 } } }]);
  const names = new Map((await Category.find().lean()).map((c) => [String(c._id), c.name]));
  console.log('on website now:', counts.map((c) => `${names.get(String(c._id))}: ${c.n}`).join(', '));
  await disconnectDB();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
