'use client';

import { BookOpen, ChevronRight, House, LayoutGrid, Phone, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { trackEvent } from '@/lib/client';
import type { CategoryRef } from '@/lib/types';
import { cn, whatsappLink } from '@/lib/utils';
import { WhatsAppIcon } from './WhatsAppIcon';

interface Props {
  categories: CategoryRef[];
  whatsapp: string;
  businessName: string;
}

/**
 * App-style bottom navigation for phones (hidden from 640px up). "Shop" opens
 * a sheet with the collections. Product pages show their own action bar, so
 * the tab bar steps aside there.
 */
export function MobileTabBar({ categories, whatsapp, businessName }: Props) {
  const pathname = usePathname();
  const [shopOpen, setShopOpen] = useState(false);

  useEffect(() => setShopOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = shopOpen ? 'hidden' : '';
  }, [shopOpen]);

  if (pathname.startsWith('/product/')) return null;

  const inCollection = categories.some((c) => pathname === `/${c.slug}`);
  const tab = (active: boolean) =>
    cn('flex h-full flex-1 flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium transition', active ? 'text-navy' : 'text-muted');
  const dot = (active: boolean) => cn('grid h-7 w-12 place-items-center rounded-full transition', active && 'bg-gold-soft/25');

  return (
    <>
      {shopOpen && (
        <div className="fixed inset-0 z-[55] sm:hidden" role="dialog" aria-modal="true" aria-label="Collections">
          <button type="button" aria-label="Close" className="absolute inset-0 bg-ink/40" onClick={() => setShopOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[75vh] overflow-y-auto rounded-t-3xl bg-ivory pb-[calc(4.5rem+env(safe-area-inset-bottom))] shadow-[0_-12px_40px_-12px_rgb(0_0_0/0.35)]">
            <div className="sticky top-0 flex items-center justify-between bg-ivory px-4 pt-3 pb-2">
              <span className="mx-auto h-1 w-10 rounded-full bg-line" aria-hidden="true" />
            </div>
            <div className="flex items-center justify-between px-4 pb-2">
              <p className="font-display text-lg text-ink">Shop by collection</p>
              <button type="button" onClick={() => setShopOpen(false)} className="grid size-9 place-items-center rounded-full hover:bg-paper" aria-label="Close collections">
                <X className="size-5" />
              </button>
            </div>
            <ul className="px-2">
              {categories.map((c) => (
                <li key={c._id}>
                  <Link href={`/${c.slug}`} className="flex items-center justify-between rounded-xl px-3 py-3 text-[0.9375rem] text-ink active:bg-paper">
                    {c.name} <ChevronRight className="size-4 text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <nav
        aria-label="Quick navigation"
        className="fixed inset-x-0 bottom-0 z-[56] border-t border-line bg-ivory/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
      >
        <div className="flex h-16 items-stretch">
          <Link href="/" className={tab(pathname === '/')} aria-current={pathname === '/' ? 'page' : undefined}>
            <span className={dot(pathname === '/')}><House className="size-5" /></span>
            Home
          </Link>
          <button type="button" onClick={() => setShopOpen((o) => !o)} className={tab(shopOpen || inCollection)} aria-expanded={shopOpen}>
            <span className={dot(shopOpen || inCollection)}><LayoutGrid className="size-5" /></span>
            Shop
          </button>
          <Link href="/blog" className={tab(pathname.startsWith('/blog'))} aria-current={pathname.startsWith('/blog') ? 'page' : undefined}>
            <span className={dot(pathname.startsWith('/blog'))}><BookOpen className="size-5" /></span>
            Blogs
          </Link>
          <Link href="/contact" className={tab(pathname === '/contact')} aria-current={pathname === '/contact' ? 'page' : undefined}>
            <span className={dot(pathname === '/contact')}><Phone className="size-5" /></span>
            Contact
          </Link>
          {whatsapp && (
            <a
              href={whatsappLink(whatsapp, `Hi ${businessName}, I'd like to know more about your products.`)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('whatsapp_click')}
              className={cn(tab(false), 'text-whatsapp')}
            >
              <span className="grid h-7 w-12 place-items-center rounded-full bg-whatsapp text-white"><WhatsAppIcon className="size-4" /></span>
              WhatsApp
            </a>
          )}
        </div>
      </nav>
    </>
  );
}
