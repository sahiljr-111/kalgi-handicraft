'use client';

import { ArrowRight, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge, Button, Card, ConfirmDialog, DataTable, Field, Input, PageHeader, useClientTable, type Column } from '@/components/ui';
import { ApiError, api } from '@/lib/client';
import { useApi } from '@/lib/useApi';
import { formatDate } from '@/lib/utils';

interface Redirect {
  _id: string;
  from: string;
  to: string;
  permanent: boolean;
  auto: boolean;
  hits: number;
  createdAt: string;
}

export default function RedirectsPage() {
  const { data, loading, reload } = useApi<Redirect[]>('/redirects');
  const [form, setForm] = useState({ from: '', to: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Redirect | null>(null);

  const table = useClientTable(data ?? undefined, {
    searchText: (r) => `${r.from} ${r.to}`,
    sorters: { from: (r) => r.from, hits: (r) => r.hits, created: (r) => +new Date(r.createdAt) },
    defaultSort: { key: 'created', dir: 'desc' },
  });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      await api.post('/redirects', form);
      toast.success('Redirect saved');
      setForm({ from: '', to: '' });
      void reload(true);
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fields);
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!toDelete) return;
    try {
      await api.del(`/redirects/${toDelete._id}`);
      toast.success('Redirect removed');
      void reload(true);
    } catch (err) {
      toast.error((err as Error).message);
    }
    setToDelete(null);
  }

  const columns: Column<Redirect>[] = [
    {
      key: 'from',
      header: 'Old address → new address',
      sortable: true,
      cell: (r) => (
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <span className="text-stone-500">{r.from}</span>
          <ArrowRight className="size-3.5 text-stone-400" />
          <a href={r.to} target="_blank" className="text-navy hover:underline">{r.to}</a>
        </div>
      ),
    },
    { key: 'type', header: 'Added', cell: (r) => (r.auto ? <Badge tone="blue">Automatic</Badge> : <Badge>By hand</Badge>) },
    { key: 'hits', header: 'Used', sortable: true, hideBelow: 'md', cell: (r) => <span className="text-stone-600">{r.hits} times</span> },
    { key: 'created', header: 'Date', sortable: true, hideBelow: 'md', cell: (r) => <span className="whitespace-nowrap text-stone-500">{formatDate(r.createdAt)}</span> },
  ];

  return (
    <>
      <PageHeader
        title="Redirects"
        description="When a web address changes, visitors and Google are sent to the new one. Renaming a product, category or blog adds a redirect automatically."
      />
      <Card className="mb-6 p-5">
        <form onSubmit={add} className="grid items-end gap-4 md:grid-cols-[1fr_1fr_auto]">
          <Field label="Old address" htmlFor="r-from" error={errors.from} hint="e.g. /product/old-name">
            <Input id="r-from" value={form.from} onChange={(e) => setForm((f) => ({ ...f, from: e.target.value }))} placeholder="/old-page" required />
          </Field>
          <Field label="New address" htmlFor="r-to" error={errors.to} hint="e.g. /product/new-name">
            <Input id="r-to" value={form.to} onChange={(e) => setForm((f) => ({ ...f, to: e.target.value }))} placeholder="/new-page" required />
          </Field>
          <Button type="submit" loading={saving} className="md:mb-6">
            <Plus className="size-4" /> Add redirect
          </Button>
        </form>
      </Card>
      <DataTable
        columns={columns}
        rows={table.rows}
        rowKey={(r) => r._id}
        loading={loading}
        search={{ value: table.q, onChange: table.setQ, placeholder: 'Search addresses…' }}
        filtered={Boolean(table.q)}
        onClear={() => table.setQ('')}
        sort={table.sort}
        onSortChange={table.setSort}
        page={table.page}
        pageSize={table.pageSize}
        total={table.total}
        onPageChange={table.setPage}
        onPageSizeChange={table.setPageSize}
        rowActions={(r) => [{ label: 'Remove', icon: <Trash2 />, danger: true, onSelect: () => setToDelete(r) }]}
        empty={{ title: table.q ? 'No redirects match' : 'No redirects yet', description: 'They are added automatically when you change a web address.' }}
      />
      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={remove}
        title="Remove this redirect?"
        description={`Visitors opening ${toDelete?.from} will see “page not found”.`}
        confirmLabel="Remove"
      />
    </>
  );
}
