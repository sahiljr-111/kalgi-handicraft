import { isValidObjectId } from 'mongoose';
import { z } from 'zod';
import { connectDB } from '../db';
import { notFound } from '../http';
import { INQUIRY_STATUSES, Inquiry, Product } from '../models';
import { escapeRegex, pagination } from '../slug';

/** "98765 43210", "+91 9876543210", "09876543210" → "9876543210". */
function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
}

const inquiryInput = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(100),
  phone: z
    .string()
    .transform(normalisePhone)
    .refine((p) => /^[6-9]\d{9}$/.test(p), 'Enter a valid 10-digit mobile number'),
  email: z.union([z.literal(''), z.string().trim().email('Enter a valid email')]).optional().default(''),
  productId: z.string().optional().default(''),
  productName: z.string().trim().max(200).optional().default(''),
  quantity: z.union([z.literal(''), z.coerce.number().int().min(1, 'Quantity must be at least 1').max(1_000_000)]).optional(),
  message: z.string().trim().max(2000).optional().default(''),
  source: z.enum(['form', 'whatsapp']).optional().default('form'),
  website: z.string().optional(), // honeypot: people never fill this
});

/** Returns null when the honeypot was tripped (pretend success to bots). */
export async function createInquiry(input: unknown) {
  const data = inquiryInput.parse(input);
  if (data.website) return null;
  await connectDB();

  let productId = null;
  let productName = data.productName;
  if (data.productId && isValidObjectId(data.productId)) {
    const product = await Product.findById(data.productId).select('name').lean();
    if (product) {
      productId = product._id;
      productName = product.name;
    }
  }
  const inquiry = await Inquiry.create({
    name: data.name,
    phone: data.phone,
    email: data.email,
    productId,
    productName,
    quantity: typeof data.quantity === 'number' ? data.quantity : null,
    message: data.message,
    source: data.source,
  });
  return inquiry.toObject();
}

function buildFilter(q: Record<string, string | undefined>) {
  const filter: Record<string, unknown> = { archived: q.archived === 'true' };
  if (q.status && (INQUIRY_STATUSES as readonly string[]).includes(q.status)) filter.status = q.status;
  if (q.product && isValidObjectId(q.product)) filter.productId = q.product;
  if (q.source === 'form' || q.source === 'whatsapp') filter.source = q.source;
  if (q.from || q.to) {
    const range: Record<string, Date> = {};
    if (q.from) range.$gte = new Date(`${q.from}T00:00:00+05:30`);
    if (q.to) range.$lte = new Date(`${q.to}T23:59:59.999+05:30`);
    filter.createdAt = range;
  }
  if (q.q) {
    const rx = new RegExp(escapeRegex(q.q.trim()), 'i');
    filter.$or = [{ name: rx }, { phone: rx }, { email: rx }, { productName: rx }, { message: rx }];
  }
  return filter;
}

const INQUIRY_SORTABLE: Record<string, string> = { date: 'createdAt', name: 'name', product: 'productName', quantity: 'quantity', status: 'status' };
function inquirySort(q: Record<string, string | undefined>): Record<string, 1 | -1> {
  const field = INQUIRY_SORTABLE[q.sortBy ?? ''];
  return field ? { [field]: q.dir === 'asc' ? 1 : -1, _id: -1 } : { createdAt: -1 };
}

export async function listInquiries(q: Record<string, string | undefined>) {
  await connectDB();
  const { page, limit, skip } = pagination(q, 25);
  const filter = buildFilter(q);
  const [items, total, counts] = await Promise.all([
    Inquiry.find(filter).sort(inquirySort(q)).skip(skip).limit(limit).lean(),
    Inquiry.countDocuments(filter),
    Inquiry.aggregate<{ _id: string; count: number }>([{ $match: { archived: false } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);
  const statusCounts: Record<string, number> = Object.fromEntries(INQUIRY_STATUSES.map((s) => [s, 0]));
  for (const c of counts) statusCounts[c._id] = c.count;
  return { items, total, page, pages: Math.ceil(total / limit), statusCounts };
}

const csvCell = (v: unknown) => {
  let s = v === null || v === undefined ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // neutralise spreadsheet formulas
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function exportInquiriesCsv(q: Record<string, string | undefined>) {
  await connectDB();
  const items = await Inquiry.find(buildFilter(q)).sort({ createdAt: -1 }).lean();
  const header = ['Date', 'Name', 'Phone', 'Email', 'Product', 'Quantity', 'Message', 'Source', 'Status', 'Notes'];
  const lines = items.map((i) =>
    [new Date(i.createdAt).toISOString(), i.name, i.phone, i.email, i.productName, i.quantity, i.message, i.source, i.status, i.notes].map(csvCell).join(','),
  );
  return '﻿' + [header.join(','), ...lines].join('\r\n');
}

export async function getInquiry(id: string) {
  await connectDB();
  const inquiry = await Inquiry.findById(id).populate('productId', 'name slug images priceFrom').lean();
  if (!inquiry) throw notFound('Inquiry');
  return inquiry;
}

const inquiryPatch = z.object({
  status: z.enum(INQUIRY_STATUSES).optional(),
  notes: z.string().max(5000).optional(),
  archived: z.boolean().optional(),
});

export async function updateInquiry(id: string, input: unknown) {
  await connectDB();
  const data = inquiryPatch.parse(input);
  const inquiry = await Inquiry.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after' }).lean();
  if (!inquiry) throw notFound('Inquiry');
  return inquiry;
}

export async function deleteInquiry(id: string) {
  await connectDB();
  if (!(await Inquiry.findByIdAndDelete(id))) throw notFound('Inquiry');
}
