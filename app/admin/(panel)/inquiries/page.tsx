'use client';

import { Archive, ArchiveRestore, CheckCircle2, Circle, Download, ExternalLink, Trash2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ContactActions } from '@/components/admin/InquiryCard';
import { INQUIRY_STATUS, INQUIRY_STATUSES } from '@/components/admin/status';
import { Badge, Button, ConfirmDialog, DataTable, Input, PageHeader, Select, buttonClass, type Column, type MenuItem } from '@/components/ui';
import { api } from '@/lib/client';
import type { Inquiry, InquiryStatus, Paginated, Product } from '@/lib/types';
import { useApi } from '@/lib/useApi';
import { cn, formatDate, timeAgo } from '@/lib/utils';

type ListResponse = Paginated<Inquiry> & { statusCounts: Record<InquiryStatus, number> };

function InquiriesInner() {
  const router = useRouter();
  const params = useSearchParams();
  const get = (k: string, d = '') => params.get(k) ?? d;
  const filters = {
    status: get('status'),
    product: get('product'),
    from: get('from'),
    to: get('to'),
    archived: get('archived'),
    q: get('q'),
    page: get('page', '1'),
    limit: get('limit', '20'),
    sortBy: get('sortBy', 'date'),
    dir: get('dir', 'desc'),
  };
  const [q, setQ] = useState(filters.q);
  const [toDelete, setToDelete] = useState<Inquiry | null>(null);

  const qs = new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString();
  const { data, loading, reload, setData } = useApi<ListResponse>(`/inquiries?${qs}`, { pollMs: 30_000 });
  const { data: products } = useApi<Paginated<Product>>('/products?status=all&limit=200&sort=name');

  const setFilter = (patch: Partial<typeof filters>) => {
    const merged = { ...filters, page: '1', ...patch };
    const defaults: Record<string, string> = { page: '1', limit: '20', sortBy: 'date', dir: 'desc' };
    const next = new URLSearchParams(Object.entries(merged).filter(([k, v]) => v && defaults[k] !== v));
    router.replace(`/admin/inquiries${next.size ? `?${next}` : ''}`);
  };

  useEffect(() => {
    const t = setTimeout(() => q !== filters.q && setFilter({ q }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  async function update(item: Inquiry, body: Partial<Inquiry>, message: string) {
    setData((d) => d && { ...d, items: d.items.map((i) => (i._id === item._id ? { ...i, ...body } : i)) });
    try {
      await api.patch(`/inquiries/${item._id}`, body);
      toast.success(message);
    } catch (e) {
      toast.error((e as Error).message);
    }
    void reload(true);
  }

  async function remove() {
    if (!toDelete) return;
    try {
      await api.del(`/inquiries/${toDelete._id}`);
      toast.success('Inquiry deleted');
      void reload(true);
    } catch (e) {
      toast.error((e as Error).message);
    }
    setToDelete(null);
  }

  const archived = filters.archived === 'true';
  const counts = data?.statusCounts;
  const allCount = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0;
  const exportParams = new URLSearchParams(Object.entries(filters).filter(([k, v]) => v && !['page', 'limit', 'sortBy', 'dir'].includes(k)));
  const extraFilters = Boolean(filters.product || filters.from || filters.to || filters.q);

  const columns: Column<Inquiry>[] = [
    {
      key: 'name',
      header: 'Customer',
      sortable: true,
      cell: (i) => (
        <div className="min-w-0">
          <p className={cn('truncate text-stone-900', i.status === 'new' ? 'font-semibold' : 'font-medium')}>{i.name}</p>
          {i.email && <p className="truncate text-xs text-stone-500">{i.email}</p>}
        </div>
      ),
    },
    { key: 'phone', header: 'Contact', cell: (i) => <ContactActions inquiry={i} /> },
    {
      key: 'product',
      header: 'Product',
      sortable: true,
      hideBelow: 'md',
      className: 'max-w-[16rem]',
      cell: (i) => (
        <div className="min-w-0">
          <p className="truncate text-stone-700">{i.productName || 'General inquiry'}</p>
          {i.message && <p className="truncate text-xs text-stone-500">“{i.message}”</p>}
        </div>
      ),
    },
    { key: 'quantity', header: 'Qty', sortable: true, align: 'right', hideBelow: 'lg', cell: (i) => <span className="text-stone-700 tabular-nums">{i.quantity ?? '—'}</span> },
    { key: 'status', header: 'Status', sortable: true, cell: (i) => <Badge tone={INQUIRY_STATUS[i.status].tone}>{INQUIRY_STATUS[i.status].label}</Badge> },
    {
      key: 'date',
      header: 'Received',
      sortable: true,
      hideBelow: 'sm',
      cell: (i) => (
        <span className="whitespace-nowrap text-stone-500" title={formatDate(i.createdAt, { dateStyle: 'medium', timeStyle: 'short' })}>
          {timeAgo(i.createdAt)}
        </span>
      ),
    },
  ];

  const actions = (i: Inquiry): MenuItem[] => [
    { label: 'Open details', icon: <ExternalLink />, href: `/admin/inquiries/${i._id}` },
    ...INQUIRY_STATUSES.filter((s) => s !== i.status).map((s) => ({
      label: `Mark as ${INQUIRY_STATUS[s].label}`,
      icon: s === 'converted' ? <CheckCircle2 /> : <Circle />,
      onSelect: () => update(i, { status: s }, `Marked as ${INQUIRY_STATUS[s].label}`),
    })),
    i.archived
      ? { label: 'Move back to inbox', icon: <ArchiveRestore />, onSelect: () => update(i, { archived: false }, 'Moved back to inbox') }
      : { label: 'Archive', icon: <Archive />, onSelect: () => update(i, { archived: true }, 'Archived') },
    { label: 'Delete', icon: <Trash2 />, danger: true, onSelect: () => setToDelete(i) },
  ];

  const tabs = [{ key: '', label: 'All', count: allCount }, ...INQUIRY_STATUSES.map((s) => ({ key: s as string, label: INQUIRY_STATUS[s].label, count: counts?.[s] ?? 0 }))];

  return (
    <>
      <PageHeader
        title={archived ? 'Archived inquiries' : 'Inquiries'}
        description="Customers who contacted you from the website. Click a row to see full details and notes."
        actions={
          <>
            <Button variant="outline" onClick={() => setFilter({ archived: archived ? '' : 'true', status: '' })}>
              {archived ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />} {archived ? 'Back to inbox' : 'Archived'}
            </Button>
            <a href={`/api/inquiries/export${exportParams.size ? `?${exportParams}` : ''}`} className={buttonClass('outline')} download>
              <Download className="size-4" /> Export CSV
            </a>
          </>
        }
      />

      {!archived && (
        <div className="mb-4 flex gap-1 overflow-x-auto border-b border-stone-200" role="tablist" aria-label="Filter by status">
          {tabs.map((t) => (
            <button
              key={t.key || 'all'}
              role="tab"
              aria-selected={filters.status === t.key}
              onClick={() => setFilter({ status: t.key })}
              className={cn(
                '-mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition',
                filters.status === t.key ? 'border-navy text-navy' : 'border-transparent text-stone-500 hover:text-stone-800',
              )}
            >
              {t.label}
              <span className="rounded-full bg-stone-100 px-1.5 py-0.5 text-xs text-stone-600 tabular-nums">{t.count}</span>
            </button>
          ))}
        </div>
      )}

      <DataTable
        columns={columns}
        rows={data?.items ?? []}
        rowKey={(i) => i._id}
        loading={loading}
        search={{ value: q, onChange: setQ, placeholder: 'Search name, phone or message…' }}
        filters={
          <>
            <div className="w-52">
              <Select value={filters.product} onChange={(e) => setFilter({ product: e.target.value })} aria-label="Product">
                <option value="">All products</option>
                {products?.items.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
              </Select>
            </div>
            <Input type="date" value={filters.from} onChange={(e) => setFilter({ from: e.target.value })} className="w-auto" aria-label="From date" />
            <span className="text-sm text-stone-400">to</span>
            <Input type="date" value={filters.to} onChange={(e) => setFilter({ to: e.target.value })} className="w-auto" aria-label="To date" />
          </>
        }
        filtered={extraFilters}
        onClear={() => {
          setQ('');
          setFilter({ product: '', from: '', to: '', q: '' });
        }}
        sort={{ key: filters.sortBy, dir: filters.dir === 'asc' ? 'asc' : 'desc' }}
        onSortChange={(s) => setFilter({ sortBy: s.key, dir: s.dir })}
        page={Number(filters.page)}
        pageSize={Number(filters.limit)}
        total={data?.total ?? 0}
        onPageChange={(p) => setFilter({ page: String(p) })}
        onPageSizeChange={(n) => setFilter({ limit: String(n) })}
        onRowClick={(i) => router.push(`/admin/inquiries/${i._id}`)}
        rowClassName={(i) => (i.status === 'new' ? 'bg-sky-50/40' : undefined)}
        rowActions={actions}
        empty={{
          title: archived ? 'No archived inquiries' : extraFilters ? 'No inquiries match' : 'No inquiries yet',
          description: extraFilters ? 'Try a different search or filter.' : 'New inquiries from the website appear here automatically.',
        }}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={remove}
        title="Delete this inquiry?"
        description="It will be removed permanently. To keep a record, archive it instead."
        confirmLabel="Delete"
      />
    </>
  );
}

export default function InquiriesPage() {
  return (
    <Suspense>
      <InquiriesInner />
    </Suspense>
  );
}
