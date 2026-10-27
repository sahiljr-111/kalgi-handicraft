'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useAdmin } from '@/components/admin/AdminContext';
import { Badge, Button, ConfirmDialog, DataTable, Dialog, Field, Input, PageHeader, Select, useClientTable, type Column } from '@/components/ui';
import { ApiError, api } from '@/lib/client';
import { useApi } from '@/lib/useApi';
import { formatDate } from '@/lib/utils';

interface UserRow { _id: string; name: string; email: string; role: 'owner' | 'staff'; lastLoginAt: string | null; createdAt: string }

export default function UsersPage() {
  const { user: me } = useAdmin();
  const { data, loading, reload } = useApi<UserRow[]>('/users');
  const [adding, setAdding] = useState(false);
  const [v, setV] = useState({ name: '', email: '', password: '', role: 'staff' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<UserRow | null>(null);

  const table = useClientTable(data, {
    searchText: (u) => `${u.name} ${u.email}`,
    sorters: { name: (u) => u.name || u.email, role: (u) => u.role, login: (u) => (u.lastLoginAt ? +new Date(u.lastLoginAt) : 0) },
    defaultSort: { key: 'name', dir: 'asc' },
  });
  const columns: Column<UserRow>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      cell: (u) => (
        <div className="flex items-center gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-stone-200 text-xs font-semibold text-stone-700">{(u.name || u.email)[0].toUpperCase()}</span>
          <div className="min-w-0">
            <p className="truncate font-medium text-stone-900">{u.name || u.email} {u._id === me?.id && <span className="font-normal text-stone-500">(you)</span>}</p>
            <p className="truncate text-xs text-stone-500">{u.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'role', header: 'Role', sortable: true, cell: (u) => <Badge tone={u.role === 'owner' ? 'violet' : 'neutral'}>{u.role === 'owner' ? 'Owner' : 'Staff'}</Badge> },
    { key: 'login', header: 'Last signed in', sortable: true, hideBelow: 'sm', cell: (u) => <span className="text-stone-500">{u.lastLoginAt ? formatDate(u.lastLoginAt) : 'Never'}</span> },
  ];

  async function add() {
    setSaving(true);
    try {
      await api.post('/users', v);
      toast.success('Person added');
      setAdding(false);
      setV({ name: '', email: '', password: '', role: 'staff' });
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
      await api.del(`/users/${toDelete._id}`);
      toast.success('Removed');
      void reload(true);
    } catch (e) {
      toast.error((e as Error).message);
    }
    setToDelete(null);
  }

  return (
    <>
      <PageHeader title="Staff logins" description="People who can sign in to this dashboard. Staff manage products and inquiries; owners can also change business details and logins." actions={<Button onClick={() => { setErrors({}); setAdding(true); }}><Plus className="size-4" /> Add a person</Button>} />
      <DataTable
        columns={columns}
        rows={table.rows}
        rowKey={(u) => u._id}
        loading={loading}
        search={{ value: table.q, onChange: table.setQ, placeholder: 'Search people…' }}
        filtered={Boolean(table.q)}
        onClear={() => table.setQ('')}
        sort={table.sort}
        onSortChange={table.setSort}
        page={table.page}
        pageSize={table.pageSize}
        total={table.total}
        onPageChange={table.setPage}
        rowActions={(u) => [{ label: 'Remove access', icon: <Trash2 />, danger: true, onSelect: () => setToDelete(u), hidden: u._id === me?.id }]}
        empty={{ title: 'No people found' }}
      />
      <Dialog open={adding} onClose={() => setAdding(false)} title="Add a person" description="Give them this email and password so they can sign in." footer={<><Button variant="outline" onClick={() => setAdding(false)}>Cancel</Button><Button onClick={add} loading={saving}>Add person</Button></>}>
        <div className="grid gap-4">
          <Field label="Name" htmlFor="u-name"><Input id="u-name" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} /></Field>
          <Field label="Email" htmlFor="u-email" error={errors.email}><Input id="u-email" type="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} /></Field>
          <Field label="Password for them" htmlFor="u-pw" error={errors.password} hint="At least 8 letters or numbers. They can change it later."><Input id="u-pw" type="text" value={v.password} onChange={(e) => setV({ ...v, password: e.target.value })} /></Field>
          <Field label="What can they do?" htmlFor="u-role">
            <Select id="u-role" value={v.role} onChange={(e) => setV({ ...v, role: e.target.value })}>
              <option value="staff">Staff: products and inquiries</option>
              <option value="owner">Owner: everything</option>
            </Select>
          </Field>
        </div>
      </Dialog>
      <ConfirmDialog open={Boolean(toDelete)} onClose={() => setToDelete(null)} onConfirm={remove} title="Remove this person?" description={`${toDelete?.email} will no longer be able to sign in.`} confirmLabel="Yes, remove" />
    </>
  );
}
