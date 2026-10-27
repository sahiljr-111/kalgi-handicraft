import { ArrowRight, BadgeCheck, CalendarDays, Factory, Star, Store } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { PostCard } from '@/components/site/BlogIndex';
import { Hero } from '@/components/site/Hero';
import { ProductCard } from '@/components/site/ProductCard';
import { SectionHeading } from '@/components/site/SectionHeading';
import { WhatsAppButton } from '@/components/site/WhatsAppButton';
import { getBlogPosts, getCategories, getProducts, getSettings } from '@/lib/api';
import { cn, mediaUrl } from '@/lib/utils';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: { absolute: 'Kalgi Handicraft | Meenakari Chowki & Dry Fruit Box Maker' },
  alternates: { canonical: '/' },
};

export default async function HomePage() {
  const [settings, categories, featured, hero, posts] = await Promise.all([
    getSettings(),
    getCategories(),
    getProducts({ featured: 'true', limit: 12, sort: 'updated' }),
    getProducts({ hero: 'true', limit: 4, sort: 'updated' }),
    getBlogPosts(3),
  ]);
  const featuredItems = featured.items.length ? featured.items : (await getProducts({ limit: 8 })).items;
  const town = (settings.city || 'Jasdan').split(',')[0];
  // Every line here is a verified fact (IndiaMART profile / GST record). See docs/SEO-AUDIT.md.
  const reasons = [
    { icon: Factory, title: 'Made in our own unit', text: `We are a manufacturer in ${town}, ${settings.state || 'Gujarat'}, making these products since ${settings.establishedYear}.` },
    { icon: Store, title: 'Wholesale, direct', text: 'You buy from the maker, not a trader, so prices are for bulk quantities straight from the source.' },
    {
      icon: BadgeCheck,
      title: 'GST-registered',
      text: settings.gstNumber ? `GSTIN ${settings.gstNumber}. You can check it on the government GST portal before you order.` : 'A GST-registered business.',
    },
    ...(settings.rating && settings.ratingCount
      ? [{ icon: Star, title: `${settings.rating}/5 from buyers`, text: `Average of ${settings.ratingCount} buyer ratings${settings.ratingSource ? ` on ${settings.ratingSource}` : ''}.` }]
      : []),
  ];

  return (
    <>
      <Hero settings={settings} categories={categories} featured={featuredItems} heroProducts={hero.items} />

      {/* Trust bar */}
      <section aria-label="Why buyers trust us" className="border-y border-line bg-paper">
        <ul className="site-container grid grid-cols-2 gap-x-3 gap-y-3 py-4 xs:gap-x-4 sm:gap-y-5 sm:py-7 lg:grid-cols-4">
          {[
            { icon: CalendarDays, big: `Since ${settings.establishedYear}`, small: `Manufacturer in ${town}` },
            { icon: BadgeCheck, big: 'GST registered', small: 'Verified business' },
            ...(settings.rating && settings.ratingCount
              ? [{ icon: Star, big: `${settings.rating}/5 rating`, small: `${settings.ratingCount} buyer ratings${settings.ratingSource ? ` on ${settings.ratingSource}` : ''}` }]
              : []),
            { icon: Store, big: 'Any quantity', small: 'Wholesale prices for bulk' },
          ].map(({ icon: Icon, big, small }) => (
            <li key={big} className="flex items-center gap-3 lg:justify-center">
              <span className="hidden size-11 shrink-0 place-items-center rounded-full bg-ivory text-navy sm:grid"><Icon className="size-5" /></span>
              <span><span className="block text-sm leading-tight font-semibold text-ink sm:font-display sm:text-lg sm:font-normal">{big}</span><span className="text-[0.6875rem] leading-tight text-muted sm:text-sm">{small}</span></span>
            </li>
          ))}
        </ul>
      </section>

      {/* Collections: compact arches so every collection is visible at a glance */}
      <section className="site-container py-8 sm:py-20 lg:py-24">
        <SectionHeading
          eyebrow="Our collections"
          title="Every craft, one workshop"
          intro="Wooden chowkis, dry fruit boxes, pooja articles and more, made in our Jasdan unit and sold wholesale."
          align="center"
        />
        <ul
          className={cn(
            'm-rail mx-auto mt-5 grid grid-cols-3 sm:mt-12 sm:gap-x-6 sm:gap-y-8',
            categories.length <= 4 ? 'max-w-4xl md:grid-cols-4' : categories.length === 5 ? 'md:grid-cols-5' : 'lg:grid-cols-6',
          )}
        >
          {categories.map((c) => (
            <li key={c._id} className="w-[29%] xs:w-[27%] sm:w-auto">
              <Link href={`/${c.slug}`} className="group block text-center">
                <div className="arch arch-ring relative mx-auto aspect-[4/5] w-full max-w-[13rem] bg-paper transition duration-500 group-hover:-translate-y-1.5 group-hover:shadow-lift">
                  {c.image && (
                    <Image
                      src={mediaUrl(c.image)}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 200px, 33vw"
                      className="object-cover transition duration-700 group-hover:scale-105"
                    />
                  )}
                </div>
                <h3 className="mt-2 font-sans text-[0.8125rem] leading-tight font-medium text-balance text-ink transition group-hover:text-gold sm:mt-4 sm:font-display sm:text-lg sm:leading-snug sm:font-normal">{c.name}</h3>
                <p className="mt-0.5 text-[0.6875rem] text-muted sm:text-sm">
                  <span className="relative">
                    {c.productCount ?? 0} designs
                    <span className="absolute top-0 left-full ml-1 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" aria-hidden="true">→</span>
                  </span>
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Featured */}
      <section className="bg-paper py-8 sm:py-20 lg:py-28">
        <div className="site-container">
          <div className="flex items-end justify-between gap-4 sm:flex-wrap sm:gap-6">
            <SectionHeading eyebrow="Top selling" title="Our top selling products" />
            <Link href="/contact" className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-navy transition-all hover:gap-3 sm:gap-2 sm:text-base"><span className="sm:hidden">Ask us</span><span className="hidden sm:inline">Ask about a design</span> <ArrowRight className="size-4" /></Link>
          </div>
          <div className="m-rail mt-5 grid grid-cols-2 sm:mt-12 sm:gap-x-6 sm:gap-y-10 md:grid-cols-3 lg:grid-cols-5">
            {featuredItems.map((p) => (
              <div key={p._id} className="w-[42%] xs:w-[40%] sm:w-auto">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why buy from us: verified facts only */}
      <section data-dark className="relative isolate overflow-hidden bg-navy text-ivory">
        <div aria-hidden="true" className="pattern-khatam absolute inset-0 -z-10 [mask-image:radial-gradient(90%_80%_at_85%_20%,black,transparent_75%)]" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(45%_60%_at_85%_15%,rgb(193_162_95/0.12),transparent_70%)]" />
        <div className="site-container py-9 sm:py-20 lg:py-24">
          <div className="max-w-2xl">
            <p className="eyebrow !text-gold-soft">Why buy from {settings.businessName}</p>
            <h2 className="mt-1.5 text-[1.25rem] leading-snug text-ivory sm:mt-3 sm:text-3xl sm:leading-tight lg:text-4xl">Buy direct from the maker</h2>
          </div>
          <ul className={cn('mt-6 grid grid-cols-2 gap-x-4 gap-y-6 sm:mt-12 sm:gap-x-6 sm:gap-y-8', reasons.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3')}>
            {reasons.map(({ icon: Icon, title, text }) => (
              <li key={title} className="border-t border-gold-soft/40 pt-3 sm:pt-5">
                <Icon className="size-5 text-gold-soft sm:size-6" aria-hidden="true" />
                <h3 className="mt-2 font-sans text-sm leading-snug font-semibold text-ivory sm:mt-3 sm:font-display sm:text-xl sm:font-normal">{title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-ivory/70 sm:mt-1.5 sm:text-base">{text}</p>
              </li>
            ))}
          </ul>
          {settings.ratingUrl && (
            <a href={settings.ratingUrl} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-gold-soft underline-offset-4 hover:underline sm:mt-10">
              Read buyer ratings on {settings.ratingSource || 'the source site'} <ArrowRight className="size-4" />
            </a>
          )}
        </div>
      </section>

      {/* Testimonials */}
      {settings.testimonials.length > 0 && (
        <section className="site-container py-14 sm:py-20 lg:py-28">
          <SectionHeading eyebrow="Kind words" title="From shops, temples and gifting teams" align="center" />
          <div className="mt-8 grid gap-4 sm:mt-14 sm:gap-6 md:grid-cols-3">
            {settings.testimonials.slice(0, 3).map((t) => (
              <figure key={t.name} className="flex flex-col rounded-3xl border border-line bg-white/50 p-5 sm:p-7">
                <div className="flex gap-0.5 text-gold-soft" role="img" aria-label={`${t.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }, (_, i) => <Star key={i} className={`size-4 ${i < t.rating ? 'fill-current' : 'opacity-30'}`} />)}
                </div>
                <blockquote className="mt-4 flex-1 font-display text-lg leading-snug text-ink sm:mt-5 sm:text-xl">“{t.quote}”</blockquote>
                <figcaption className="mt-6 text-sm"><span className="font-semibold text-ink">{t.name}</span>{t.location && <span className="text-muted"> · {t.location}</span>}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* B2B band (own top spacing, since the sections above it can be hidden) */}
      <section className="site-container pt-8 sm:pt-20 lg:pt-24">
        <div className="relative overflow-hidden rounded-2xl bg-gold-soft px-4 py-6 text-navy sm:rounded-[2rem] sm:px-12 sm:py-14 lg:flex lg:items-center lg:justify-between lg:gap-10">
          <div className="pattern-mehrab absolute inset-y-0 right-0 w-1/2 opacity-60 [mask-image:linear-gradient(to_left,black,transparent)]" aria-hidden="true" />
          <div className="relative max-w-xl">
            <p className="eyebrow !text-navy/75">Bulk & wholesale</p>
            <h2 className="mt-1.5 text-[1.25rem] leading-snug text-navy sm:mt-3 sm:text-3xl sm:leading-tight lg:text-4xl">One piece or 5,000?</h2>
            <p className="mt-2 text-[0.8125rem] leading-relaxed text-navy/80 sm:mt-4 sm:text-base">Order any quantity, with wholesale prices for bulk, direct from the manufacturer. Tell us the products, quantity and delivery city, and we will reply with a quote and photos.</p>
          </div>
          <div className="relative mt-5 grid grid-cols-2 gap-2.5 sm:mt-8 sm:flex sm:gap-3 lg:mt-0 lg:shrink-0">
            <Link href="/contact" className="inline-flex items-center justify-center rounded-full bg-navy px-3 py-2.5 text-sm font-semibold text-ivory transition hover:bg-navy-deep sm:px-7 sm:py-3.5 sm:text-base">Send inquiry</Link>
            <WhatsAppButton number={settings.whatsapp} text={`Hi ${settings.businessName}, I'd like wholesale pricing.`} className="px-3 py-2.5 text-sm sm:px-6 sm:py-3 sm:text-base">WhatsApp us</WhatsAppButton>
          </div>
        </div>
      </section>

      {/* Blog teaser */}
      {posts.length > 0 && (
        <section className="site-container pt-8 sm:pt-20 lg:pt-28">
          <div className="flex items-end justify-between gap-4 sm:flex-wrap sm:gap-6">
            <SectionHeading eyebrow="Blogs" title="Guides from our workshop" />
            <Link href="/blog" className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-navy sm:gap-2 sm:text-base">All blogs <ArrowRight className="size-4" /></Link>
          </div>
          <div className="m-rail mt-5 grid sm:mt-12 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-12 md:grid-cols-3">
            {posts.map((p) => (
              <div key={p._id} className="w-[78%] sm:w-auto">
                <PostCard post={p} />
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
