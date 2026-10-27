import type { BlogPost, Category, Product, Settings } from './types';
import { SITE_URL, formatPrice, mediaUrl, primaryImage } from './utils';

/**
 * Automatic SEO text. Every product and category gets a unique, keyword-rich
 * title and description from its own data the moment it is saved, so the owner
 * never has to fill SEO fields. Anything typed in the dashboard's "Advanced"
 * section still wins.
 */

// Google shows about 60 characters; up to 65 is allowed before falling back to a shorter form.
const TITLE_MAX = 60;
const DESC_MAX = 158;

/** Absolute URL for a site path or media URL (Google and social apps need full URLs). */
export function absoluteUrl(pathOrUrl: string): string {
  const u = mediaUrl(pathOrUrl);
  return /^https?:\/\//.test(u) ? u : `${SITE_URL}${u.startsWith('/') ? '' : '/'}${u}`;
}

const clean = (s: string) => s.replace(/\s+/g, ' ').trim();

function clip(s: string, max: number) {
  const t = clean(s);
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max - 20)).replace(/[,;:\-–·|]+$/, '')}…`;
}

/** First choice that fits, otherwise the shortest one clipped. */
function firstFitting(options: string[], max: number) {
  const opts = options.map(clean).filter(Boolean);
  return opts.find((o) => o.length <= max) ?? clip(opts[opts.length - 1], max);
}

const town = (s: Settings) => (s.city || 'Jasdan').split(',')[0].trim();

/** True when the product name already says what the category is (e.g. "Dry Fruit Box" in "Dry Fruit Boxes"). */
function nameCoversCategory(name: string, category = '') {
  const stem = (w: string) => w.toLowerCase().replace(/(es|s)$/, '');
  const words = new Set(name.split(/[^a-z]+/i).filter((w) => w.length > 3).map(stem));
  return category.split(/[^a-z]+/i).some((w) => w.length > 3 && words.has(stem(w)));
}

/** A spec worth adding to the title, when the name doesn't already say it. */
function distinguishingSpec(p: Product) {
  const size = p.size && !p.name.toLowerCase().includes(p.size.toLowerCase().split(' ')[0]) ? p.size : '';
  return size.length && size.length <= 18 ? size : '';
}

export function productSeoTitle(p: Product, s: Settings): string {
  if (p.seoTitle?.trim()) return clip(p.seoTitle, 70);
  const spec = distinguishingSpec(p);
  const name = spec ? `${p.name} (${spec})` : p.name;
  const cat = p.category?.name ?? '';
  const middle = !cat || nameCoversCategory(p.name, cat) ? `Wholesale Manufacturer, ${town(s)}` : cat;
  // Without a size, the price tells apart products that share a name.
  const price = !spec && p.priceFrom > 0 ? ` from ${formatPrice(p.priceFrom)}` : '';
  return firstFitting(
    [
      `${name}${price} – ${middle} | ${s.businessName}`,
      `${name}${price} – ${middle}`,
      `${name}${price} | ${s.businessName}`,
      `${name}${price}`,
    ],
    TITLE_MAX + 5,
  );
}

export function productSeoDescription(p: Product, s: Settings): string {
  if (p.seoDescription?.trim()) return clip(p.seoDescription, DESC_MAX);
  const price = p.priceFrom > 0 ? ` from ${formatPrice(p.priceFrom)} ${p.unit}` : '';
  const facts = [p.material, p.size, p.colorOptions.length ? `${p.colorOptions.slice(0, 3).join(', ')} colour${p.colorOptions.length > 1 ? 's' : ''}` : ''].filter(Boolean).join(', ');
  return clip(
    `Buy ${p.name}${price}.${facts ? ` ${facts}.` : ''} Direct from the manufacturer, ${s.businessName}, ${town(s)}, ${s.state || 'Gujarat'}. Any quantity, wholesale prices for bulk.`,
    DESC_MAX,
  );
}

export function categorySeoTitle(c: Category, s: Settings): string {
  if (c.seoTitle?.trim()) return clip(c.seoTitle, 70);
  return firstFitting(
    [`${c.name} Manufacturer in ${town(s)}, ${s.state || 'Gujarat'} | Wholesale`, `${c.name} Manufacturer, ${s.state || 'Gujarat'} | ${s.businessName}`, `${c.name} | ${s.businessName}`],
    TITLE_MAX + 5,
  );
}

export function categorySeoDescription(c: Category, s: Settings, productCount = c.productCount ?? 0): string {
  if (c.seoDescription?.trim()) return clip(c.seoDescription, DESC_MAX);
  const lead = c.tagline ? `${c.tagline.replace(/\.$/, '')}.` : `${c.name} from a manufacturer.`;
  return clip(
    `${lead} ${productCount ? `${productCount} designs` : 'Designs'} direct from the manufacturer in ${town(s)}, ${s.state || 'Gujarat'}. Wholesale prices and bulk orders.`,
    DESC_MAX,
  );
}

/** Manual SEO title, else the post title with the brand when it fits. */
export function postSeoTitle(p: BlogPost): string {
  if (p.seoTitle?.trim()) return clip(p.seoTitle, 70);
  return firstFitting([`${p.title} | Kalgi Handicraft`, p.title], TITLE_MAX + 5);
}

export function postSeoDescription(p: BlogPost): string {
  return clip(p.seoDescription || p.excerpt || p.title, DESC_MAX);
}

// ── Structured data (JSON-LD) ──────────────────────────────────────────────

export function localBusinessSchema(s: Settings) {
  return {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'Store'],
    '@id': `${SITE_URL}/#business`,
    name: s.businessName,
    description: s.tagline,
    // No aggregateRating: Google does not show self-served ratings for a LocalBusiness,
    // and the rating comes from IndiaMART, not this site.
    url: SITE_URL,
    logo: `${SITE_URL}/brand/kalgi-logo-on-light.svg`,
    image: absoluteUrl('/opengraph-image.png'),
    telephone: s.phone || undefined,
    email: s.email || undefined,
    priceRange: '₹₹',
    foundingDate: String(s.establishedYear),
    founder: s.ownerName ? { '@type': 'Person', name: s.ownerName } : undefined,
    areaServed: { '@type': 'Country', name: 'India' },
    address: {
      '@type': 'PostalAddress',
      streetAddress: s.addressLine,
      addressLocality: s.city,
      addressRegion: s.state,
      postalCode: s.postalCode,
      addressCountry: s.country || 'IN',
    },
    sameAs: Object.values(s.social).filter(Boolean),
  };
}

