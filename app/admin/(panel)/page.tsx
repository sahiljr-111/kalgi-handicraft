'use client';

import { ArrowRight, CheckCircle2, Inbox, MessageSquareText, Package, Plus } from 'lucide-react';
import Link from 'next/link';
import { useAdmin } from '@/components/admin/AdminContext';
import { InquiryCard } from '@/components/admin/InquiryCard';
import { Card, CardHeader, EmptyState, PageHeader, Skeleton, StatCard, buttonClass } from '@/components/ui';
import type { Inquiry } from '@/lib/types';
import { useApi } from '@/lib/useApi';

interface Stats {
  products: { published: number; draft: number; total: number };
  categories: number;
  inquiries: { total: number; week: number; month: number; prevMonth: number; new: number; convertedMonth: number };
  whatsappClicks30: number;
  topProducts: { name: string; count: number }[];
  recent: Inquiry[];
}

export default function DashboardPage() {
  const { user } = useAdmin();
  const { data: s, loading } = useApi<Stats>('/stats', { pollMs: 60_000 });
  const firstName = (user?.name || '').split(' ')[0];

  return (
    <>
      <PageHeader
        title={`Namaste${firstName ? `, ${firstName}` : ''}`}
        description="Here is what is happening on your website."
        actions={
          <Link href="/admin/products/new" className={buttonClass('primary')}>
            <Plus className="size-4" /> Add product
          </Link>
        }
      />

      {loading && !s ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      ) : s ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={<Inbox />} label="New inquiries" value={s.inquiries.new} sub={s.inquiries.new ? 'Waiting for your reply' : 'All replied'} />
            <StatCard icon={<MessageSquareText />} label="Inquiries this week" value={s.inquiries.week} sub={`${s.inquiries.month} in the last 30 days`} />
            <StatCard icon={<CheckCircle2 />} label="Orders received" value={s.inquiries.convertedMonth} sub="Last 30 days" />
            <StatCard icon={<Package />} label="Products on website" value={s.products.published} sub={s.products.draft ? `${s.products.draft} hidden · ${s.categories} categories` : `${s.categories} categories`} />
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_20rem]">
            <Card>
              <CardHeader
                title="Latest inquiries"
                description="Click a row to see full details"
                action={
                  <Link href="/admin/inquiries" className="inline-flex items-center gap-1 text-sm font-medium text-navy hover:underline">
                    View all <ArrowRight className="size-4" />
                  </Link>
                }
              />
              {s.recent.length ? (
                <ul className="divide-y divide-stone-100">{s.recent.map((q) => <InquiryCard key={q._id} inquiry={q} />)}</ul>
              ) : (
                <EmptyState icon={<Inbox className="size-5" />} title="No inquiries yet" description="Inquiries from your website will show here." />
              )}
            </Card>
            <div className="grid content-start gap-4">
              <Card>
                <CardHeader title="Most asked-about" description="Last 30 days" />
                {s.topProducts.length ? (
                  <ol className="divide-y divide-stone-100">
                    {s.topProducts.map((p) => (
                      <li key={p.name} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm">
                        <span className="truncate text-stone-700">{p.name}</span>
                        <span className="shrink-0 font-medium text-stone-900 tabular-nums">{p.count}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="px-5 py-4 text-sm text-stone-500">No product inquiries yet.</p>
                )}
              </Card>
              <Card>
                <div className="flex items-center justify-between px-5 py-4 text-sm">
                  <span className="text-stone-600">WhatsApp clicks (30 days)</span>
                  <span className="font-semibold text-stone-900 tabular-nums">{s.whatsappClicks30}</span>
                </div>
              </Card>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
