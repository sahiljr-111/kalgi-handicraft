import fs from 'node:fs/promises';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import type { Types } from 'mongoose';
import { env } from '../env';
import { BlogPost, Category, Event, GalleryItem, Inquiry, Media, Product, Settings, User } from '../models';
import { slugify } from '../slug';
import { drawArt, drawScene, type ArtKind, type PALETTES } from './art';
import { blogPosts, categories, products, settings } from './data';

/** Seed artwork ships with the site as static files in public/seed. */
const SEED_DIR = path.join(process.cwd(), 'public', 'seed');

export async function ensureAdmin(): Promise<void> {
  if ((await User.countDocuments()) > 0) return;
  if (!env.adminPassword) throw new Error('Set ADMIN_PASSWORD in .env.local to create the first owner account');
  await User.create({ name: settings.ownerName, email: env.adminEmail, passwordHash: await bcrypt.hash(env.adminPassword, 12), role: 'owner' });
  console.log(`[seed] Created owner account ${env.adminEmail}`);
}

async function writeSvg(name: string, svg: string): Promise<string> {
  await fs.mkdir(SEED_DIR, { recursive: true });
  const filename = `${name}.svg`;
  await fs.writeFile(path.join(SEED_DIR, filename), svg);
  const url = `/seed/${filename}`;
  await Media.create({ url, publicId: filename, provider: 'static', filename, width: 800, height: 800, bytes: Buffer.byteLength(svg), format: 'svg' });
  return url;
}

