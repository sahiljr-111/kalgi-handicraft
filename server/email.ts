import nodemailer, { type Transporter } from 'nodemailer';
import { env } from './env';

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!env.smtp.host) return null;
  transporter ??= nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
  });
  return transporter;
}

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export interface InquiryEmail {
  id: string;
  name: string;
  phone: string;
  email?: string;
  productName?: string;
  quantity?: number | null;
  message?: string;
}

export async function sendInquiryNotification(inquiry: InquiryEmail, recipient: string): Promise<void> {
  const subject = `New inquiry: ${inquiry.productName || 'General'} — ${inquiry.name}`;
  const rows: [string, string][] = [
    ['Name', inquiry.name],
    ['Phone', inquiry.phone],
    ['Email', inquiry.email || '—'],
    ['Product', inquiry.productName || 'General inquiry'],
    ['Quantity', inquiry.quantity ? String(inquiry.quantity) : '—'],
    ['Message', inquiry.message || '—'],
  ];
  const dashboardLink = `${env.siteUrl}/admin/inquiries/${inquiry.id}`;
  const waLink = `https://wa.me/91${inquiry.phone.slice(-10)}`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px">
      <h2 style="color:#1e1f33;margin:0 0 12px;border-bottom:3px solid #c1a25f;padding-bottom:8px">New website inquiry</h2>
      <table style="border-collapse:collapse;width:100%">
        ${rows.map(([k, v]) => `<tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;width:110px">${k}</td><td style="padding:8px;border-bottom:1px solid #eee">${escape(v)}</td></tr>`).join('')}
      </table>
      <p style="margin-top:20px">
        <a href="${dashboardLink}" style="background:#1e1f33;color:#c1a25f;padding:10px 16px;border-radius:6px;text-decoration:none">Open in dashboard</a>
        &nbsp; <a href="${waLink}">Reply on WhatsApp</a>
      </p>
    </div>`;
  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n') + `\n\nDashboard: ${dashboardLink}`;

  const t = getTransporter();
  if (!t || !recipient) {
    console.log(`[email] SMTP not configured. Would send to ${recipient || '(no recipient)'}:\n${subject}\n${text}`);
    return;
  }
  await t.sendMail({ from: env.emailFrom, to: recipient, subject, html, text, replyTo: inquiry.email || undefined });
}
