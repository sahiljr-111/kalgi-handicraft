'use client';

import { Archive, ArchiveRestore, ArrowLeft, Check, Mail, Phone, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { inquiryWhatsappLink } from '@/components/admin/InquiryCard';
import { INQUIRY_STATUS, INQUIRY_STATUSES } from '@/components/admin/status';
import { WhatsAppIcon } from '@/components/site/WhatsAppIcon';
import { Badge, Button, Card, CardHeader, ConfirmDialog, Skeleton, Textarea } from '@/components/ui';
import { api } from '@/lib/client';
import type { Inquiry, InquiryStatus } from '@/lib/types';
import { useApi } from '@/lib/useApi';
import { cn, formatDate } from '@/lib/utils';

export default function InquiryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: inq, setData, loading, error } = useApi<Inquiry>(`/inquiries/${id}`);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    if (inq) setNotes(inq.notes);
  }, [inq?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function patch(body: Partial<Inquiry>, message: string) {
    try {
      const updated = await api.patch<Inquiry>(`/inquiries/${id}`, body);
      setData((d) => (d ? { ...d, ...updated, productId: d.productId } : d));
      toast.success(message);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function saveNotes() {
    setSaving(true);
    await patch({ notes }, 'Notes saved');
    setSaving(false);
  }

  async function remove() {
    try {
      await api.del(`/inquiries/${id}`);
      toast.success('Inquiry deleted');
      router.replace('/admin/inquiries');
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  if (error) return <p className="text-sm text-red-700">{error}</p>;
  if (loading || !inq) return <div className="grid gap-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-72 rounded-xl" /></div>;

  const product = inq.productId && typeof inq.productId === 'object' ? inq.productId : null;
  const status = INQUIRY_STATUS[inq.status];

  return (
    <div className="max-w-4xl">
      <Link href="/admin/inquiries" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-navy hover:underline">
        <ArrowLeft className="size-4" /> Back to all inquiries
      </Link>

      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl leading-tight font-semibold text-stone-900">{inq.name}</h1>
          <Badge tone={status.tone}>{status.label}</Badge>
          {inq.archived && <Badge>Archived</Badge>}
        </div>
        <p className="mt-2 text-sm text-stone-600">
          Sent on {formatDate(inq.createdAt, { dateStyle: 'long', timeStyle: 'short' })} from your website {inq.source === 'whatsapp' ? '(WhatsApp)' : 'form'}
        </p>
      </div>

      {/* 1. Reply */}
      <Card className="mb-5">
        <CardHeader title="Reply to the customer" />
        <div className="grid gap-3 p-5 sm:grid-cols-3">
          <a href={inquiryWhatsappLink(inq)} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-whatsapp text-sm font-semibold text-white hover:bg-[#0b6534]">
            <WhatsAppIcon className="size-5" /> WhatsApp
          </a>
          <a href={`tel:+91${inq.phone.slice(-10)}`} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-stone-300 text-sm font-semibold text-stone-900 hover:bg-stone-50">
            <Phone className="size-5" /> Call {inq.phone}
          </a>
          {inq.email ? (
            <a href={`mailto:${inq.email}?subject=${encodeURIComponent(`Your inquiry: ${inq.productName || 'Kalgi Handicraft'}`)}`} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-stone-300 text-sm font-semibold text-stone-900 hover:bg-stone-50">
              <Mail className="size-5" /> Email
            </a>
          ) : (
            <p className="flex items-center justify-center rounded-xl bg-stone-50 px-4 text-center text-sm text-stone-500">No email given</p>
          )}
        </div>
      </Card>

      {/* 2. What they asked */}
      <Card className="mb-5">
        <CardHeader title="What they asked for" />
        <dl className="grid gap-5 p-5 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-stone-600">Product</dt>
            <dd className="mt-1 text-sm font-semibold text-stone-900">
              {product ? <Link href={`/product/${product.slug}`} target="_blank" className="hover:underline">{inq.productName}</Link> : inq.productName || 'General inquiry'}
            </dd>
          </div>
          <div>
            <dt className="text-stone-600">Quantity</dt>
            <dd className="mt-1 text-sm font-semibold text-stone-900">{inq.quantity ? `${inq.quantity} pieces` : 'Not given'}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-stone-600">Their message</dt>
            <dd className="mt-1 text-sm whitespace-pre-wrap text-stone-900">{inq.message || <span className="text-stone-500">No message</span>}</dd>
          </div>
        </dl>
      </Card>

      {/* 3. Status */}
      <Card className="mb-5">
        <CardHeader title="Where is this inquiry now?" description="Tap one to update it." />
        <div className="grid gap-3 p-5 sm:grid-cols-2" role="radiogroup" aria-label="Inquiry status">
          {INQUIRY_STATUSES.map((s) => {
            const active = inq.status === s;
            return (
              <button
                key={s}
                role="radio"
                aria-checked={active}
                onClick={() => !active && patch({ status: s as InquiryStatus }, `Marked as “${INQUIRY_STATUS[s].label}”`)}
                className={cn(
                  'flex items-center gap-4 rounded-xl border px-4 py-4 text-left transition',
                  active ? 'border-navy bg-navy/[0.04]' : 'border-stone-200 hover:border-stone-400',
                )}
              >
                <span className={cn('grid size-5 shrink-0 place-items-center rounded-full border', active ? 'border-navy bg-navy text-white' : 'border-stone-300')}>
                  {active && <Check className="size-4" />}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-stone-900">{INQUIRY_STATUS[s].label}</span>
                  <span className="block text-sm text-stone-600">{INQUIRY_STATUS[s].help}</span>
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* 4. Notes */}
      <Card className="mb-5">
        <CardHeader title="Your notes" description="Only you and your staff can see these. For example: “Called on Monday, sent price list.”" />
        <div className="p-5">
          <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} aria-label="Your notes" />
          <div className="mt-4 flex items-center gap-4">
            <Button onClick={saveNotes} loading={saving} disabled={notes === inq.notes}>Save notes</Button>
            {notes !== inq.notes && <span className="text-sm text-amber-800">Not saved yet</span>}
          </div>
        </div>
      </Card>

      {/* 5. Remove */}
      <Card>
        <CardHeader title="Remove this inquiry" description="Archive hides it from the main list but keeps it. Delete removes it forever." />
        <div className="flex flex-wrap gap-3 p-5">
          <Button variant="outline" onClick={() => patch({ archived: !inq.archived }, inq.archived ? 'Moved back to the main list' : 'Archived')}>
            {inq.archived ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />} {inq.archived ? 'Move back to main list' : 'Archive'}
          </Button>
          <Button variant="outline" onClick={() => setConfirm(true)} className="text-red-700 hover:border-red-300 hover:bg-red-50">
            <Trash2 className="size-4" /> Delete forever
          </Button>
        </div>
      </Card>

      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={remove}
        title="Delete this inquiry forever?"
        description="It cannot be brought back. If you only want to hide it, choose Archive instead."
        confirmLabel="Yes, delete it"
      />
    </div>
  );
}
