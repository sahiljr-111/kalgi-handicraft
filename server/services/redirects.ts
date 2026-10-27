import { z } from 'zod';
import { connectDB } from '../db';
import { HttpError, notFound } from '../http';
import { Redirect } from '../models';
import { revalidate } from '../revalidate';

const path = z
  .string()
  .trim()
  .transform((v) => {
    try {
      const u = new URL(v, 'https://x.invalid');
      return (u.pathname.replace(/\/+$/, '') || '/') + u.search;
    } catch {
      return v;
    }
  })
  .refine((v) => v.startsWith('/') && !v.startsWith('/admin') && !v.startsWith('/api'), 'Use a website path that starts with /, e.g. /product/old-name');

/**
 * Adds or updates a redirect, keeping the table free of chains and loops:
 * anything that pointed at `from` now points straight at `to`, and a redirect
 * away from the new address is removed (that page exists again).
 */
export async function upsertRedirect(from: string, to: string, auto = false) {
  await connectDB();
  if (from === to) return;
  await Redirect.deleteOne({ from: to });
  await Redirect.updateMany({ to: from }, { $set: { to } });
  await Redirect.updateOne({ from }, { $set: { to, auto, permanent: true } }, { upsert: true });
}

/** Called when a slug changes: /prefix/old -> /prefix/new. */
export async function recordSlugChange(prefix: string, oldSlug: string, newSlug: string) {
  if (!oldSlug || oldSlug === newSlug) return;
  const base = prefix ? `/${prefix}` : '';
  await upsertRedirect(`${base}/${oldSlug}`, `${base}/${newSlug}`, true);
}

/** Target for a path, or null. */
export async function resolveRedirect(from: string) {
  await connectDB();
  const r = await Redirect.findOneAndUpdate({ from }, { $inc: { hits: 1 } }, { returnDocument: 'after' }).lean();
  return r ? { to: r.to, permanent: r.permanent } : null;
}

export async function listRedirects() {
  await connectDB();
  return Redirect.find().sort({ createdAt: -1 }).lean();
}

const input = z.object({ from: path, to: path, permanent: z.boolean().optional().default(true) });

export async function createRedirect(body: unknown) {
  const data = input.parse(body);
  if (data.from === data.to) throw new HttpError(400, 'The old and new address are the same', { to: 'Same as old address' });
  await upsertRedirect(data.from, data.to);
  await Redirect.updateOne({ from: data.from }, { $set: { permanent: data.permanent, auto: false } });
  revalidate({ paths: [data.from.split('?')[0]] });
  return Redirect.findOne({ from: data.from }).lean();
}

export async function deleteRedirect(id: string) {
  await connectDB();
  const r = await Redirect.findByIdAndDelete(id);
  if (!r) throw notFound('Redirect');
}
