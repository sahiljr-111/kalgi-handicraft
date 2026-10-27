'use client';

import { Pencil, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { toast } from 'sonner';
import { ImageField } from '@/components/admin/MediaPicker';
import { Button, ConfirmDialog, DataTable, Dialog, Field, Input, PageHeader, Select, Textarea, useClientTable, type Column } from '@/components/ui';
import { api } from '@/lib/client';
import type { Category, GalleryItem } from '@/lib/types';
import { useApi } from '@/lib/useApi';
import { mediaUrl } from '@/lib/utils';

interface Draft { title: string; caption: string; image: string; category: string; sortOrder: number }
const EMPTY: Draft = { title: '', caption: '', image: '', category: '', sortOrder: 0 };

export default function GalleryAdminPage() {
  const { data, loading, reload } = useApi<GalleryItem[]>('/gallery');
  const { data: categories } = useApi<Category[]>('/categories?all=true');
  const [editing, setEditing] = useState<{ id?: string; draft: Draft } | null>(null);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<GalleryItem | null>(null);

  const [catFilter, setCatFilter] = useState('');
  const edit = (g: GalleryItem) => setEditing({ id: g._id, draft: { title: g.title, caption: g.caption, image: g.image, category: g.category?._id ?? '', sortOrder: g.sortOrder } });
  const table = useClientTable(data, {
    searchText: (g) => `${g.title} ${g.caption}`,
    filter: catFilter ? (g) => g.category?._id === catFilter : undefined,
    sorters: { title: (g) => g.title, category: (g) => g.category?.name ?? '', order: (g) => g.sortOrder },
    defaultSort: { key: 'order', dir: 'asc' },
  });
  const columns: Column<GalleryItem>[] = [
    {
      key: 'title',
      header: 'Photo',
      sortable: true,
      cell: (g) => (
        <div className="flex items-center gap-3">
          <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-stone-100">
            <Image src={mediaUrl(g.image)} alt="" fill sizes="48px" className="object-cover" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-stone-900">{g.title}</p>
            {g.caption && <p className="max-w-md truncate text-xs text-stone-500">{g.caption}</p>}
          </div>
        </div>
      ),
    },
    { key: 'category', header: 'Category', sortable: true, hideBelow: 'sm', cell: (g) => <span className="text-stone-600">{g.category?.name ?? '—'}</span> },
  ];

  const setDraft = (p: Partial<Draft>) => setEditing((e) => e && { ...e, draft: { ...e.draft, ...p } });

  async function save() {
    if (!editing) return;
    if (!editing.draft.title.trim() || !editing.draft.image) return toast.error('Please add a photo and a title');
    setSaving(true);
    try {
      if (editing.id) await api.put(`/gallery/${editing.id}`, editing.draft);
      else await api.post('/gallery', { ...editing.draft, sortOrder: data?.length ?? 0 });
      toast.success('Saved');
      setEditing(null);
      void reload(true);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!toDelete) return;
    try {
      await api.del(`/gallery/${toDelete._id}`);
      toast.success('Removed from gallery');
      void reload(true);
    } catch (e) {
      toast.error((e as Error).message);
    }
    setToDelete(null);
  }

  return (
    <>
      <PageHeader title="Work gallery" description="Photos of completed orders, shown on the Gallery page of your website." actions={<Button onClick={() => setEditing({ draft: EMPTY })}><Plus className="size-4" /> Add a photo</Button>} />
      <DataTable
        columns={columns}
        rows={table.rows}
        rowKey={(g) => g._id}
        loading={loading}
        search={{ value: table.q, onChange: table.setQ, placeholder: 'Search photos…' }}
        filters={
          <div className="w-52">
            <Select value={catFilter} onChange={(e) => { setCatFilter(e.target.value); table.setPage(1); }} aria-label="Category">
              <option value="">All categories</option>
              {categories?.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </Select>
          </div>
        }
        filtered={Boolean(table.q || catFilter)}
        onClear={() => { table.setQ(''); setCatFilter(''); }}
        sort={table.sort}
        onSortChange={table.setSort}
        page={table.page}
        pageSize={table.pageSize}
        total={table.total}
        onPageChange={table.setPage}
        onPageSizeChange={table.setPageSize}
        onRowClick={edit}
        rowActions={(g) => [
          { label: 'Edit', icon: <Pencil />, onSelect: () => edit(g) },
          { label: 'Delete', icon: <Trash2 />, danger: true, onSelect: () => setToDelete(g) },
        ]}
        empty={{ title: table.q || catFilter ? 'No photos match' : 'No photos yet', description: 'Add photos of completed orders so new customers can see your work.' }}
      />

      <Dialog open={Boolean(editing)} onClose={() => setEditing(null)} size="lg" title={editing?.id ? 'Edit photo' : 'Add a photo to the work gallery'} footer={<><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={save} loading={saving}>Save photo</Button></>}>
        {editing && (
          <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
            <ImageField value={editing.draft.image} onChange={(image) => setDraft({ image })} label="Photo" aspect="aspect-square" />
            <div className="grid content-start gap-4">
              <Field label="Title" htmlFor="g-title"><Input id="g-title" value={editing.draft.title} onChange={(e) => setDraft({ title: e.target.value })} placeholder="500 Diwali gift boxes" /></Field>
              <Field label="A few words about it (optional)" htmlFor="g-cap"><Textarea id="g-cap" rows={2} value={editing.draft.caption} onChange={(e) => setDraft({ caption: e.target.value })} placeholder="Who it was for, where, how many" /></Field>
              <Field label="Category" htmlFor="g-cat">
                <Select id="g-cat" value={editing.draft.category} onChange={(e) => setDraft({ category: e.target.value })}>
                  <option value="">None</option>
                  {categories?.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </Select>
              </Field>
            </div>
          </div>
        )}
      </Dialog>
      <ConfirmDialog open={Boolean(toDelete)} onClose={() => setToDelete(null)} onConfirm={remove} title="Remove this photo from the work gallery?" description="It will no longer show on your website. The photo itself stays in Photos." confirmLabel="Yes, remove it" />
    </>
  );
}
