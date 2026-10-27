'use client';

import { ArrowDown, ArrowUp, ChevronDown, ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ImageField } from '@/components/admin/MediaPicker';
import { GooglePreview, NoindexSwitch } from '@/components/admin/SeoFields';
import { Badge, Button, ConfirmDialog, DataTable, Dialog, Field, Input, PageHeader, Switch, Textarea, useClientTable, type Column } from '@/components/ui';
import { ApiError, api } from '@/lib/client';
import { categorySeoDescription, categorySeoTitle } from '@/lib/seo';
import type { Category, Settings } from '@/lib/types';
import { useApi } from '@/lib/useApi';
import { cn, mediaUrl, slugify } from '@/lib/utils';

type Draft = Pick<Category, 'name' | 'slug' | 'tagline' | 'description' | 'seoTitle' | 'seoDescription' | 'image' | 'isActive'> & { noindex: boolean };
const EMPTY: Draft = { name: '', slug: '', tagline: '', description: '', seoTitle: '', seoDescription: '', image: '', isActive: true, noindex: false };

export default function CategoriesPage() {
  const { data, loading, reload } = useApi<Category[]>('/categories?all=true');
  const { data: settings } = useApi<Settings>('/settings');
  const [list, setList] = useState<Category[]>([]);
  const [editing, setEditing] = useState<{ id?: string; draft: Draft } | null>(null);
  const [advanced, setAdvanced] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Category | null>(null);

  useEffect(() => {
    if (data) setList(data);
  }, [data]);

  async function move(from: number, to: number) {
    if (to < 0 || to >= list.length) return;
    const next = [...list];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setList(next);
    try {
      await api.put('/categories/reorder', { ids: next.map((c) => c._id) });
      toast.success('Order saved');
    } catch (e) {
      toast.error((e as Error).message);
      void reload(true);
    }
  }

  function open(c?: Category) {
    setErrors({});
    setAdvanced(false);
    setEditing(
      c
        ? { id: c._id, draft: { name: c.name, slug: c.slug, tagline: c.tagline, description: c.description, seoTitle: c.seoTitle, seoDescription: c.seoDescription, image: c.image, isActive: c.isActive, noindex: Boolean(c.noindex) } }
        : { draft: EMPTY },
    );
  }

  async function save() {
    if (!editing) return;
    if (editing.draft.name.trim().length < 2) return setErrors({ name: 'Please type a name' });
    setSaving(true);
    try {
      if (editing.id) await api.put(`/categories/${editing.id}`, editing.draft);
      else await api.post('/categories', editing.draft);
      toast.success(editing.id ? 'Category saved' : 'Category added');
      setEditing(null);
      void reload(true);
    } catch (e) {
      if (e instanceof ApiError) setErrors(e.fields);
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!toDelete) return;
    try {
      await api.del(`/categories/${toDelete._id}`);
      toast.success('Category deleted');
      void reload(true);
    } catch (e) {
      toast.error((e as Error).message);
    }
    setToDelete(null);
  }

  const order = new Map(list.map((c, i) => [c._id, i]));
  const table = useClientTable(list, {
    searchText: (c) => `${c.name} ${c.tagline}`,
    sorters: { order: (c) => order.get(c._id) ?? 0, name: (c) => c.name, products: (c) => c.productCount ?? 0, status: (c) => (c.isActive ? 0 : 1) },
    defaultSort: { key: 'order', dir: 'asc' },
  });
  const columns: Column<Category>[] = [
    { key: 'order', header: '#', sortable: true, className: 'w-14', cell: (c) => <span className="text-stone-400 tabular-nums">{(order.get(c._id) ?? 0) + 1}</span> },
    {
      key: 'name',
      header: 'Category',
      sortable: true,
      cell: (c) => (
        <div className="flex items-center gap-3">
          <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-stone-100">
            {c.image && <Image src={mediaUrl(c.image)} alt="" fill sizes="40px" className="object-cover" />}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-stone-900">{c.name}</p>
            {c.tagline && <p className="truncate text-xs text-stone-500">{c.tagline}</p>}
          </div>
        </div>
      ),
    },
    { key: 'products', header: 'Products', sortable: true, align: 'right', cell: (c) => <span className="tabular-nums text-stone-700">{c.productCount ?? 0}</span> },
    { key: 'status', header: 'Status', sortable: true, cell: (c) => (c.isActive ? <Badge tone="green">On website</Badge> : <Badge>Hidden</Badge>) },
  ];

  const setDraft = (patch: Partial<Draft>) => setEditing((e) => e && { ...e, draft: { ...e.draft, ...patch } });

  return (
    <>
      <PageHeader
        title="Categories"
        description="Sections of your website. They appear in this order (#) in the menu and on the home page."
        actions={
          <Button onClick={() => open()}>
            <Plus className="size-4" /> Add category
          </Button>
        }
      />

      <DataTable
        columns={columns}
        rows={table.rows}
        rowKey={(c) => c._id}
        loading={loading}
        search={{ value: table.q, onChange: table.setQ, placeholder: 'Search categories…' }}
        filtered={Boolean(table.q)}
        onClear={() => table.setQ('')}
        sort={table.sort}
        onSortChange={table.setSort}
        page={table.page}
        pageSize={table.pageSize}
        total={table.total}
        onPageChange={table.setPage}
        onPageSizeChange={table.setPageSize}
        onRowClick={(c) => open(c)}
        rowActions={(c) => {
          const i = list.findIndex((x) => x._id === c._id);
          const canReorder = table.sort?.key === 'order' && !table.q;
          return [
            { label: 'Edit', icon: <Pencil />, onSelect: () => open(c) },
            { label: 'Move up', icon: <ArrowUp />, onSelect: () => move(i, i - 1), hidden: !canReorder || i === 0 },
            { label: 'Move down', icon: <ArrowDown />, onSelect: () => move(i, i + 1), hidden: !canReorder || i === list.length - 1 },
            { label: 'View on website', icon: <ExternalLink />, href: `/${c.slug}`, external: true, hidden: !c.isActive },
            { label: 'Delete', icon: <Trash2 />, danger: true, onSelect: () => setToDelete(c) },
          ];
        }}
        empty={{ title: table.q ? 'No categories match' : 'No categories yet', description: table.q ? undefined : 'Add categories such as Wooden Chowki or Dry Fruit Boxes.' }}
      />

      <Dialog
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        size="lg"
        title={editing?.id ? 'Edit category' : 'Add a category'}
        footer={
          <>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save} loading={saving}>Save category</Button>
          </>
        }
      >
        {editing && (
          <div className="grid gap-5">
            <Field label="Name" htmlFor="c-name" error={errors.name}>
              <Input
                id="c-name"
                value={editing.draft.name}
                invalid={Boolean(errors.name)}
                onChange={(e) => setDraft({ name: e.target.value, ...(!editing.id && { slug: slugify(e.target.value) }) })}
                placeholder="For example: Pooja Articles"
              />
            </Field>
            <Field label="Short line under the name" htmlFor="c-tag" hint="Optional. One sentence shown at the top of the category page.">
              <Input id="c-tag" value={editing.draft.tagline} onChange={(e) => setDraft({ tagline: e.target.value })} />
            </Field>
            <div className="max-w-[14rem]">
              <ImageField value={editing.draft.image} onChange={(image) => setDraft({ image })} label="Photo" aspect="aspect-[3/4]" />
            </div>
            <Field label="About this category" htmlFor="c-desc" hint="Optional. A few lines shown below the products. This also helps Google find your page.">
              <Textarea id="c-desc" rows={5} value={editing.draft.description} onChange={(e) => setDraft({ description: e.target.value })} />
            </Field>
            <label htmlFor="c-active" className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-stone-200 p-4">
              <span>
                <span className="block text-sm font-semibold text-stone-900">Show on website</span>
                <span className="block text-sm text-stone-600">Turn off to hide this category from the menu.</span>
              </span>
              <Switch id="c-active" checked={editing.draft.isActive} onChange={(isActive) => setDraft({ isActive })} label="Show on website" />
            </label>

            <div className="rounded-xl border border-stone-200">
              <button type="button" onClick={() => setAdvanced((a) => !a)} aria-expanded={advanced} className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left">
                <span className="text-sm font-semibold text-stone-900">Advanced settings (optional)</span>
                <ChevronDown className={cn('size-4 text-stone-500 transition', advanced && 'rotate-180')} />
              </button>
              {advanced && (
                <div className="grid gap-5 border-t border-stone-100 p-4">
                  <Field label="Web address" htmlFor="c-slug" error={errors.slug} hint={`yourwebsite.com/${editing.draft.slug || '…'}`}>
                    <Input id="c-slug" value={editing.draft.slug} onChange={(e) => setDraft({ slug: slugify(e.target.value) })} />
                  </Field>
                  {settings && (() => {
                    const count = list.find((c) => c._id === editing.id)?.productCount;
                    const cat = { ...editing.draft, name: editing.draft.name || 'Category name' } as Category;
                    const auto = { ...cat, seoTitle: '', seoDescription: '' };
                    return (
                      <>
                        <GooglePreview path={`/${editing.draft.slug || '…'}`} title={categorySeoTitle(cat, settings)} description={categorySeoDescription(cat, settings, count)} />
                        <Field label="Title in Google search" htmlFor="c-seot" hint="Leave empty to use the automatic title.">
                          <Input id="c-seot" value={editing.draft.seoTitle} placeholder={categorySeoTitle(auto, settings)} onChange={(e) => setDraft({ seoTitle: e.target.value })} />
                        </Field>
                        <Field label="Short description in Google search" htmlFor="c-seod" hint="Leave empty to use the automatic description.">
                          <Textarea id="c-seod" rows={2} value={editing.draft.seoDescription} placeholder={categorySeoDescription(auto, settings, count)} onChange={(e) => setDraft({ seoDescription: e.target.value })} />
                        </Field>
                      </>
                    );
                  })()}
                  <NoindexSwitch id="c-noindex" checked={editing.draft.noindex} onChange={(noindex) => setDraft({ noindex })} />
                </div>
              )}
            </div>
          </div>
        )}
      </Dialog>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={remove}
        title={`Delete “${toDelete?.name}”?`}
        description={
          toDelete?.productCount
            ? `This category still has ${toDelete.productCount} products. Move those products to another category first (open each product and change its category).`
            : 'This category will be removed from your website.'
        }
        confirmLabel="Delete"
      />
    </>
  );
}
