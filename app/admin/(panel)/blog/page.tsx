'use client';

import { EyeOff, Eye, Pencil, Plus, Send, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge, ConfirmDialog, DataTable, PageHeader, Select, buttonClass, useClientTable, type Column } from '@/components/ui';
import { postState } from '@/components/admin/BlogForm';
import { api } from '@/lib/client';
import type { BlogPost, Paginated } from '@/lib/types';
import { useApi } from '@/lib/useApi';
import { formatDate, mediaUrl } from '@/lib/utils';

export default function BlogAdminPage() {
  const router = useRouter();
  const { data, loading, reload } = useApi<Paginated<BlogPost>>('/blog?status=all&limit=200');
  const [toDelete, setToDelete] = useState<BlogPost | null>(null);
  const [status, setStatus] = useState('');

  const table = useClientTable(data?.items, {
    searchText: (p) => `${p.title} ${p.excerpt} ${p.topic ?? ''} ${(p.tags ?? []).join(' ')}`,
    filter: status ? (p) => postState(p) === status : undefined,
    sorters: { title: (p) => p.title, status: (p) => postState(p), updated: (p) => +new Date(p.updatedAt), published: (p) => (p.publishedAt ? +new Date(p.publishedAt) : 0) },
    defaultSort: { key: 'updated', dir: 'desc' },
  });

  async function changeStatus(p: BlogPost, next: 'draft' | 'published') {
    try {
      await api.patch(`/blog/id/${p._id}`, { status: next });
      toast.success(next === 'published' ? 'Published. It is now on your website.' : 'Unpublished. Visitors can no longer see it.');
      void reload(true);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function remove() {
    if (!toDelete) return;
    try {
      await api.del(`/blog/${toDelete._id}`);
      toast.success('Blog deleted');
      void reload(true);
    } catch (e) {
      toast.error((e as Error).message);
    }
    setToDelete(null);
  }

  const columns: Column<BlogPost>[] = [
    {
      key: 'title',
      header: 'Blog',
      sortable: true,
      cell: (p) => (
        <div className="flex items-center gap-3">
          <span className="relative hidden h-10 w-14 shrink-0 overflow-hidden rounded-lg bg-stone-100 sm:block">
            {p.featuredImage && <Image src={mediaUrl(p.featuredImage)} alt="" fill sizes="56px" className="object-cover" />}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-stone-900">{p.title}</p>
            <p className="max-w-md truncate text-xs text-stone-500">{[p.topic, p.excerpt].filter(Boolean).join(' · ')}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      cell: (p) => {
        const st = postState(p);
        return st === 'live' ? <Badge tone="green">On website</Badge> : st === 'scheduled' ? <Badge tone="amber">Scheduled {formatDate(p.publishedAt!)}</Badge> : <Badge>Draft</Badge>;
      },
    },
    { key: 'published', header: 'Published', sortable: true, hideBelow: 'lg', cell: (p) => <span className="whitespace-nowrap text-stone-500">{p.publishedAt ? formatDate(p.publishedAt) : '—'}</span> },
    { key: 'updated', header: 'Last updated', sortable: true, hideBelow: 'md', cell: (p) => <span className="whitespace-nowrap text-stone-500">{formatDate(p.updatedAt)}</span> },
  ];

  return (
    <>
      <PageHeader
        title="Blogs"
        description="Guides about your craft and products. They help customers find you on Google."
        actions={
          <Link href="/admin/blog/new" className={buttonClass('primary')}>
            <Plus className="size-4" /> Write a blog
          </Link>
        }
      />
      <DataTable
        columns={columns}
        rows={table.rows}
        rowKey={(p) => p._id}
        loading={loading}
        search={{ value: table.q, onChange: table.setQ, placeholder: 'Search blogs…' }}
        filters={
          <div className="w-40">
            <Select value={status} onChange={(e) => { setStatus(e.target.value); table.setPage(1); }} aria-label="Status">
              <option value="">All statuses</option>
              <option value="live">On website</option>
              <option value="scheduled">Scheduled</option>
              <option value="draft">Draft</option>
            </Select>
          </div>
        }
        filtered={Boolean(table.q || status)}
        onClear={() => { table.setQ(''); setStatus(''); }}
        sort={table.sort}
        onSortChange={table.setSort}
        page={table.page}
        pageSize={table.pageSize}
        total={table.total}
        onPageChange={table.setPage}
        onPageSizeChange={table.setPageSize}
        onRowClick={(p) => router.push(`/admin/blog/${p._id}/edit`)}
        rowActions={(p) => [
          { label: 'Edit', icon: <Pencil />, href: `/admin/blog/${p._id}/edit` },
          { label: postState(p) === 'live' ? 'View on website' : 'Preview', icon: <Eye />, href: `/api/blog/preview?id=${p._id}`, external: true },
          { label: 'Publish now', icon: <Send />, onSelect: () => void changeStatus(p, 'published'), hidden: p.status === 'published' },
          { label: 'Unpublish', icon: <EyeOff />, onSelect: () => void changeStatus(p, 'draft'), hidden: p.status !== 'published' },
          { label: 'Delete', icon: <Trash2 />, danger: true, onSelect: () => setToDelete(p) },
        ]}
        empty={{ title: table.q || status ? 'No blogs match' : 'No blogs yet', description: 'Write about your craft, buying guides or gifting ideas.' }}
      />
      <ConfirmDialog open={Boolean(toDelete)} onClose={() => setToDelete(null)} onConfirm={remove} title="Delete this blog?" description={`“${toDelete?.title}” will be removed from your website.`} confirmLabel="Delete" />
    </>
  );
}
