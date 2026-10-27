import { getUser } from '@/server/auth';
import { requireUser } from '@/server/session';
import { json, readJson, route } from '@/server/http';
import { deleteProduct, getProductBySlug, updateProduct } from '@/server/services/products';

// GET takes a slug; PUT/DELETE take an id.
export const GET = route<{ key: string }>(async (req, { key }) => json(await getProductBySlug(key, Boolean(await getUser(req)))));

export const PUT = route<{ key: string }>(async (req, { key }) => {
  await requireUser(req);
  return json(await updateProduct(key, await readJson(req)));
});

export const DELETE = route<{ key: string }>(async (req, { key }) => {
  await requireUser(req);
  await deleteProduct(key);
  return json({ ok: true });
});
