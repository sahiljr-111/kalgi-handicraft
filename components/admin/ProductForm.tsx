'use client';

import { ArrowLeft, ChevronDown, ExternalLink, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button, Card, Dialog, Field, Input, Select, Switch, Textarea } from '@/components/ui';
import { ApiError, api } from '@/lib/client';
import { productSeoDescription, productSeoTitle } from '@/lib/seo';
import type { Category, Product, ProductImage, Settings } from '@/lib/types';
import { useApi } from '@/lib/useApi';
import { SITE_URL, cn, slugify } from '@/lib/utils';
import { ImageManager } from './ImageManager';
import { GooglePreview, NoindexSwitch } from './SeoFields';

export interface ProductFormValues {
  name: string;
  slug: string;
  category: string;
  priceFrom: string;
  unit: string;
  material: string;
  size: string;
  colorOptions: string[];
  images: ProductImage[];
  description: string;
  seoTitle: string;
  seoDescription: string;
  noindex: boolean;
  isFeatured: boolean;
  showInHero: boolean;
  status: 'draft' | 'published';
}

const EMPTY: ProductFormValues = {
  name: '',
  slug: '',
  category: '',
  priceFrom: '',
  unit: 'per piece',
  material: '',
  size: '',
  colorOptions: [],
  images: [],
  description: '',
  seoTitle: '',
  seoDescription: '',
  noindex: false,
  isFeatured: false,
  showInHero: false,
  status: 'published',
};

export function toFormValues(p: Product): ProductFormValues {
  return {
    name: p.name,
    slug: p.slug,
    category: typeof p.category === 'object' ? p.category?._id : (p.category as string),
    priceFrom: String(p.priceFrom),
    unit: p.unit,
    material: p.material,
    size: p.size,
    colorOptions: p.colorOptions,
    images: p.images,
    description: p.description,
    seoTitle: p.seoTitle,
    seoDescription: p.seoDescription,
    noindex: Boolean(p.noindex),
    isFeatured: p.isFeatured,
    showInHero: Boolean(p.showInHero),
    status: p.status,
  };
}

