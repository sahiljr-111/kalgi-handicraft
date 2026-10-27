'use client';

import { Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { WhatsAppIcon } from '@/components/site/WhatsAppIcon';
import { Badge } from '@/components/ui';
import type { Inquiry } from '@/lib/types';
import { cn, formatDate, timeAgo, whatsappLink } from '@/lib/utils';
import { INQUIRY_STATUS } from './status';

export function inquiryWhatsappLink(inq: Pick<Inquiry, 'name' | 'phone' | 'productName'>) {
  const text = `Namaste ${inq.name.replace(/^Sample:\s*/, '').split(' ')[0]}, thank you for your inquiry${inq.productName ? ` about ${inq.productName}` : ''} with Kalgi Handicraft.`;
  return whatsappLink(`91${inq.phone.slice(-10)}`, text);
}

export const formatPhone = (p: string) => {
  const d = p.replace(/\D/g, '').slice(-10);
  return d.length === 10 ? `${d.slice(0, 5)} ${d.slice(5)}` : p;
};

/** Phone number with compact WhatsApp and Call buttons, so no need to open the inquiry. */
export function ContactActions({ inquiry, className }: { inquiry: Pick<Inquiry, 'name' | 'phone' | 'productName'>; className?: string }) {
  return (
    <div className={cn('flex items-center gap-1.5', className)} onClick={(e) => e.stopPropagation()}>
      <span className="mr-1 text-sm font-medium whitespace-nowrap text-stone-800 tabular-nums">{formatPhone(inquiry.phone)}</span>
      <a
        href={inquiryWhatsappLink(inquiry)}
        target="_blank"
        rel="noopener noreferrer"
        title="Reply on WhatsApp"
        aria-label={`WhatsApp ${inquiry.name}`}
        className="grid size-8 place-items-center rounded-lg bg-whatsapp/10 text-whatsapp transition hover:bg-whatsapp hover:text-white"
      >
        <WhatsAppIcon className="size-4" />
      </a>
      <a
        href={`tel:+91${inquiry.phone.slice(-10)}`}
        title="Call"
        aria-label={`Call ${inquiry.name}`}
        className="grid size-8 place-items-center rounded-lg bg-stone-100 text-stone-700 transition hover:bg-navy hover:text-white"
      >
        <Phone className="size-4" />
      </a>
    </div>
  );
}

/** Compact inquiry row for the dashboard: the whole row opens the inquiry. */
export function InquiryCard({ inquiry }: { inquiry: Inquiry }) {
  const router = useRouter();
  const status = INQUIRY_STATUS[inquiry.status];
  const href = `/admin/inquiries/${inquiry._id}`;
  return (
    <li
      onClick={() => router.push(href)}
      className={cn('flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3 transition hover:bg-stone-50', inquiry.status === 'new' && 'bg-sky-50/40')}
    >
      <div className="min-w-0 flex-1 basis-56">
        <a href={href} onClick={(e) => e.preventDefault()} className={cn('block truncate text-sm text-stone-900', inquiry.status === 'new' ? 'font-semibold' : 'font-medium')}>
          {inquiry.name}
        </a>
        <p className="truncate text-xs text-stone-500">
          {inquiry.productName || 'General inquiry'}
          {inquiry.quantity ? ` · ${inquiry.quantity} pcs` : ''}
        </p>
      </div>
      <ContactActions inquiry={inquiry} />
      <div className="flex w-52 items-center justify-end gap-3">
        <Badge tone={status.tone}>{status.label}</Badge>
        <span className="w-20 text-right text-xs whitespace-nowrap text-stone-500" title={formatDate(inquiry.createdAt, { dateStyle: 'medium', timeStyle: 'short' })}>
          {timeAgo(inquiry.createdAt)}
        </span>
      </div>
    </li>
  );
}
