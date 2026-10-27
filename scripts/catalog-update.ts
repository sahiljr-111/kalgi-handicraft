/**
 * Catalogue changes requested by the owner (Oct 2026). Re-runnable.
 *
 *   npx tsx scripts/catalog-update.ts            # apply
 *   npx tsx scripts/catalog-update.ts --dry-run  # show what would change
 *
 *  - No minimum order any more: every product's MOQ is set to 1 (it is no longer shown anywhere).
 *  - Deletes the old illustrated sample products.
 *  - Merges exact duplicate listings (same name words, category and price) into one,
 *    keeping all photos and redirecting the removed addresses.
 *  - Adds placeholder products for top sellers that are not in the catalogue yet.
 *  - Marks the owner's top-selling products, and the ones shown in the home page banner.
 */
import { config } from 'dotenv';

config({ path: '.env.local' });
config();

const DRY = process.argv.includes('--dry-run');

// In the owner's order. `slug` = existing product; `mock` = placeholder until real photos and price are added.
const TOP_SELLERS: ({ slug: string } | { mock: { name: string; slug: string; category: string; image: string; material: string } })[] = [
  { slug: 'bajot-wooden-chowki' },
  { slug: '15x15-wooden-chowki-rajwadi' },
  { slug: 'dry-fruit-box' },
  { slug: '2kg-golden-meenakari-dry-fruit-box' },
  { slug: 'chowki-metal' },
  { mock: { name: 'Key Holder', slug: 'key-holder', category: 'home-decor', image: '/catalog/mock-key-holder.svg', material: 'Wood, Meenakari work' } },
  { mock: { name: 'Meenakari Glass', slug: 'meenakari-glass', category: 'kitchen-utility', image: '/catalog/mock-meenakari-glass.svg', material: 'Meenakari work' } },
  { mock: { name: 'Rajwadi Patari', slug: 'rajwadi-patari', category: 'jewellery-gift-box', image: '/catalog/mock-rajwadi-patari.svg', material: 'Wood, Meenakari work' } },
  { slug: '15x21-patla-silver' },
  { slug: 'steel-puri-dabo' },
];
// Shown in the big banner at the top of the home page (first = main photo).
const HERO = ['bajot-wooden-chowki', '15x15-wooden-chowki-rajwadi', 'dry-fruit-box'];

const nameKey = (n: string) => n.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' ').sort().join(' ');

async function main() {
  const { connectDB } = await import('../server/db');
  const { Category, Inquiry, Product } = await import('../server/models');
  const { upsertRedirect } = await import('../server/services/redirects');
  const mongoose = (await import('mongoose')).default;
  await connectDB();
  const log = (...a: unknown[]) => console.log(DRY ? '[dry-run]' : '', ...a);

  // 1. No minimum order
  const withMoq = await Product.countDocuments({ moq: { $ne: 1 } });
  log(`moq: reset ${withMoq} products to 1`);
  if (!DRY) await Product.updateMany({ moq: { $ne: 1 } }, { $set: { moq: 1 } }, { timestamps: false });

  // 2. Old illustrated sample products (never real stock)
  const samples = await Product.find({ sourceId: { $exists: false }, 'images.url': /^\/seed\// }).select('name').lean();
  log(`samples: delete ${samples.length} (${samples.map((p) => p.name).join(', ')})`);
  if (!DRY) await Product.deleteMany({ _id: { $in: samples.map((p) => p._id) } });

  // 3. Exact duplicates
  const all = await Product.find({ status: 'published' }).sort({ createdAt: 1 });
  const groups = new Map<string, typeof all>();
  for (const p of all) {
    const key = `${String(p.category)}|${p.priceFrom}|${nameKey(p.name)}`;
    groups.set(key, [...(groups.get(key) ?? []), p]);
  }
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const [keep, ...drop] = [...group].sort((a, b) => b.images.length - a.images.length);
    const seen = new Set(keep.images.map((i) => i.url));
    const extra = drop.flatMap((d) => d.images).filter((i) => !seen.has(i.url) && seen.add(i.url));
    log(`duplicate "${keep.name}" ₹${keep.priceFrom}: keep ${keep.slug} (+${extra.length} photos), remove ${drop.map((d) => d.slug).join(', ')}`);
    if (DRY) continue;
    keep.images.push(...extra.map((i) => ({ url: i.url, alt: i.alt, isPrimary: false })));
    keep.colorOptions = [...new Set([...keep.colorOptions, ...drop.flatMap((d) => d.colorOptions)])];
    keep.isFeatured = keep.isFeatured || drop.some((d) => d.isFeatured);
    for (const d of drop) {
      await Inquiry.updateMany({ productId: d._id }, { $set: { productId: keep._id } });
      await Product.deleteOne({ _id: d._id });
      await upsertRedirect(`/product/${d.slug}`, `/product/${keep.slug}`, true);
    }
    // Take the cleaner address if a removed copy had it (e.g. "pooja-box" instead of "pooja-box-2").
    const clean = [keep.slug, ...drop.map((d) => d.slug)].sort((a, b) => a.length - b.length)[0];
    if (clean !== keep.slug) {
      const old = keep.slug;
      keep.slug = clean;
      await keep.save();
      await upsertRedirect(`/product/${old}`, `/product/${clean}`, true);
    } else {
      await keep.save();
    }
  }

  // 4. Placeholder products for top sellers not in the catalogue yet
  for (const t of TOP_SELLERS) {
    if (!('mock' in t)) continue;
    const m = t.mock;
    if (await Product.exists({ slug: m.slug })) continue;
    const cat = await Category.findOne({ slug: m.category });
    log(`placeholder: create ${m.name} in ${m.category}`);
    if (DRY || !cat) continue;
    await Product.create({
      name: m.name,
      slug: m.slug,
      category: cat._id,
      priceFrom: 0,
      unit: 'per piece',
      material: m.material,
      moq: 1,
      images: [{ url: m.image, alt: `${m.name}, photo coming soon`, isPrimary: true }],
      description: `One of our top selling products. Photos and prices are being updated.\n\nAsk us on WhatsApp for the current designs, sizes and price for your quantity.\n\nMade by Kalgi Handicraft in Jasdan, Gujarat. Any quantity, wholesale prices for bulk.`,
      status: 'published',
    });
  }

  // 5. Top sellers and banner, ordered by updatedAt (the home page sorts by it)
  const slugs = TOP_SELLERS.map((t) => ('mock' in t ? t.mock.slug : t.slug));
  const missing = [];
  for (const s of slugs) if (!(await Product.exists({ slug: s }))) missing.push(s);
  if (missing.length) log(`WARNING: not found: ${missing.join(', ')}`);
  log(`top selling: ${slugs.join(', ')}; banner: ${HERO.join(', ')}`);
  if (!DRY) {
    await Product.updateMany({}, { $set: { isFeatured: false, showInHero: false } }, { timestamps: false });
    const now = Date.now();
    for (const [i, slug] of slugs.entries()) {
      await Product.updateOne(
        { slug },
        { $set: { isFeatured: true, showInHero: HERO.includes(slug), status: 'published', updatedAt: new Date(now - i * 1000) } },
        { timestamps: false },
      );
    }
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
