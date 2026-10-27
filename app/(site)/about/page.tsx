import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { SectionHeading } from '@/components/site/SectionHeading';
import { getCategories, getSettings } from '@/lib/api';
import { mediaUrl } from '@/lib/utils';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'About Us: Meenakari Woodcraft Maker, Jasdan',
  description: 'Kalgi Handicraft has made Meenakari wooden chowkis, dry fruit boxes and pooja articles in Jasdan, Gujarat since 1999. Manufacturer and wholesaler.',
  alternates: { canonical: '/about' },
};

// Verified from the IndiaMART company profile (checked Oct 2026). Update here if they change.
const TEAM_SIZE = '11 to 25 people';
const BUYER_CITIES = ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Hyderabad', 'Jabalpur'];

export default async function AboutPage() {
  const [s, categories] = await Promise.all([getSettings(), getCategories()]);
  const years = new Date().getFullYear() - s.establishedYear;
  const town = (s.city || 'Jasdan').split(',')[0];
  const designs = categories.reduce((n, c) => n + (c.productCount ?? 0), 0);

  const facts: [string, string][] = [
    ['Founded', String(s.establishedYear)],
    ['Business type', 'Manufacturer and wholesaler'],
    ['Location', [s.city, s.state].filter(Boolean).join(', ')],
    ['Team', TEAM_SIZE],
    ...(s.ownerName ? ([['Proprietor', s.ownerName]] as [string, string][]) : []),
    ...(s.gstNumber ? ([['GSTIN', s.gstNumber]] as [string, string][]) : []),
    ...(s.rating && s.ratingCount ? ([['Buyer rating', `${s.rating}/5 from ${s.ratingCount} ratings${s.ratingSource ? ` (${s.ratingSource})` : ''}`]] as [string, string][]) : []),
  ];

  return (
    <>
      <section className="site-container grid items-center gap-8 py-5 sm:gap-12 sm:py-14 lg:grid-cols-2 lg:gap-20 lg:py-20">
        <div>
          <SectionHeading as="h1" eyebrow="About us" title={<>Meenakari woodcraft from <em className="text-navy">{town}</em></>} />
          <div className="prose-kalgi mt-4 sm:mt-8">
            <p>
              {s.businessName} is a manufacturer in {town}, in the Rajkot district of Gujarat. We started in {s.establishedYear}, which makes this
              our {years}th year of making Meenakari products.
            </p>
            <p>
              We make wooden chowkis and bajots, dry fruit boxes, pooja thalis and other pooja articles
              {designs ? `, with ${designs} designs listed on this website` : ''}. Our team of {TEAM_SIZE} works from our own unit, and we sell
              wholesale to shops, resellers and buyers ordering in bulk.
            </p>
            <p>
              Buyers have ordered from us from cities including {BUYER_CITIES.slice(0, -1).join(', ')} and {BUYER_CITIES[BUYER_CITIES.length - 1]}.
            </p>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:mt-8 sm:flex sm:gap-3">
            <Link href="/contact" className="inline-flex items-center justify-center rounded-full bg-navy px-4 py-2.5 text-sm font-semibold text-ivory hover:bg-navy-deep sm:px-7 sm:py-3.5 sm:text-base">Contact us</Link>
            {categories[0] && (
              <Link href={`/${categories[0].slug}`} className="inline-flex items-center justify-center rounded-full border border-ink/20 px-4 py-2.5 text-sm font-semibold text-ink hover:border-navy sm:px-7 sm:py-3.5 sm:text-base">
                <span className="sm:hidden">Products</span><span className="hidden sm:inline">See our products</span>
              </Link>
            )}
          </div>
        </div>
        <div className="arch arch-ring relative mx-auto aspect-[4/5] w-full max-w-[20rem] bg-paper shadow-lift sm:max-w-sm lg:max-w-none">
          {s.aboutImage && <Image src={mediaUrl(s.aboutImage)} alt={`Meenakari work by ${s.businessName}`} fill priority sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />}
        </div>
      </section>

      <section className="border-y border-line bg-paper">
        <div className="site-container py-8 sm:py-14">
          <h2 className="text-lg text-ink sm:text-3xl">Company facts</h2>
          <dl className="mt-3 grid gap-x-10 sm:grid-cols-2">
            {facts.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[6.5rem_1fr] gap-3 border-b border-line py-3.5 text-sm xs:grid-cols-[8rem_1fr] sm:grid-cols-[9rem_1fr] sm:gap-4 sm:text-base">
                <dt className="text-muted">{k}</dt>
                <dd className="font-medium text-ink">{v}</dd>
              </div>
            ))}
          </dl>
          {s.ratingUrl && (
            <p className="mt-6 text-sm text-muted">
              Ratings are from buyers on{' '}
              <a href={s.ratingUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-navy underline underline-offset-4">
                {s.ratingSource || 'our marketplace profile'}
              </a>
              . You can check our GSTIN on the government GST portal.
            </p>
          )}
        </div>
      </section>

      {categories.length > 0 && (
        <section className="site-container py-8 sm:py-20">
          <h2 className="text-lg text-ink sm:text-3xl">What we make</h2>
          <ul className="mt-4 grid gap-2.5 sm:mt-8 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <li key={c._id}>
                <Link href={`/${c.slug}`} className="flex items-center justify-between rounded-xl border border-line bg-white/50 px-4 py-3 text-sm transition hover:border-navy sm:rounded-2xl sm:px-5 sm:py-4 sm:text-base">
                  <span className="font-medium text-ink">{c.name}</span>
                  <span className="text-sm text-muted">{c.productCount ?? 0} designs</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
