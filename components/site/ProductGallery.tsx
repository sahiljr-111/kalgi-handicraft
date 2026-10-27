'use client';

import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ProductImage } from '@/lib/types';
import { cn, mediaUrl } from '@/lib/utils';

export function ProductGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [lens, setLens] = useState<{ x: number; y: number } | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const current = images[index];

  const go = useCallback((d: number) => setIndex((i) => (i + d + images.length) % images.length), [images.length]);

  useEffect(() => {
    if (!lightbox) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(false);
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [lightbox, go]);

  if (!current) {
    return <div className="jaal grid aspect-square place-items-center rounded-3xl bg-navy text-ivory/70">Photos coming soon</div>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[84px_1fr] lg:gap-5">
      <div className="order-2 flex gap-3 overflow-x-auto pb-1 lg:order-1 lg:flex-col" role="tablist" aria-label="Product photos">
        {images.map((img, i) => (
          <button
            key={img.url}
            role="tab"
            aria-selected={i === index}
            aria-label={`Show photo ${i + 1}`}
            onClick={() => setIndex(i)}
            className={cn(
              'relative aspect-square w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-paper transition lg:w-full',
              i === index ? 'border-navy' : 'border-transparent opacity-70 hover:opacity-100',
            )}
          >
            <Image src={mediaUrl(img.url)} alt="" fill sizes="84px" className="object-cover" />
          </button>
        ))}
      </div>

      <div className="order-1 lg:order-2">
        <button
          type="button"
          onClick={() => setLightbox(true)}
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setLens({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
          }}
          onMouseLeave={() => setLens(null)}
          className="group relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-3xl bg-paper"
        >
          <Image
            src={mediaUrl(current.url)}
            alt={current.alt || name}
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover transition-transform duration-200 ease-out"
            style={lens ? { transform: 'scale(1.9)', transformOrigin: `${lens.x}% ${lens.y}%` } : undefined}
          />
          <span className="pointer-events-none absolute right-4 bottom-4 flex items-center gap-1.5 rounded-full bg-ink/70 px-3 py-1.5 text-xs font-medium text-ivory opacity-0 backdrop-blur transition group-hover:opacity-100 max-lg:opacity-100">
            <ZoomIn className="size-3.5" /> <span className="hidden lg:inline">Hover to zoom · click to expand</span><span className="lg:hidden">Tap to expand</span>
          </span>
        </button>
      </div>

      {lightbox && (
        <div role="dialog" aria-modal="true" aria-label={`${name} photos`} className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/95 p-4">
          <button ref={closeRef} onClick={() => setLightbox(false)} className="absolute top-4 right-4 grid size-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Close">
            <X />
          </button>
          {images.length > 1 && (
            <>
              <button onClick={() => go(-1)} className="absolute left-3 grid size-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Previous photo"><ChevronLeft /></button>
              <button onClick={() => go(1)} className="absolute right-3 grid size-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Next photo"><ChevronRight /></button>
            </>
          )}
          <div className="relative aspect-square w-full max-w-[min(90vh,900px)]">
            <Image src={mediaUrl(current.url)} alt={current.alt || name} fill sizes="90vw" className="object-contain" />
          </div>
          <p className="absolute bottom-5 text-sm text-white/70">{index + 1} / {images.length}</p>
        </div>
      )}
    </div>
  );
}
