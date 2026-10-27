'use client';

import { ChevronDown, Menu, Phone, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { CategoryRef } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Logo } from './Logo';

interface Props {
  businessName?: string;
  phone: string;
  categories: CategoryRef[];
  /** The gallery link only appears once real project photos have been added. */
  showGallery?: boolean;
}

const ALL_LINKS = [
  { href: '/about', label: 'About' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/blog', label: 'Blogs' },
  { href: '/contact', label: 'Contact' },
];

export function Header({ phone, categories, showGallery = false }: Props) {
  const LINKS = showGallery ? ALL_LINKS : ALL_LINKS.filter((l) => l.href !== '/gallery');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header data-dark className={cn('sticky top-0 z-50 transition-shadow', scrolled && 'shadow-[0_10px_30px_-18px_rgb(0_0_0/0.6)]')}>
      <div className="meena-band" />
      <div className="border-b border-white/10 bg-navy">
        <div className="site-container flex h-14 items-center justify-between gap-4 sm:h-[4.5rem]">
          <Logo onDark priority className="h-9 sm:h-12" />

          <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
            <Link
              href="/"
              aria-current={pathname === '/' ? 'page' : undefined}
              className={cn('rounded-full px-4 py-2 text-[0.95rem] font-medium transition hover:text-gold-soft', pathname === '/' ? 'text-gold-soft' : 'text-ivory/80')}
            >
              Home
            </Link>
            <div className="group relative">
              <button
                className="flex items-center gap-1 rounded-full px-4 py-2 text-[0.95rem] font-medium text-ivory/80 transition hover:text-gold-soft"
                aria-haspopup="true"
              >
                Collections <ChevronDown className="size-4 transition group-hover:rotate-180" />
              </button>
              <div className="invisible absolute top-full left-0 w-72 translate-y-1 pt-2 opacity-0 transition group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                <ul className="rounded-2xl border border-white/10 bg-navy-deep p-2 shadow-lift">
                  {categories.map((c) => (
                    <li key={c._id}>
                      <Link href={`/${c.slug}`} className="block rounded-xl px-4 py-2.5 text-ivory/80 transition hover:bg-white/5 hover:text-gold-soft">
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={isActive(l.href) ? 'page' : undefined}
                className={cn(
                  'rounded-full px-4 py-2 text-[0.95rem] font-medium transition hover:text-gold-soft',
                  isActive(l.href) ? 'text-gold-soft' : 'text-ivory/80',
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {phone && (
              <a
                href={`tel:${phone.replace(/\s/g, '')}`}
                className="hidden items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-ivory/80 transition hover:border-gold-soft/60 hover:text-gold-soft md:flex"
              >
                <Phone className="size-4 text-gold-soft" /> {phone}
              </a>
            )}
            <button
              onClick={() => setOpen((o) => !o)}
              className="grid size-10 place-items-center rounded-full text-ivory hover:bg-white/10 sm:size-11 lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? 'Close menu' : 'Open menu'}
            >
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div id="mobile-nav" className="fixed inset-x-0 top-[calc(3.5rem+12px)] bottom-0 overflow-y-auto bg-navy-deep sm:top-[calc(4.5rem+12px)] lg:hidden">
          <nav aria-label="Mobile" className="px-4 pt-4 pb-[calc(5rem+env(safe-area-inset-bottom))] sm:py-6">
            <Link href="/" aria-current={pathname === '/' ? 'page' : undefined} className="mb-4 block rounded-xl px-3 py-3 text-lg text-ivory/75 hover:bg-white/5">
              Home
            </Link>
            <p className="eyebrow mb-3 !text-gold-soft">Collections</p>
            <ul className="mb-6 grid gap-1">
              {categories.map((c) => (
                <li key={c._id}>
                  <Link href={`/${c.slug}`} className="block rounded-xl px-3 py-3 font-display text-xl text-ivory hover:bg-white/5">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mb-6 h-px bg-gold-soft/30" />
            <ul className="grid gap-1">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="block rounded-xl px-3 py-3 text-lg text-ivory/75 hover:bg-white/5">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/contact" className="mt-6 flex justify-center rounded-full bg-gold-soft px-5 py-3.5 font-semibold text-navy">
              Get a bulk quote
            </Link>
            {phone && (
              <a href={`tel:${phone.replace(/\s/g, '')}`} className="mt-3 flex items-center justify-center gap-2 py-2 text-ivory/75">
                <Phone className="size-4" /> {phone}
              </a>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
