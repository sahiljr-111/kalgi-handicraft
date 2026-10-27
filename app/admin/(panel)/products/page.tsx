'use client';

import { Copy, ExternalLink, Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge, ConfirmDialog, DataTable, PageHeader, Select, buttonClass, type Column, type SortState } from '@/components/ui';
import { toFormValues } from '@/components/admin/ProductForm';
import { api } from '@/lib/client';
import type { Category, Paginated, Product } from '@/lib/types';
import { useApi } from '@/lib/useApi';
import { formatDate, formatPrice, mediaUrl, primaryImage } from '@/lib/utils';

export default function ProductsPage() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState<SortState>({ key: 'updated', dir: 'desc' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [toDelete, setToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(q);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const qs = new URLSearchParams({
    status,
    sortBy: sort.key,
    dir: sort.dir,
    page: String(page),
    limit: String(pageSize),
    ...(debounced && { q: debounced }),
    ...(category && { category }),
  });
  const { data, loading, reload } = useApi<Paginated<Product>>(`/products?${qs}`);
  const { data: categories } = useApi<Category[]>('/categories?all=true');

  async function duplicate(p: Product) {
    try {
      const copy = await api.post<Product>(`/products/${p._id}/duplicate`);
      toast.success('Copy created (hidden from website)');
      router.push(`/admin/products/${copy._id}/edit`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function toggleVisibility(p: Product) {
    const next = p.status === 'published' ? 'draft' : 'published';
    try {
      await api.put(`/products/${p._id}`, { ...toFormValues(p), priceFrom: p.priceFrom, status: next });
      toast.success(next === 'published' ? 'Now showing on website' : 'Hidden from website');
      void reload(true);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function remove() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api.del(`/products/${toDelete._id}`);
      toast.success(`“${toDelete.name}” deleted`);
      setToDelete(null);
      void reload(true);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setDeleting(false);
    }
  }

  const columns: Column<Product>[] = [
    {
      key: 'name',
      header: 'Product',
      sortable: true,
      cell: (p) => {
        const img = primaryImage(p.images);
        return (
          <div className="flex items-center gap-3">
            <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-stone-100">
              {img && <Image src={mediaUrl(img.url)} alt="" fill sizes="40px" className="object-cover" />}
            </span>
            <div className="min-w-0">
              <Link href={`/admin/products/${p._id}/edit`} onClick={(e) => e.stopPropagation()} className="block truncate font-medium text-stone-900 hover:underline">
                {p.name}
              </Link>
              {p.isFeatured && <span className="text-xs text-amber-700">On home page</span>}
            </div>
          </div>
        );
      },
    },
    { key: 'category', header: 'Category', hideBelow: 'md', cell: (p) => <span className="text-stone-600">{p.category?.name}</span> },
    { key: 'price', header: 'Price', sortable: true, align: 'right', cell: (p) => <span className="text-stone-900 tabular-nums">{formatPrice(p.priceFrom)}</span> },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      cell: (p) => (p.status === 'published' ? <Badge tone="green">On website</Badge> : <Badge>Hidden</Badge>),
    },
    { key: 'updated', header: 'Last updated', sortable: true, hideBelow: 'lg', cell: (p) => <span className="whitespace-nowrap text-stone-500">{formatDate(p.updatedAt)}</span> },
  ];

  const filtered = Boolean(debounced || category || status !== 'all');

  return (
    <>
      <PageHeader
        title="Products"
        description="Everything listed on your website. Click a row to edit it."
        actions={
          <Link href="/admin/products/new" className={buttonClass('primary')}>
            <Plus className="size-4" /> Add product
          </Link>
        }
      />
      <DataTable
        columns={columns}
        rows={data?.items ?? []}
        rowKey={(p) => p._id}
        loading={loading}
        search={{ value: q, onChange: setQ, placeholder: 'Search products…' }}
        filters={
          <>
            <div className="w-48">
              <Select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} aria-label="Category">
                <option value="">All categories</option>
                {categories?.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </Select>
            </div>
            <div className="w-40">
              <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Status">
                <option value="all">All statuses</option>
                <option value="published">On website</option>
                <option value="draft">Hidden</option>
              </Select>
            </div>
          </>
        }
        filtered={filtered}
        onClear={() => { setQ(''); setCategory(''); setStatus('all'); setPage(1); }}
        sort={sort}
        onSortChange={(s) => { setSort(s); setPage(1); }}
        page={page}
        pageSize={pageSize}
        total={data?.total ?? 0}
        onPageChange={setPage}
        onPageSizeChange={(n) => { setPageSize(n); setPage(1); }}
        onRowClick={(p) => router.push(`/admin/products/${p._id}/edit`)}
        rowActions={(p) => [
          { label: 'Edit', icon: <Pencil />, href: `/admin/products/${p._id}/edit` },
          { label: 'View on website', icon: <ExternalLink />, href: `/product/${p.slug}`, external: true, hidden: p.status !== 'published' },
          { label: p.status === 'published' ? 'Hide from website' : 'Show on website', icon: p.status === 'published' ? <EyeOff /> : <Eye />, onSelect: () => toggleVisibility(p) },
          { label: 'Duplicate', icon: <Copy />, onSelect: () => duplicate(p) },
          { label: 'Delete', icon: <Trash2 />, danger: true, onSelect: () => setToDelete(p) },
        ]}
        empty={{
          title: filtered ? 'No products match' : 'No products yet',
          description: filtered ? 'Try a different search or filter.' : 'Add your first product with photos and a price.',
          action: !filtered ? <Link href="/admin/products/new" className={buttonClass('primary')}><Plus className="size-4" /> Add product</Link> : undefined,
        }}
      />
      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={remove}
        loading={deleting}
        title="Delete this product?"
        description={`“${toDelete?.name}” will be removed from your website. To hide it temporarily, use “Hide from website” instead.`}
        confirmLabel="Delete"
      />
    </>
  );
}
