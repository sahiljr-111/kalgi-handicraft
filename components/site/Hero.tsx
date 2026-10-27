import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { Category, Product, Settings } from '@/lib/types';
import { formatPrice, mediaUrl, primaryImage } from '@/lib/utils';
import { HeroShowcase, type Slide } from './HeroShowcase';
import { WhatsAppButton } from './WhatsAppButton';

interface Props {
  settings: Settings;
  categories: Category[];
  featured: Product[];
  /** Products picked for the big banner (Admin → product → "Show in the big banner"). Falls back to `featured`. */
  heroProducts?: Product[];
}

/**
 * Laptop/desktop: hero + marquee fill the screen under the header (capped at
 * 64rem, see .hero-screen), with content centred. Type and artwork step up at
 * sm / md / lg / laptop (1440) / wide (1920) and stop growing after that.
 * The artwork is a live product showcase and the marquee lists products, so
 * visitors can jump straight into the catalogue.
 */
export function Hero({ settings, categories, featured, heroProducts = [] }: Props) {
  const slides: Slide[] = (heroProducts.length ? heroProducts : featured).flatMap((p) => {
    const img = primaryImage(p.images);
    if (!img) return [];
    return [
      {
        url: img.url,
        alt: img.alt || p.name,
        name: p.name,
        meta: p.priceFrom > 0 ? `From ${formatPrice(p.priceFrom)} ${p.unit}` : 'Price on request',
        label: p.category?.name ?? 'Featured',
        href: `/product/${p.slug}`,
      },
    ];
  });
  // The workshop/hero image (Admin → Settings) closes the loop; products lead.
  if (settings.heroImage) {
    slides.push({
      url: settings.heroImage,
      alt: 'A Meenakari piece from our Jasdan unit',
      name: 'Made in our Jasdan unit',
      meta: `Meenakari woodcraft since ${settings.establishedYear}`,
      label: settings.businessName,
      href: '/about',
    });
  }

  const prices = featured.map((p) => p.priceFrom).filter((n) => n > 0);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const marquee = featured.filter((p) => primaryImage(p.images));
  const totalDesigns = categories.reduce((n, c) => n + (c.productCount ?? 0), 0);

  return (
    <section data-dark className="hero-screen relative isolate flex flex-col overflow-hidden bg-navy text-ivory">
      {/* Background: soft gold + indigo glow and the jaal lattice */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(50%_60%_at_75%_42%,rgb(193_162_95/0.16),transparent_70%),radial-gradient(60%_60%_at_100%_0%,rgb(70_74_130/0.5),transparent_70%),radial-gradient(45%_55%_at_10%_90%,rgb(193_162_95/0.12),transparent_70%)]" />
      <div className="jaal absolute inset-0 -z-10 opacity-50 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />

      <div className="flex flex-1 items-center">
        <div className="site-container grid items-center gap-6 py-6 sm:gap-10 sm:py-12 md:grid-cols-[1.15fr_1fr] md:gap-8 md:py-14 lg:grid-cols-[1.2fr_1fr] lg:gap-12 lg:py-5 laptop:py-10 wide:gap-16 wide:py-14">
          <div className="min-w-0 text-center md:text-left">
            <p className="flex items-center justify-center gap-2.5 md:justify-start text-[0.6875rem] font-semibold tracking-[0.12em] text-gold-soft uppercase sm:gap-3 sm:text-xs sm:tracking-[0.2em] wide:text-[0.8125rem]">
              <span className="hidden h-px w-8 shrink-0 bg-gold-soft/70 xs:block" aria-hidden="true" />
              Meenakari woodcraft · Since {settings.establishedYear}
              <span className="hidden h-px w-8 shrink-0 bg-gold-soft/70 xs:block md:hidden" aria-hidden="true" />
            </p>

            <h1 className="mt-3 text-[1.875rem] leading-[1.02] font-medium tracking-[-0.03em] text-ivory sm:mt-6 sm:text-5xl md:text-[3.4rem] lg:mt-5 lg:text-[3.125rem] laptop:mt-6 laptop:text-[4.25rem] wide:mt-8 wide:text-[5.25rem]">
              Colour,
              <br />
              <span className="relative inline-block">
                <em className="font-normal text-gold-soft italic">crafted</em>
                <svg viewBox="0 0 300 24" preserveAspectRatio="none" className="absolute -bottom-[0.14em] left-0 h-[0.28em] w-full text-gold-soft/80" aria-hidden="true">
                  <path d="M3 17 C 60 5, 120 5, 170 12 S 260 20, 297 7" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" pathLength="1" strokeDasharray="1" className="animate-draw" />
                </svg>
              </span>
              <br />
              by hand.
            </h1>

            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-ivory/70 sm:mt-6 md:mx-0 sm:text-base lg:mt-5 lg:max-w-[32rem] laptop:max-w-[35rem] laptop:text-[1.0625rem] wide:mt-7 wide:max-w-[37rem] wide:text-lg">
              Meenakari chowkis, dry fruit boxes, pooja thalis and gift boxes, made in our Jasdan unit. Order any quantity, with wholesale prices for bulk.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2.5 sm:mt-7 sm:flex sm:flex-wrap sm:justify-center sm:gap-3 md:justify-start wide:mt-10">
              <Link
                href={categories[0] ? `/${categories[0].slug}` : '/contact'}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-gold-soft px-3 py-2.5 text-sm font-semibold text-navy sm:px-6 sm:py-3 sm:text-[0.95rem] shadow-[0_10px_30px_-10px_rgb(193_162_95/0.7)] transition hover:-translate-y-0.5 hover:bg-[#cdb074] hover:shadow-[0_16px_36px_-12px_rgb(193_162_95/0.8)] sm:px-7 wide:py-3.5 wide:text-base"
              >
                <span className="sm:hidden">Shop now</span>
                <span className="hidden sm:inline">Explore the collection</span>
                <ArrowRight className="hidden size-4 transition-transform group-hover:translate-x-1 sm:block" />
              </Link>
              <WhatsAppButton
                number={settings.whatsapp}
                text={`Hi ${settings.businessName}, I'd like a quote for a bulk order.`}
                className="px-3 py-2.5 text-sm ring-1 ring-white/10 hover:-translate-y-0.5 sm:px-7 sm:py-3 sm:text-[0.95rem] wide:py-3.5 wide:text-base"
              >
                <span className="sm:hidden">Get a quote</span>
                <span className="hidden sm:inline">Get a bulk quote</span>
              </WhatsAppButton>
            </div>

            {/* Collections as an overlapping image stack: visual, one line of text */}
            {categories.length > 0 && (
              <nav aria-label="Shop by collection" className="mt-7 hidden items-center justify-center gap-4 sm:flex md:justify-start wide:mt-10">
                <ul className="flex -space-x-2.5 xs:-space-x-3">
                  {categories.map((c) => (
                    <li key={c._id} className="group/cat relative">
                      <Link
                        href={`/${c.slug}`}
                        aria-label={c.name}
                        className="relative block size-9 overflow-hidden rounded-full bg-paper ring-2 ring-navy xs:size-11 transition duration-300 group-hover/cat:z-10 group-hover/cat:-translate-y-1 group-hover/cat:ring-gold-soft sm:size-12 wide:size-14"
                      >
                        {c.image && <Image src={mediaUrl(c.image)} alt="" fill sizes="56px" className="object-cover" />}
                      </Link>
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute top-full left-1/2 z-20 mt-2 -translate-x-1/2 translate-y-1 rounded-md bg-ivory px-2 py-1 text-xs font-medium whitespace-nowrap text-navy opacity-0 shadow-lg transition group-hover/cat:translate-y-0 group-hover/cat:opacity-100"
                      >
                        {c.name}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="shrink-0 text-[0.8125rem] leading-snug text-ivory/60 xs:text-sm">
                  <strong className="font-semibold text-ivory">{totalDesigns}+ designs</strong>
                  <br />
                  across {categories.length} collections
                </p>
              </nav>
            )}

          </div>

          <HeroShowcase
            className="w-full max-w-[16.5rem] xs:max-w-[18rem] sm:max-w-[23rem] md:max-w-none lg:max-w-[21.5rem] laptop:max-w-[25rem] wide:max-w-[31rem]"
            slides={slides}
            chips={{
              top: minPrice ? `From ${formatPrice(minPrice)}` : 'Wholesale prices',
              side: 'Order any quantity',
            }}
          />
        </div>
      </div>

      {/* Product marquee: every item links to its product (second copy is decorative, for a seamless loop) */}
      {marquee.length > 0 && (
        <div className="group relative border-t border-white/10 bg-black/25 py-2 sm:py-2.5 wide:py-3">
          <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]">
            {[0, 1].map((copy) => (
              <ul key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1 || undefined}>
                {marquee.map((p) => {
                  const img = primaryImage(p.images)!;
                  return (
                    <li key={`${p._id}-${copy}`} className="flex items-center">
                      <Link
                        href={`/product/${p.slug}`}
                        tabIndex={copy === 1 ? -1 : undefined}
                        className="group/item flex items-center gap-2.5 rounded-full py-1 pr-4 pl-1 transition hover:bg-white/5 sm:gap-3"
                      >
                        <span className="relative size-7 shrink-0 overflow-hidden rounded-full bg-paper ring-1 ring-gold-soft/30 transition group-hover/item:ring-gold-soft sm:size-9 wide:size-10">
                          <Image src={mediaUrl(img.url)} alt="" fill sizes="40px" className="object-cover" />
                        </span>
                        <span className="leading-tight whitespace-nowrap">
                          <span className="block font-display text-[0.8125rem] text-ivory/90 italic group-hover/item:text-gold-soft sm:text-[0.95rem] wide:text-base">{p.name}</span>
                          <span className="block text-[0.6875rem] text-ivory/50 sm:text-xs">{p.priceFrom > 0 ? `From ${formatPrice(p.priceFrom)}` : 'Price on request'}</span>
                        </span>
                      </Link>
                      <span className="px-3 text-sm text-gold-soft/60 sm:px-4" aria-hidden="true">✦</span>
                    </li>
                  );
                })}
              </ul>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