export async function seedDatabase({ reset = false } = {}): Promise<void> {
  if (reset) {
    // Never wipe the real catalogue imported from IndiaMART by accident.
    if (!process.argv.includes('--force') && (await Product.countDocuments({ sourceId: { $exists: true } })) > 0) {
      throw new Error('[seed] The database has the real imported catalogue. Refusing to reset (add --force if you really mean it).');
    }
    await Promise.all([Category, Product, BlogPost, GalleryItem, Inquiry, Media, Settings, Event].map((m) => (m as typeof Category).deleteMany({})));
  } else if ((await Category.countDocuments()) > 0) {
    console.log('[seed] Database already has content, skipping (use --reset to wipe)');
    return;
  }

  console.log('[seed] Seeding sample content…');
  await Settings.create({ key: 'site', ...settings, heroImage: '/seed/hero.svg', aboutImage: '/seed/about-craft.svg' });

  const catIds = new Map<string, Types.ObjectId>();
  for (const [i, c] of categories.entries()) {
    const image = await writeSvg(`category-${c.slug}`, drawArt(c.art, c.palette, `cat${i}`));
    const { art, palette, ...fields } = c;
    void art; void palette;
    const doc = await Category.create({ ...fields, image, sortOrder: i, isActive: true });
    catIds.set(c.slug, doc._id);
  }

  const productDocs: { _id: Types.ObjectId; name: string; slug: string }[] = [];
  for (const [i, p] of products.entries()) {
    const slug = slugify(p.name);
    const images = [];
    for (const [j, kind] of p.art.entries()) {
      const url = await writeSvg(`${slug}-${j + 1}`, drawArt(kind, p.palette, `p${i}-${j}`));
      images.push({ url, alt: j === 0 ? p.name : `${p.name}, close-up of the Meenakari work`, isPrimary: j === 0 });
    }
    const doc = await Product.create({
      name: p.name,
      slug,
      category: catIds.get(p.category),
      priceFrom: p.priceFrom,
      unit: p.unit ?? 'per piece',
      material: p.material,
      size: p.size,
      colorOptions: p.colorOptions,
      moq: p.moq,
      images,
      description: p.description,
      seoTitle: `${p.name} | Kalgi Handicraft`,
      seoDescription: p.description.split('\n')[0].slice(0, 155),
      isFeatured: Boolean(p.featured),
      status: 'published',
      createdAt: new Date(Date.now() - (products.length - i) * 86_400_000),
    });
    productDocs.push(doc);
  }

  const blogArt: [ArtKind, keyof typeof PALETTES][] = [['detail', 'ruby'], ['chowki', 'emerald'], ['dryfruit-open', 'royal']];
  for (const [i, post] of blogPosts.entries()) {
    const featuredImage = await writeSvg(`blog-${post.slug}`, drawArt(blogArt[i][0], blogArt[i][1], `b${i}`));
    const { category, ...fields } = post;
    await BlogPost.create({
      ...fields,
      featuredImage,
      relatedCategory: catIds.get(category),
      seoTitle: post.title,
      seoDescription: post.excerpt,
      status: 'published',
      publishedAt: new Date(Date.now() - (blogPosts.length - i) * 7 * 86_400_000),
    });
  }

  const scenes: { title: string; caption: string; cat: string; kinds: ArtKind[]; palettes: (keyof typeof PALETTES)[]; tall?: boolean }[] = [
    { title: '500 Diwali dry fruit boxes', caption: 'Corporate order for a pharma company, Ahmedabad', cat: 'dry-fruit-box', kinds: Array(6).fill('dryfruit'), palettes: ['teal', 'royal', 'ruby'], tall: true },
    { title: 'Temple chowki set', caption: 'Custom 24-inch patlas for a temple trust', cat: 'wooden-chowki', kinds: ['chowki', 'chowki'], palettes: ['royal', 'ruby'] },
    { title: 'Wedding thali sets', caption: 'Matching thalis for a wedding in Surat', cat: 'pooja-articles', kinds: ['thali', 'thali', 'thali'], palettes: ['ruby', 'emerald', 'royal'] },
    { title: 'Bridal jewellery chests', caption: 'Dome-lid boxes in the bride’s colours', cat: 'jewellery-gift-box', kinds: ['jewellery', 'jewellery'], palettes: ['ivory', 'ruby'], tall: true },
    { title: 'Kumkum boxes for a pooja store', caption: 'Mixed-design wholesale order', cat: 'pooja-articles', kinds: ['kumkum', 'kumkum', 'kumkum'], palettes: ['emerald', 'saffron', 'ruby'] },
    { title: 'Corporate gift hampers', caption: 'Logo-plate gift boxes for an IT company', cat: 'jewellery-gift-box', kinds: Array(4).fill('giftbox'), palettes: ['noir', 'royal'], tall: true },
    { title: 'Navratri bajot collection', caption: 'Festive stock for a gift shop in Rajkot', cat: 'wooden-chowki', kinds: ['chowki', 'chowki', 'chowki'], palettes: ['emerald', 'saffron', 'noir'] },
    { title: 'Return-gift mini boxes', caption: '1,000 mini dry fruit boxes for a wedding', cat: 'dry-fruit-box', kinds: ['dryfruit', 'dryfruit', 'dryfruit'], palettes: ['saffron', 'teal', 'ruby'] },
  ];
  // Illustrations only, saved to the photo library. They are not added to the
  // public Work gallery, which must show real orders.
  for (const [i, s] of scenes.entries()) await writeSvg(`gallery-${i + 1}`, drawScene(s.kinds, s.palettes, `g${i}`, s.tall));

  await writeSvg('hero', drawArt('dryfruit', 'ruby', 'hero', 'deep'));
  await writeSvg('about-craft', drawArt('detail', 'emerald', 'about'));

  const names = ['Sample: Rakesh Shah', 'Sample: Priya Mehta', 'Sample: Imran Qureshi', 'Sample: Neha Joshi', 'Sample: Vikram Desai', 'Sample: Anjali Rao', 'Sample: Suresh Bhatt', 'Sample: Kavita Nair'];
  const statuses = ['new', 'new', 'contacted', 'converted', 'closed', 'contacted', 'new', 'converted'] as const;
  for (let i = 0; i < 18; i++) {
    const p = productDocs[(i * 5) % productDocs.length];
    await Inquiry.create({
      name: names[i % names.length],
      phone: `98${String(10000000 + i * 7919).slice(0, 8)}`,
      email: i % 3 === 0 ? `buyer${i}@example.com` : '',
      productId: p._id,
      productName: p.name,
      quantity: [25, 50, 100, 200, 12, 500][i % 6],
      message: i % 2 ? 'Please share wholesale price and delivery time to our city.' : 'Can you do custom colours for a wedding order?',
      source: i % 4 === 0 ? 'whatsapp' : 'form',
      status: statuses[i % statuses.length],
      createdAt: new Date(Date.now() - Math.floor((i * 29) / 18) * 86_400_000 - i * 3_600_000),
    });
  }
  for (let i = 0; i < 40; i++) {
    await Event.create({ type: 'whatsapp_click', productSlug: productDocs[i % productDocs.length].slug, createdAt: new Date(Date.now() - (i % 30) * 86_400_000) });
  }

  console.log(`[seed] Seeded ${categories.length} categories, ${productDocs.length} products, ${blogPosts.length} posts, ${scenes.length} gallery items`);
}
