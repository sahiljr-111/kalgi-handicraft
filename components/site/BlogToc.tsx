'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export interface TocItem {
  id: string;
  text: string;
}

/** "In this blog" links. Highlights the section currently being read. */
export function BlogToc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter((e): e is HTMLElement => Boolean(e));
    if (!els.length) return;
    const onScroll = () => {
      // The last heading that has scrolled past the top third of the screen.
      const line = window.innerHeight * 0.3;
      let current = els[0].id;
      for (const el of els) if (el.getBoundingClientRect().top - line <= 0) current = el.id;
      setActive(current);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [items]);

  return (
    <ol className="grid border-l border-line text-sm">
      {items.map((h) => (
        <li key={h.id}>
          <a
            href={`#${h.id}`}
            aria-current={active === h.id ? 'location' : undefined}
            className={cn(
              '-ml-px block border-l-2 py-1.5 pl-3 leading-snug transition',
              active === h.id ? 'border-gold font-medium text-ink' : 'border-transparent text-muted hover:text-ink',
            )}
          >
            {h.text}
          </a>
        </li>
      ))}
    </ol>
  );
}
