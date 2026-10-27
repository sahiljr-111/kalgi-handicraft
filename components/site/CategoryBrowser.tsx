'use client';

import { SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { Product } from '@/lib/types';
import { cn, formatPrice } from '@/lib/utils';
import { ProductCard } from './ProductCard';

const PAGE_SIZE = 12;
const SORTS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
] as const;

type Sort = (typeof SORTS)[number]['value'];

/** Short material label for filters: "Sheesham wood, Meenakari…" → "Sheesham wood". */
const materialKey = (m: string) => {
  const k = m.split(',')[0].trim();
  return k ? k.charAt(0).toUpperCase() + k.slice(1).toLowerCase() : '';
};

/**
 * All of a category's products are statically rendered with the page; filtering,
 * sorting and paging happen in the browser without a reload. Paging only hides
 * cards, so every product link is in the server-rendered HTML. Filter state is
 * mirrored to the URL so results can be shared.
 */
export function CategoryBrowser({ products }: { products: Product[] }) {
  const materials = useMemo(() => [...new Set(products.map((p) => materialKey(p.material)).filter(Boolean))].sort(), [products]);
  const sizes = useMemo(() => [...new Set(products.map((p) => p.size).filter(Boolean))].sort(), [products]);
  const bounds = useMemo(() => {
    const prices = products.map((p) => p.priceFrom);
    if (!prices.length) return { min: 0, max: 0 };
    return { min: Math.floor(Math.min(...prices) / 10) * 10, max: Math.ceil(Math.max(...prices) / 10) * 10 };
  }, [products]);

  const [material, setMaterial] = useState<string[]>([]);
  const [size, setSize] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(bounds.max);
  const [sort, setSort] = useState<Sort>('featured');
  const [shown, setShown] = useState(PAGE_SIZE);
  const [panelOpen, setPanelOpen] = useState(false);

  // Read initial state from the URL once on mount.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get('material')) setMaterial(q.get('material')!.split('|'));
    if (q.get('size')) setSize(q.get('size')!.split('|'));
    if (q.get('max')) setMaxPrice(Number(q.get('max')) || bounds.max);
    if (q.get('sort')) setSort(q.get('sort') as Sort);
  }, [bounds.max]);

  useEffect(() => {
    const q = new URLSearchParams();
    if (material.length) q.set('material', material.join('|'));
    if (size.length) q.set('size', size.join('|'));
    if (maxPrice < bounds.max) q.set('max', String(maxPrice));
    if (sort !== 'featured') q.set('sort', sort);
    const qs = q.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
    setShown(PAGE_SIZE);
  }, [material, size, maxPrice, sort, bounds.max]);

  const results = useMemo(() => {
    const list = products.filter(
      (p) =>
        (!material.length || material.includes(materialKey(p.material))) &&
        (!size.length || size.includes(p.size)) &&
        p.priceFrom <= maxPrice,
    );
    const sorters: Record<Sort, (a: Product, b: Product) => number> = {
      featured: (a, b) => Number(b.isFeatured) - Number(a.isFeatured) || +new Date(b.createdAt) - +new Date(a.createdAt),
      newest: (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
      price_asc: (a, b) => a.priceFrom - b.priceFrom,
      price_desc: (a, b) => b.priceFrom - a.priceFrom,
    };
    return [...list].sort(sorters[sort]);
  }, [products, material, size, maxPrice, sort]);

  const activeCount = material.length + size.length + (maxPrice < bounds.max ? 1 : 0);
  const clear = () => {
    setMaterial([]);
    setSize([]);
    setMaxPrice(bounds.max);
  };
  const toggle = (list: string[], set: (v: string[]) => void, v: string) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const filters = (
    <div className="grid gap-8">
      {materials.length > 1 && (
        <fieldset>
          <legend className="mb-3 text-sm font-semibold text-ink">Material</legend>
          <div className="grid gap-2">
            {materials.map((m) => (
              <label key={m} className="flex cursor-pointer items-center gap-3 text-sm text-ink-soft">
                <input type="checkbox" checked={material.includes(m)} onChange={() => toggle(material, setMaterial, m)} className="size-4 accent-navy" />
                {m}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {sizes.length > 1 && (
        <fieldset>
          <legend className="mb-3 text-sm font-semibold text-ink">Size</legend>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={size.includes(s)}
                onClick={() => toggle(size, setSize, s)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs transition',
                  size.includes(s) ? 'border-navy bg-navy text-ivory' : 'border-line bg-white/60 text-ink-soft hover:border-navy/40',
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </fieldset>
      )}
      {bounds.max > bounds.min && (
        <fieldset>
          <legend className="mb-3 text-sm font-semibold text-ink">Price up to</legend>
          <input
            type="range"
            min={bounds.min}
            max={bounds.max}
            step={10}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            aria-label="Maximum price"
            className="w-full accent-navy"
            aria-valuetext={formatPrice(maxPrice)}
          />
          <div className="mt-1 flex justify-between text-xs text-muted">
            <span>{formatPrice(bounds.min)}</span>
            <span className="font-semibold text-ink">{formatPrice(maxPrice)}</span>
          </div>
        </fieldset>
      )}
      {activeCount > 0 && (
        <button onClick={clear} className="justify-self-start text-sm font-medium text-navy underline underline-offset-4">
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
      <aside className="hidden lg:block" aria-label="Filters">
        <div className="sticky top-28">{filters}</div>
      </aside>

      <div>
        <h2 className="sr-only">Products</h2>
        <div className="mb-6 flex items-center justify-between gap-3 border-b border-line pb-4">
          <p className="text-sm text-muted" aria-live="polite">
            <span className="font-semibold text-ink">{results.length}</span> {results.length === 1 ? 'product' : 'products'}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPanelOpen(true)} className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm lg:hidden">
              <SlidersHorizontal className="size-4" /> Filters{activeCount ? ` (${activeCount})` : ''}
            </button>
            <label className="sr-only" htmlFor="sort">Sort by</label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="rounded-full border border-line bg-white/60 px-4 py-2 text-sm text-ink-soft outline-none focus:border-navy"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {results.length ? (
          <>
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3">
              {/* Every product stays in the HTML so search engines can reach it; "Show more" only reveals them. */}
              {results.map((p, i) => (
                <div key={p._id} className={cn(i >= shown && 'hidden')}>
                  <ProductCard product={p} priority={i < 3} />
                </div>
              ))}
            </div>
            {shown < results.length && (
              <div className="mt-12 text-center">
                <button onClick={() => setShown((s) => s + PAGE_SIZE)} className="rounded-full border border-ink/20 px-7 py-3 font-medium text-ink transition hover:border-navy hover:text-gold">
                  Show more ({results.length - shown} left)
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-3xl border border-dashed border-line px-6 py-16 text-center">
            <p className="font-display text-2xl text-ink">No products match those filters</p>
            <p className="mt-2 text-muted">Try removing a filter, or ask us about a custom piece.</p>
            <button onClick={clear} className="mt-5 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-ivory">Clear filters</button>
          </div>
        )}
      </div>

      {panelOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setPanelOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-ivory p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl">Filters</h2>
              <button onClick={() => setPanelOpen(false)} className="grid size-10 place-items-center rounded-full hover:bg-paper" aria-label="Close filters"><X /></button>
            </div>
            {filters}
            <button onClick={() => setPanelOpen(false)} className="mt-8 w-full rounded-full bg-navy py-3.5 font-semibold text-ivory">
              Show {results.length} products
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
