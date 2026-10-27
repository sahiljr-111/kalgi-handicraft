import { after } from 'next/server';
import { requireUser } from '@/server/session';
import { sendInquiryNotification } from '@/server/email';
import { env } from '@/server/env';
import { json, queryOf, readJson, route } from '@/server/http';
import { rateLimit } from '@/server/rateLimit';
import { createInquiry, listInquiries } from '@/server/services/inquiries';
import { getSettings } from '@/server/services/settings';

export const POST = route(async (req) => {
  await rateLimit(req, 'inquiry', 5, 15 * 60, 'Too many inquiries from this device. Please try again in a few minutes or contact us on WhatsApp.');
  const inquiry = await createInquiry(await readJson(req));
  if (!inquiry) return json({ ok: true }, { status: 201 }); // honeypot

  // Send the email after responding, so the visitor isn't kept waiting.
  after(async () => {
    try {
      const recipient = env.notifyEmail || (await getSettings()).email || '';
      await sendInquiryNotification({ ...inquiry, id: String(inquiry._id) }, recipient);
    } catch (err) {
      console.error('[email] Failed to send inquiry notification', err);
    }
  });
  return json({ ok: true, id: inquiry._id }, { status: 201 });
});

export const GET = route(async (req) => {
  await requireUser(req);
  return json(await listInquiries(queryOf(req)));
});
