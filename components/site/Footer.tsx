import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';
import type { CategoryRef, Settings } from '@/lib/types';
import { addressLines } from '@/lib/utils';
import { Logo } from './Logo';

/** Large, faint mandala outline in the bottom-right corner. */
function FooterMandala() {
  const petals = (n: number, r: number, rx: number, ry: number) =>
    Array.from({ length: n }, (_, i) => <ellipse key={i} cx="0" cy={-r} rx={rx} ry={ry} transform={`rotate(${(360 / n) * i})`} />);
  return (
    <svg
      viewBox="-300 -300 600 600"
      aria-hidden="true"
      className="pointer-events-none absolute -right-40 -bottom-56 -z-10 hidden w-[36rem] text-gold-soft opacity-[0.14] md:block laptop:w-[42rem]"
    >
      <g fill="none" stroke="currentColor" strokeWidth="1.3">
        <circle r="292" />
        <circle r="270" strokeDasharray="2 10" />
        {petals(32, 238, 14, 34)}
        <circle r="200" />
        {petals(16, 160, 26, 52)}
        <circle r="104" strokeDasharray="1 7" />
        {petals(8, 62, 18, 40)}
      </g>
    </svg>
  );
}

export function Footer({ settings, categories, showGallery = false }: { settings: Settings; categories: CategoryRef[]; showGallery?: boolean }) {
  const address = addressLines(settings);
  const year = new Date().getFullYear();
  return (
    <footer data-dark className="relative isolate mt-24 overflow-hidden bg-navy text-ivory/85">
      <div className="meena-band" />
      <div aria-hidden="true" className="pattern-bandhani absolute inset-0 top-3 -z-10 [mask-image:linear-gradient(to_bottom,black,transparent_90%)]" />
      <FooterMandala />
      <div>
        <div className="site-container grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
          <div>
            <Logo onDark className="h-14" />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-ivory/70">
              {settings.tagline}. Wholesale supplier since {settings.establishedYear}.
            </p>
            {settings.gstNumber && <p className="mt-4 text-xs tracking-wide text-ivory/55">GSTIN: {settings.gstNumber}</p>}
          </div>

          <div>
            <h2 className="mb-4 font-sans text-xs font-semibold tracking-[0.18em] text-gold-soft uppercase">Collections</h2>
            <ul className="grid gap-2.5 text-sm">
              {categories.map((c) => (
                <li key={c._id}>
                  <Link href={`/${c.slug}`} className="hover:text-white">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-4 font-sans text-xs font-semibold tracking-[0.18em] text-gold-soft uppercase">Company</h2>
            <ul className="grid gap-2.5 text-sm">
              <li><Link href="/about" className="hover:text-white">About us</Link></li>
              {showGallery && <li><Link href="/gallery" className="hover:text-white">Gallery</Link></li>}
              <li><Link href="/blog" className="hover:text-white">Blogs</Link></li>
              <li><Link href="/contact" className="hover:text-white">Contact & location</Link></li>
              {settings.social.indiamart && (
                <li><a href={settings.social.indiamart} target="_blank" rel="noopener noreferrer" className="hover:text-white">Find us on IndiaMART</a></li>
              )}
            </ul>
          </div>

          <address className="not-italic">
            <h2 className="mb-4 font-sans text-xs font-semibold tracking-[0.18em] text-gold-soft uppercase">Visit or call</h2>
            <ul className="grid gap-3.5 text-sm">
              {address.length > 0 && (
                <li className="flex gap-3"><MapPin className="mt-0.5 size-4 shrink-0 text-gold-soft" /><span>{address.map((l) => <span key={l} className="block">{l}</span>)}</span></li>
              )}
              {settings.phone && (
                <li className="flex gap-3"><Phone className="mt-0.5 size-4 shrink-0 text-gold-soft" /><a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="hover:text-white">{settings.phone}</a></li>
              )}
              {settings.email && (
                <li className="flex gap-3"><Mail className="mt-0.5 size-4 shrink-0 text-gold-soft" /><a href={`mailto:${settings.email}`} className="hover:text-white">{settings.email}</a></li>
              )}
              {settings.hours.map((h) => (
                <li key={h.days} className="flex gap-3"><Clock className="mt-0.5 size-4 shrink-0 text-gold-soft" /><span><span className="text-ivory">{h.days}</span><br />{h.hours}</span></li>
              ))}
            </ul>
          </address>
        </div>
        <div className="border-t border-white/10">
          <div className="site-container flex flex-col gap-2 py-6 text-xs text-ivory/55 sm:flex-row sm:justify-between">
            <p>© {year} {settings.businessName}, {settings.city || 'Gujarat'}, India.</p>
            <p>Colours may vary slightly from photographs.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
