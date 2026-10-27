import slugifyLib from 'slugify';
import type { Model } from 'mongoose';

export function slugify(input: string): string {
  return slugifyLib(input, { lower: true, strict: true, trim: true });
}

/** A slug unique within the collection, appending -2, -3… if needed. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- works with any collection
export async function uniqueSlug(model: Model<any>, base: string, excludeId?: string): Promise<string> {
  const root = slugify(base) || 'item';
  let candidate = root;
  let n = 2;
  while (await model.exists(excludeId ? { slug: candidate, _id: { $ne: excludeId } } : { slug: candidate })) {
    candidate = `${root}-${n++}`;
  }
  return candidate;
}

export const escapeRegex = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function pagination(q: Record<string, string | undefined>, defaultLimit = 20, maxLimit = 100) {
  const page = Math.max(1, Number(q.page) || 1);
  const limit = Math.min(maxLimit, Math.max(1, Number(q.limit) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}
