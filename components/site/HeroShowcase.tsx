'use client';

import { ArrowUpRight, Pause, Play } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { cn, mediaUrl } from '@/lib/utils';

export interface Slide {
  url: string;
  alt: string;
  name: string;
  meta: string; // e.g. "From ₹750 per set"
  label: string; // e.g. category name
  href: string;
}

interface Props {
  slides: Slide[];
  chips: { top: string; side: string };
  className?: string;
}

const INTERVAL = 4500;

/** A slowly turning Meenakari medallion drawn in gold line-work. */
function Mandala({ className }: { className?: string }) {
  const petals = (n: number, r: number, rx: number, ry: number) =>
    Array.from({ length: n }, (_, i) => <ellipse key={i} cx="0" cy={-r} rx={rx} ry={ry} transform={`rotate(${(360 / n) * i})`} />);
  return (
    <svg viewBox="-300 -300 600 600" className={className} aria-hidden="true">
      <g fill="none" stroke="#c1a25f" strokeWidth="1.2">
        <circle r="292" strokeOpacity="0.28" />
        <circle r="270" strokeDasharray="2 10" strokeOpacity="0.45" />
        <g strokeOpacity="0.35">{petals(32, 238, 14, 34)}</g>
        <circle r="200" strokeOpacity="0.3" />
        <g strokeOpacity="0.4">{petals(16, 160, 26, 52)}</g>
        <circle r="104" strokeDasharray="1 7" strokeOpacity="0.5" />
      </g>
    </svg>
  );
}

/**
 * An arched frame that cross-fades between slides. Only the current image and
 * the one fading out are rendered, to keep the page light.
 */
function Frame({
  slides,
  active,
  sizes,
  priority,
  interactive = true,
  className,
}: {
  slides: Slide[];
  active: number;
  sizes: string;
  priority?: boolean;
  interactive?: boolean;
  className: string;
}) {
  const n = slides.length;
  // Only the current slide and the one fading out are rendered.
  const keep = new Set([active, (active - 1 + n) % n]);
  const current = slides[active];
  const images = slides.map((s, i) =>
    keep.has(i) ? (
      <Image
        key={s.url + i}
        src={mediaUrl(s.url)}
        alt={i === active ? s.alt : ''}
        fill
        priority={priority && i === active}
        sizes={sizes}
        className={cn(
          'object-cover transition-[opacity,transform] duration-[900ms] ease-out',
          interactive && 'group-hover/frame:scale-[1.05]',
          i === active ? 'opacity-100' : 'opacity-0',
        )}
      />
    ) : null,
  );
  const shell = cn('arch arch-ring absolute overflow-hidden bg-paper ring-1 ring-gold-soft/30', className);
  // Soft floor shadow inside the frame, for depth.
  const shade = <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgb(30_31_51/0.22),transparent_38%)]" />;

  if (!interactive) {
    return (
      <div aria-hidden="true" className={shell}>
        {images}
        {shade}
      </div>
    );
  }
  return (
    <Link
      href={current.href}
      aria-label={`${current.name}, ${current.meta}`}
      className={cn(shell, 'group/frame shadow-[0_28px_60px_-24px_rgb(0_0_0/0.75)] transition duration-500 ease-out hover:-translate-y-1 hover:ring-gold-soft/70')}
    >
      {images}
      {shade}
    </Link>
  );
}

/**
 * Hero product showcase: a main arched frame with two smaller frames behind it,
 * cycling through featured products (no pointer parallax). The caption underneath names the product
 * in the main frame and links to it. Pauses on hover/focus and via the pause
 * button; static for reduced-motion users.
 */
