'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import type { GalleryItem } from '@/lib/types';
import { cn, mediaUrl } from '@/lib/utils';

export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const cats = useMemo(() => {
    const m = new Map<string, string>();
    items.forEach((i) => i.category && m.set(i.category.slug, i.category.name));
    return [...m.entries()];
  }, [items]);
  const [active, setActive] = useState<string>('all');
  const visible = active === 'all' ? items : items.filter((i) => i.category?.slug === active);

  return (
    <>
      <div className="mb-10 flex flex-wrap justify-center gap-2" role="group" aria-label="Filter by collection">
        {[['all', 'All work'] as [string, string], ...cats].map(([slug, name]) => (
          <button
            key={slug}
            onClick={() => setActive(slug)}
            aria-pressed={active === slug}
            className={cn(
              'rounded-full border px-4 py-2 text-sm transition',
              active === slug ? 'border-navy bg-navy text-ivory' : 'border-line text-ink-soft hover:border-navy/40',
            )}
          >
            {name}
          </button>
        ))}
      </div>
      <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
        {visible.map((item) => (
          <figure key={item._id} className="group mb-5 break-inside-avoid overflow-hidden rounded-2xl bg-paper">
            <div className="overflow-hidden">
              <Image
                src={mediaUrl(item.image)}
                alt={item.title}
                width={800}
                height={800}
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="h-auto w-full transition duration-700 group-hover:scale-[1.03]"
              />
            </div>
            <figcaption className="px-5 py-4">
              <p className="font-display text-lg text-ink">{item.title}</p>
              {item.caption && <p className="mt-0.5 text-sm text-muted">{item.caption}</p>}
            </figcaption>
          </figure>
        ))}
      </div>
    </>
  );
}
