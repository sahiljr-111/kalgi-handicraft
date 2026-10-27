import type { BadgeTone } from '@/components/ui';
import type { InquiryStatus } from '@/lib/types';

/** Plain-language names for inquiry statuses, with a one-line explanation. */
export const INQUIRY_STATUS: Record<InquiryStatus, { label: string; help: string; tone: BadgeTone }> = {
  new: { label: 'New', help: 'You have not replied yet', tone: 'blue' },
  contacted: { label: 'Replied', help: 'You have called or messaged them', tone: 'amber' },
  converted: { label: 'Order received', help: 'They placed an order', tone: 'green' },
  closed: { label: 'Closed', help: 'Finished, or not interested', tone: 'neutral' },
};
export const INQUIRY_STATUSES = Object.keys(INQUIRY_STATUS) as InquiryStatus[];