/** Colours as removable tags. Type a colour and press Enter or the Add button. */
function ColoursInput({ value, onChange, id }: { value: string[]; onChange: (v: string[]) => void; id: string }) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const parts = draft.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length) onChange([...new Set([...value, ...parts])]);
    setDraft('');
  };
  return (
    <div>
      <div className="flex gap-2">
        <Input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              add();
            }
          }}
          placeholder="For example: Ruby Red"
        />
        <Button type="button" variant="outline" onClick={add} disabled={!draft.trim()}>Add</Button>
      </div>
      {value.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {value.map((c) => (
            <li key={c} className="inline-flex items-center gap-2 rounded-xl bg-stone-100 py-1.5 pr-1.5 pl-3 text-sm text-stone-800">
              {c}
              <button type="button" onClick={() => onChange(value.filter((x) => x !== c))} className="grid size-8 place-items-center rounded-lg text-stone-500 hover:bg-stone-200 hover:text-stone-900" aria-label={`Remove ${c}`}>
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** A numbered step card. */
function Step({ n, title, hint, children }: { n: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <Card>
      <div className="flex items-start gap-4 border-b border-stone-100 px-5 py-4">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-navy text-sm font-semibold text-white">{n}</span>
        <div>
          <h2 className="text-[0.95rem] font-semibold text-stone-900">{title}</h2>
          {hint && <p className="mt-1 text-sm text-stone-600">{hint}</p>}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </Card>
  );
}

export function ProductForm({ initial, productId }: { initial?: ProductFormValues; productId?: string }) {
  const router = useRouter();
  const [v, setV] = useState<ProductFormValues>(initial ?? EMPTY);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const { data: categories, setData: setCategories } = useApi<Category[]>('/categories?all=true');
  const { data: settings } = useApi<Settings>('/settings');

  // Live preview of the automatic SEO text (same builder the website uses).
  const seo = useMemo(() => {
    const s = settings ?? ({ businessName: 'Kalgi Handicraft', city: 'Jasdan', state: 'Gujarat' } as Settings);
    const cat = categories?.find((c) => c._id === v.category);
    const draft = {
      ...v,
      priceFrom: Number(v.priceFrom) || 0,
      name: v.name || 'Product name',
      category: cat ? { _id: cat._id, name: cat.name, slug: cat.slug } : undefined,
    } as unknown as Product;
    const auto = { ...draft, seoTitle: '', seoDescription: '' } as Product;
    return {
      title: productSeoTitle(draft, s),
      description: productSeoDescription(draft, s),
      autoTitle: productSeoTitle(auto, s),
      autoDescription: productSeoDescription(auto, s),
    };
  }, [v, categories, settings]);
  const [newCat, setNewCat] = useState<{ name: string; saving: boolean; error?: string } | null>(null);

  async function createCategory() {
    if (!newCat) return;
    const name = newCat.name.trim();
    if (name.length < 2) return setNewCat({ ...newCat, error: 'Please type a category name' });
    const existing = categories?.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      set('category', existing._id);
      setNewCat(null);
      toast.info(`“${existing.name}” already exists, so it has been selected.`);
      return;
    }
    setNewCat({ ...newCat, saving: true, error: undefined });
    try {
      const created = await api.post<Category>('/categories', { name });
      setCategories((list) => [...(list ?? []), { ...created, productCount: 0 }]);
      set('category', created._id);
      setNewCat(null);
      toast.success(`Category “${created.name}” added`);
    } catch (e) {
      setNewCat({ ...newCat, saving: false, error: (e as Error).message });
    }
  }

  useEffect(() => {
    if (!v.category && categories?.length) setV((x) => ({ ...x, category: categories[0]._id }));
  }, [categories, v.category]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const set = <K extends keyof ProductFormValues>(k: K, value: ProductFormValues[K]) => {
    setDirty(true);
    setV((x) => {
      const next = { ...x, [k]: value };
      if (k === 'name' && !slugTouched) next.slug = slugify(String(value));
      return next;
    });
    if (errors[k]) setErrors((e) => ({ ...e, [k]: '' }));
  };

  function validate() {
    const e: Record<string, string> = {};
    if (v.name.trim().length < 2) e.name = 'Please type the product name';
    if (!v.category) e.category = 'Please choose a category';
    if (v.priceFrom === '' || Number.isNaN(Number(v.priceFrom)) || Number(v.priceFrom) < 0) e.priceFrom = 'Please type the price in rupees, for example 450';
    setErrors(e);
    return e;
  }

  async function save() {
    const e = validate();
    if (Object.keys(e).length) {
      toast.error('Some details are missing. Please check the boxes marked in red.');
      document.getElementById(`pf-${Object.keys(e)[0]}`)?.focus();
      return;
    }
    setSaving(true);
    try {
      const body = { ...v, priceFrom: Number(v.priceFrom) };
      const saved = productId ? await api.put<Product>(`/products/${productId}`, body) : await api.post<Product>('/products', body);
      setDirty(false);
      setV((x) => ({ ...x, slug: saved.slug, status: saved.status }));
      toast.success(saved.status === 'published' ? 'Saved. It is now on your website.' : 'Saved. It is hidden from your website.');
      if (!productId) router.replace(`/admin/products/${saved._id}/edit`);
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fields);
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const onWebsite = v.status === 'published';

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
      className="max-w-3xl pb-24"
    >
      <Link href="/admin/products" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-navy hover:underline">
        <ArrowLeft className="size-4" /> Back to all products
      </Link>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl leading-tight font-semibold text-stone-900">{productId ? 'Edit product' : 'Add a new product'}</h1>
          <p className="mt-2 text-sm text-stone-600">Fill in the steps below, then press “Save product” at the bottom.</p>
        </div>
        {productId && onWebsite && (
          <a href={`/product/${v.slug}`} target="_blank" className="inline-flex items-center gap-2 text-sm font-semibold text-navy hover:underline">
            See it on the website <ExternalLink className="size-4" />
          </a>
        )}
      </div>

      <div className="grid gap-4">
        <Step n={1} title="Photos" hint="Add clear photos of the product. The first photo is the main one customers see.">
          <ImageManager images={v.images} onChange={(imgs) => set('images', imgs)} productName={v.name} />
        </Step>

        <Step n={2} title="Name and category">
          <div className="grid gap-5">
            <Field label="Product name" htmlFor="pf-name" error={errors.name}>
              <Input id="pf-name" value={v.name} onChange={(e) => set('name', e.target.value)} invalid={Boolean(errors.name)} placeholder="For example: Meenakari Dry Fruit Box, 4 Compartments" />
            </Field>
            <Field label="Category" htmlFor="pf-category" error={errors.category} hint="Which section of the website it appears in.">
              <Select
                id="pf-category"
                value={v.category}
                onChange={(e) => set('category', e.target.value)}
                invalid={Boolean(errors.category)}
                placeholder={categories ? 'Choose a category' : 'Loading…'}
                action={{ label: 'Add new category', onSelect: () => setNewCat({ name: '', saving: false }) }}
              >
                {categories?.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </Select>
            </Field>
          </div>
        </Step>

        <Step n={3} title="Price">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Starting price (₹)" htmlFor="pf-priceFrom" error={errors.priceFrom} hint="The lowest price, shown as “From ₹…”.">
              <Input id="pf-priceFrom" inputMode="decimal" value={v.priceFrom} onChange={(e) => set('priceFrom', e.target.value.replace(/[^\d.]/g, ''))} invalid={Boolean(errors.priceFrom)} placeholder="450" />
            </Field>
            <Field label="Price is for" htmlFor="pf-unit">
              <Select id="pf-unit" value={v.unit} onChange={(e) => set('unit', e.target.value)}>
                <option value="per piece">One piece</option>
                <option value="per set">One set</option>
                <option value="per pair">One pair</option>
                <option value="per dozen">One dozen</option>
              </Select>
            </Field>
          </div>
        </Step>

        <Step n={4} title="Product details" hint="Optional, but helps customers decide.">
          <div className="grid gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Size" htmlFor="pf-size">
                <Input id="pf-size" value={v.size} onChange={(e) => set('size', e.target.value)} placeholder="12 x 12 x 5 inch" />
              </Field>
              <Field label="Material" htmlFor="pf-material">
                <Input id="pf-material" value={v.material} onChange={(e) => set('material', e.target.value)} placeholder="Sheesham wood, Meenakari work" />
              </Field>
            </div>
            <Field label="Colours available" htmlFor="pf-colours">
              <ColoursInput id="pf-colours" value={v.colorOptions} onChange={(c) => set('colorOptions', c)} />
            </Field>
          </div>
        </Step>

        <Step n={5} title="Description" hint="Describe the product in your own words: how it is made, what it is used for, how to care for it.">
          <Textarea id="pf-description" rows={7} value={v.description} onChange={(e) => set('description', e.target.value)} aria-label="Description" />
          <p className="mt-2 text-xs text-stone-600">Tip: press Enter twice to start a new paragraph.</p>
        </Step>

        <Step n={6} title="Show on website">
          <div className="grid gap-4">
            <label htmlFor="pf-status" className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-stone-200 p-4">
              <span>
                <span className="block text-sm font-semibold text-stone-900">{onWebsite ? 'Yes, customers can see it' : 'No, keep it hidden'}</span>
                <span className="block text-sm text-stone-600">Turn off to hide the product without deleting it.</span>
              </span>
              <Switch id="pf-status" checked={onWebsite} onChange={(c) => set('status', c ? 'published' : 'draft')} label="Show on website" />
            </label>
            <label htmlFor="pf-featured" className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-stone-200 p-4">
              <span>
                <span className="block text-sm font-semibold text-stone-900">Top selling</span>
                <span className="block text-sm text-stone-600">Shows it in “Top selling” on the home page, with a “Top selling” label.</span>
              </span>
              <Switch id="pf-featured" checked={v.isFeatured} onChange={(c) => set('isFeatured', c)} label="Top selling" />
            </label>
            <label htmlFor="pf-hero" className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-stone-200 p-4">
              <span>
                <span className="block text-sm font-semibold text-stone-900">Show in the big banner</span>
                <span className="block text-sm text-stone-600">Shows it in the large photo display at the top of the home page. Choose 2 to 4 products.</span>
              </span>
              <Switch id="pf-hero" checked={v.showInHero} onChange={(c) => set('showInHero', c)} label="Show in the big banner" />
            </label>
          </div>
        </Step>

        {/* Advanced options are hidden by default */}
        <Card>
          <button type="button" onClick={() => setAdvanced((a) => !a)} aria-expanded={advanced} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
            <span>
              <span className="block text-sm font-semibold text-stone-900">Advanced settings (optional)</span>
              <span className="block text-sm text-stone-600">Web address and Google search text. These are filled in automatically, so you can leave them as they are.</span>
            </span>
            <ChevronDown className={cn('size-5 shrink-0 text-stone-500 transition', advanced && 'rotate-180')} />
          </button>
          {advanced && (
            <div className="grid gap-5 border-t border-stone-100 p-5">
              <Field label="Web address" htmlFor="pf-slug" error={errors.slug} hint={`${SITE_URL.replace(/^https?:\/\//, '')}/product/${v.slug || '…'}`}>
                <Input id="pf-slug" value={v.slug} onChange={(e) => { setSlugTouched(true); set('slug', slugify(e.target.value)); }} />
              </Field>
              <GooglePreview path={`/product/${v.slug || '…'}`} title={seo.title} description={seo.description} />
              <Field label="Title in Google search" htmlFor="pf-seoTitle" hint={`Leave empty to use the automatic title (${seo.autoTitle.length} characters).`}>
                <Input id="pf-seoTitle" value={v.seoTitle} onChange={(e) => set('seoTitle', e.target.value)} maxLength={120} placeholder={seo.autoTitle} />
              </Field>
              <Field label="Short description in Google search" htmlFor="pf-seoDescription" hint="Leave empty to use the automatic description, built from name, price, size and material.">
                <Textarea id="pf-seoDescription" rows={3} value={v.seoDescription} onChange={(e) => set('seoDescription', e.target.value)} maxLength={320} placeholder={seo.autoDescription} />
              </Field>
              <NoindexSwitch id="pf-noindex" checked={v.noindex} onChange={(c) => set('noindex', c)} />
            </div>
          )}
        </Card>
      </div>

      {/* Always-visible save bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5 lg:px-10">
          <p className={cn('text-sm', dirty ? 'font-semibold text-amber-800' : 'text-stone-600')}>
            {dirty ? 'You have changes that are not saved yet.' : productId ? 'All changes saved.' : 'Fill in the steps, then save.'}
          </p>
          <div className="flex gap-3">
            <Link href="/admin/products" className="inline-flex h-9 items-center rounded-xl px-5 text-sm font-semibold text-stone-700 hover:bg-stone-100">
              Cancel
            </Link>
            <Button type="submit" size="lg" loading={saving}>
              Save product
            </Button>
          </div>
        </div>
      </div>
      <Dialog
        open={Boolean(newCat)}
        onClose={() => setNewCat(null)}
        title="Add a new category"
        description="It will be added to your website menu. You can add a photo and description later from Categories."
        footer={
          <>
            <Button variant="outline" onClick={() => setNewCat(null)}>Cancel</Button>
            <Button onClick={createCategory} loading={newCat?.saving}>Add category</Button>
          </>
        }
      >
        {newCat && (
          <Field label="Category name" htmlFor="new-cat" error={newCat.error}>
            <Input
              id="new-cat"
              autoFocus
              value={newCat.name}
              invalid={Boolean(newCat.error)}
              onChange={(e) => setNewCat({ ...newCat, name: e.target.value, error: undefined })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void createCategory();
                }
              }}
              placeholder="For example: Wall Hangings"
            />
          </Field>
        )}
      </Dialog>
    </form>
  );
}
