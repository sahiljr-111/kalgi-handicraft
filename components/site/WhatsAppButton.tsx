'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { trackEvent } from '@/lib/client';
import { cn, whatsappLink } from '@/lib/utils';
import { WhatsAppIcon } from './WhatsAppIcon';

interface Props {
  number: string;
  text: string;
  productSlug?: string;
  className?: string;
  children?: React.ReactNode;
}

export function WhatsAppButton({ number, text, productSlug, className, children }: Props) {
  if (!number) return null;
  return (
    <a
      href={whatsappLink(number, text)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent('whatsapp_click', productSlug)}
      data-cta-zone
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full bg-whatsapp px-6 py-3 font-semibold text-white transition hover:bg-[#0b6534] active:scale-[0.98]',
        className,
      )}
    >
      <WhatsAppIcon />
      {children ?? 'Enquire on WhatsApp'}
    </a>
  );
}

/**
 * Floating WhatsApp CTA. Shown only when no other inquiry button or form
 * (anything marked `data-cta-zone`) is on screen, so visitors never see the
 * same call-to-action twice. E.g. on the home page it appears once the hero
 * buttons scroll out of view.
 */
export function WhatsAppFab({ number, businessName }: { number: string; businessName: string }) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScreen = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) onScreen.add(e.target);
          else onScreen.delete(e.target);
        }
        setVisible(onScreen.size === 0);
      },
      { threshold: 0 },
    );
    // Wait a frame so the new page's content is in the DOM after navigation.
    const raf = requestAnimationFrame(() => {
      const zones = document.querySelectorAll('[data-cta-zone]');
      if (!zones.length) setVisible(true);
      zones.forEach((z) => io.observe(z));
    });
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [pathname]);

  if (!number) return null;
  return (
    <a
      href={whatsappLink(number, `Hi ${businessName}, I'd like to know more about your products.`)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent('whatsapp_click')}
      aria-hidden={!visible || undefined}
      tabIndex={visible ? undefined : -1}
      className={cn(
        'group fixed right-4 bottom-4 z-40 flex items-center max-sm:hidden gap-2 rounded-full bg-whatsapp p-3.5 text-white shadow-lift transition duration-300 ease-out hover:bg-[#0b6534] sm:right-6 sm:bottom-6 sm:pr-5',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0',
      )}
    >
      <WhatsAppIcon className="size-7" />
      <span className="sr-only text-sm font-semibold sm:not-sr-only">Chat on WhatsApp</span>
    </a>
  );
}
