/**
 * Brings the live content in line with verified facts (SEO audit, Oct 2026).
 * See docs/SEO-AUDIT.md for the source of every fact used here.
 *
 *   npx tsx scripts/content-cleanup.ts            # apply
 *   npx tsx scripts/content-cleanup.ts --dry-run  # show what would change
 *
 * Re-runnable. It:
 *  - fixes business settings (real GSTIN, rating 4.5 from 10 IndiaMART ratings),
 *    owner-confirmed contact details, address and hours; removes sample testimonials
 *  - deletes the illustrated sample gallery items
 *  - rewrites category text without unverified claims, and clears their
 *    hand-typed SEO fields so the automatic titles apply
 *  - removes "custom orders welcome" from imported product descriptions
 *  - replaces the sample blog posts with the articles in scripts/data/blog-articles.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { config } from 'dotenv';

config({ path: '.env.local' });
config();

const DRY = process.argv.includes('--dry-run');

const SETTINGS = {
  tagline: 'Meenakari woodcraft manufacturer in Jasdan, Gujarat',
  gstNumber: '24AXNPH4757R1ZN',
  rating: 4.5,
  ratingCount: 10,
  ratingSource: 'IndiaMART',
  ratingUrl: 'https://www.indiamart.com/kalgi-handicraft/testimonial.html',
  'social.indiamart': 'https://www.indiamart.com/kalgi-handicraft/',
  // Confirmed by the owner (Oct 2026).
  businessName: 'Kalgi Handicraft',
  ownerName: 'Akshay B Hirani',
  phone: '+91 84698 85085',
  whatsapp: '918469885085',
  email: 'axayp9932@gmail.com',
  addressLine: 'Aanand Nagar, Nr. New Bus Stop',
  city: 'Jasdan, Dist. Rajkot',
  state: 'Gujarat',
  postalCode: '360050',
  mapEmbedUrl: 'https://www.google.com/maps?q=Aanand+Nagar+New+Bus+Stop+Jasdan+Rajkot+Gujarat+360050&output=embed',
  hours: [{ days: 'Monday – Sunday (open all days)', hours: '8:00 AM – 8:30 PM' }],
};

const CATEGORIES: Record<string, { tagline: string; description: string }> = {
  'wooden-chowki': {
    tagline: 'Meenakari wooden chowki, bajot and patla for pooja and décor',
    description: `We make wooden chowkis, bajots and patlas with Meenakari work at our unit in Jasdan, Gujarat. The range covers small square chowkis for a home mandir, larger bajots and patlas for rituals, and decorative pieces in several sizes and finishes.

Each listing shows the size, material and starting price. You can order any quantity, from one piece. Prices are wholesale and depend on the quantity you order. For current stock and photos, send an inquiry or message us on WhatsApp with the design and quantity you need.`,
  },
  'dry-fruit-box': {
    tagline: 'Meenakari and wooden dry fruit boxes for gifting',
    description: `Dry fruit boxes in wooden, jar and Meenakari designs, made in Jasdan, Gujarat. Listings show the number of compartments, size and starting price, so you can compare designs for festive, wedding or corporate gifting.

Prices are wholesale and depend on quantity. Tell us the design, the number of boxes and your delivery city, and we will reply with the price and current photos.`,
  },
  'pooja-articles': {
    tagline: 'Meenakari pooja thalis and pooja articles',
    description: `Pooja thalis, Karwa Chauth thali sets and other pooja articles with Meenakari work, made in Jasdan, Gujarat. Each listing shows the material, size and starting price. You can order any quantity, from one piece.

Shops and bulk buyers can ask for wholesale prices. Send the design and quantity you need and we will confirm price and availability.`,
  },
  'jewellery-gift-box': {
    tagline: 'Meenakari jewellery and gift boxes',
    description: `Jewellery boxes, trinket boxes and gift boxes with Meenakari work, made in Jasdan, Gujarat. Listings show the size, material and starting price. You can order any quantity, from one piece.

For gifting or resale in bulk, send us the design and quantity and we will reply with wholesale pricing and photos.`,
  },
  'home-decor': {
    tagline: 'Meenakari décor pieces and collectibles',
    description: `Decorative Meenakari pieces for the home and for gifting, made in Jasdan, Gujarat. Each listing shows the size, material and starting price. You can order any quantity, from one piece.

Prices are wholesale and depend on quantity. Ask on WhatsApp or through the inquiry form for current designs and photos.`,
  },
  'kitchen-utility': {
    tagline: 'Meenakari steel dabbas, tiffins and bottles',
    description: `Stainless steel dabbas, containers and other kitchen pieces with Meenakari enamel decoration, from our unit in Jasdan, Gujarat. Listings show the size, capacity where known and starting price. You can order any quantity, from one piece.

For bulk orders, send the design and quantity you need and we will confirm price and availability.`,
  },
};

const OLD_PRODUCT_LINE = 'Hand-crafted by Kalgi Handicraft in Jasdan, Gujarat. Bulk and custom orders welcome.';
const NEW_PRODUCT_LINE = 'Made by Kalgi Handicraft in Jasdan, Gujarat. Wholesale and bulk orders welcome.';

const REPLACED_POSTS: Record<string, string> = {
  'how-to-choose-wooden-chowki-for-pooja': 'pooja-chowki-buying-guide',
  'dry-fruit-box-corporate-diwali-gifting': 'dry-fruit-box-gifting-guide',
};

interface Article {
  slug: string;
  title: string;
  seoTitle: string;
  seoDescription: string;
  excerpt: string;
  topic: string;
  tags: string[];
  relatedCategory: string;
  featuredProductSlug: string;
  content: string;
}

async function main() {
  const { connectDB } = await import('../server/db');
  const { BlogPost, Category, GalleryItem, Product, Settings } = await import('../server/models');
  const { createPost, updatePost } = await import('../server/services/blog');
  const { upsertRedirect } = await import('../server/services/redirects');
  const mongoose = (await import('mongoose')).default;
  await connectDB();
  const log = (...a: unknown[]) => console.log(DRY ? '[dry-run]' : '', ...a);

  // Settings
  const s = await Settings.findOne({ key: 'site' });
  if (s) {
    const samples = s.testimonials.filter((t) => /^sample/i.test(t.name));
    log(`settings: GSTIN, rating ${SETTINGS.rating}/${SETTINGS.ratingCount}, owner contact details, remove ${samples.length} sample testimonials`);
    if (!DRY) {
      s.set(SETTINGS);
      s.set('testimonials', s.testimonials.filter((t) => !/^sample/i.test(t.name)));
      await s.save();
    }
  }

  // Gallery: the illustrated sample items are not real orders.
  const fakeGallery = await GalleryItem.find({ image: /^\/seed\// }).lean();
  log(`gallery: delete ${fakeGallery.length} sample items`);
  if (!DRY) await GalleryItem.deleteMany({ image: /^\/seed\// });

  // Categories
  for (const [slug, text] of Object.entries(CATEGORIES)) {
    const c = await Category.findOne({ slug });
    if (!c) continue;
    log(`category ${slug}: new tagline/description, automatic SEO`);
    if (!DRY) {
      c.set({ ...text, seoTitle: '', seoDescription: '' });
      await c.save();
    }
  }

  // Products
  const withLine = await Product.find({ description: { $regex: OLD_PRODUCT_LINE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') } });
  log(`products: reword closing line on ${withLine.length}`);
  if (!DRY) for (const p of withLine) {
    p.description = p.description.replace(OLD_PRODUCT_LINE, NEW_PRODUCT_LINE);
    await p.save();
  }

  // Blog
  const articles: Article[] = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/blog-articles.json'), 'utf8'));
  const keep = new Set(articles.map((a) => a.slug));
  const old = await BlogPost.find({ slug: { $nin: [...keep] } }).lean();
  log(`blog: delete ${old.length} sample posts (${old.map((p) => p.slug).join(', ')})`);
  if (!DRY) await BlogPost.deleteMany({ _id: { $in: old.map((p) => p._id) } });
  // The replaced sample posts forward to the new article on the same subject.
  for (const [from, to] of Object.entries(REPLACED_POSTS)) {
    log(`redirect /blog/${from} -> /blog/${to}`);
    if (!DRY) await upsertRedirect(`/blog/${from}`, `/blog/${to}`, true);
  }

  for (const a of articles) {
    const [cat, product] = await Promise.all([Category.findOne({ slug: a.relatedCategory }).lean(), Product.findOne({ slug: a.featuredProductSlug }).lean()]);
    const img = product?.images.find((i) => i.isPrimary) ?? product?.images[0];
    const body = {
      title: a.title,
      slug: a.slug,
      excerpt: a.excerpt,
      content: a.content,
      featuredImage: img?.url ?? '',
      featuredImageAlt: img ? img.alt || product!.name : '',
      topic: a.topic,
      tags: a.tags,
      relatedCategory: cat ? String(cat._id) : '',
      author: 'Kalgi Handicraft',
      seoTitle: a.seoTitle,
      seoDescription: a.seoDescription,
      status: 'published',
    };
    const existing = await BlogPost.findOne({ slug: a.slug }).lean();
    log(`blog: ${existing ? 'update' : 'create'} ${a.slug} (photo: ${img?.url ?? 'none'}, category: ${cat?.slug ?? 'none'})`);
    if (!DRY) await (existing ? updatePost(String(existing._id), body) : createPost(body));
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