export function websiteSchema(s: Settings) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: s.businessName,
    url: SITE_URL,
    inLanguage: 'en-IN',
    publisher: { '@id': `${SITE_URL}/#business` },
  };
}

export function productSchema(p: Product, s: Settings) {
  const images = p.images.map((i) => absoluteUrl(i.url));
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${SITE_URL}/product/${p.slug}#product`,
    name: p.name,
    description: productSeoDescription(p, s),
    image: images.length ? images : undefined,
    sku: p.slug,
    material: p.material || undefined,
    size: p.size || undefined,
    color: p.colorOptions.length ? p.colorOptions.join(', ') : undefined,
    category: p.category?.name,
    brand: { '@type': 'Brand', name: s.businessName },
    manufacturer: { '@id': `${SITE_URL}/#business` },
    offers:
      p.priceFrom > 0
        ? {
            '@type': 'Offer',
            url: `${SITE_URL}/product/${p.slug}`,
            priceCurrency: 'INR',
            price: p.priceFrom,
            itemCondition: 'https://schema.org/NewCondition',
            availability: 'https://schema.org/InStock',
            seller: { '@id': `${SITE_URL}/#business` },
          }
        : undefined,
  };
}

export function categorySchema(c: Category, items: Product[], s: Settings) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: c.name,
    description: categorySeoDescription(c, s, items.length),
    url: `${SITE_URL}/${c.slug}`,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: items.length,
      itemListElement: items.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${SITE_URL}/product/${p.slug}`,
        name: p.name,
        image: primaryImage(p.images) ? absoluteUrl(primaryImage(p.images)!.url) : undefined,
      })),
    },
  };
}