export function HeroShowcase({ slides, chips, className }: Props) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [reduced, setReduced] = useState(false);
  const n = slides.length;

  useEffect(() => setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches), []);

  const next = useCallback(() => setIndex((i) => (i + 1) % n), [n]);

  // Start rotating after the visitor's first interaction (or 10s). Swapping
  // images before that would keep moving the page's Largest Contentful Paint.
  const [started, setStarted] = useState(false);
  useEffect(() => {
    const start = () => setStarted(true);
    const events = ['pointermove', 'pointerdown', 'scroll', 'keydown', 'touchstart'] as const;
    events.forEach((e) => window.addEventListener(e, start, { once: true, passive: true }));
    const t = setTimeout(start, 10_000);
    return () => {
      clearTimeout(t);
      events.forEach((e) => window.removeEventListener(e, start));
    };
  }, []);

  useEffect(() => {
    if (n < 2 || !started || paused || hovering || reduced) return;
    const id = setInterval(() => document.visibilityState === 'visible' && next(), INTERVAL);
    return () => clearInterval(id);
  }, [n, started, paused, hovering, reduced, next]);

  if (!n) return null;
  const at = (offset: number) => (index + offset) % n;
  const main = slides[at(0)];

  return (
    <div
      className={cn('relative mx-auto aspect-[10/11]', className)}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocus={() => setHovering(true)}
      onBlur={() => setHovering(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured products"
    >
      {/* Stage: 0–66% of the height. Caption: below it. */}
      <div className="absolute inset-x-0 top-0 h-[66%]">
        <div className="pointer-events-none absolute inset-0">
          <Mandala className="absolute top-1/2 left-1/2 w-[112%] max-w-none -translate-x-1/2 -translate-y-1/2 animate-spin-slow opacity-80" />
        </div>

        {/* Side frames: the next two products, behind the main frame (decorative). */}
        <div className="absolute inset-0">
          <Frame
            slides={slides}
            active={at(2)}
            interactive={false}
            sizes="(min-width: 1024px) 130px, 28vw"
            className="bottom-[2%] left-[2%] aspect-[5/6] w-[29%] opacity-90 animate-hero-rise [animation-delay:200ms]"
          />
        </div>
        <div className="absolute inset-0">
          <Frame
            slides={slides}
            active={at(1)}
            interactive={false}
            sizes="(min-width: 1024px) 130px, 28vw"
            className="top-[8%] right-[2%] aspect-[5/6] w-[29%] opacity-90 animate-hero-rise [animation-delay:350ms]"
          />
        </div>

        {/* Main frame */}
        <div className="absolute inset-0">
          <Frame
            slides={slides}
            active={at(0)}
            priority
            sizes="(min-width: 1024px) 260px, 52vw"
            className="top-0 left-1/2 aspect-[5/6] h-full -translate-x-1/2"
          />
        </div>

        <div className="pointer-events-none absolute inset-0">
          <span className="absolute top-[3%] left-[4%] animate-float rounded-full bg-ivory/95 px-2.5 py-1 text-[0.7rem] font-semibold text-navy shadow-lg sm:px-3 sm:py-1.5 sm:text-xs">
            {chips.top}
          </span>
          <span className="absolute right-[3%] bottom-[10%] animate-float rounded-full bg-gold-soft px-2.5 py-1 text-[0.7rem] font-semibold text-navy shadow-lg [animation-delay:-3s] sm:px-3 sm:py-1.5 sm:text-xs">
            {chips.side}
          </span>
        </div>
      </div>

      {/* Caption: names the product in the main frame */}
      <div className="absolute inset-x-0 bottom-0 flex h-[30%] flex-col items-center justify-end text-center">
        <p className="text-[0.65rem] font-semibold tracking-[0.2em] text-gold-soft uppercase" aria-live={paused || hovering ? 'polite' : 'off'}>
          {main.label}
        </p>
        <Link
          href={main.href}
          className="group/cap mt-1.5 line-clamp-2 max-w-full font-display text-lg leading-tight text-balance text-ivory transition hover:text-gold-soft sm:text-xl laptop:text-[1.35rem] wide:text-2xl"
        >
          {main.name}
          <ArrowUpRight className="ml-1.5 inline size-4 align-[-0.1em] text-gold-soft transition-transform group-hover/cap:translate-x-0.5 group-hover/cap:-translate-y-0.5" aria-hidden="true" />
        </Link>
        <p className="mt-1 text-xs text-ivory/55 sm:text-[0.8125rem]">{main.meta}</p>

        {n > 1 && (
          <div className="mt-3 flex w-full max-w-[15rem] items-center gap-2">
            <div className="flex flex-1 gap-1" role="group" aria-label="Choose a product">
              {slides.map((s, i) => (
                <button
                  key={s.url + i}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Show ${s.name}`}
                  aria-current={i === index || undefined}
                  className="group/dot relative h-4 flex-1"
                >
                  <span
                    className={cn(
                      'absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full transition-colors',
                      i === index ? 'bg-gold-soft' : 'bg-white/15 group-hover/dot:bg-white/40',
                    )}
                  />
                </button>
              ))}
            </div>
            {!reduced && (
              <button
                type="button"
                onClick={() => setPaused((p) => !p)}
                aria-label={paused ? 'Play slideshow' : 'Pause slideshow'}
                className="grid size-6 place-items-center rounded-full text-ivory/55 transition hover:bg-white/10 hover:text-ivory"
              >
                {paused ? <Play className="size-3" /> : <Pause className="size-3" />}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
