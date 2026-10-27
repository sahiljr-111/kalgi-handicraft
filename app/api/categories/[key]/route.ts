import { getUser } from '@/server/auth';
import { requireUser } from '@/server/session';
import { json, readJson, route } from '@/server/http';
import { deleteCategory, getCategory, updateCategory } from '@/server/services/categories';

export const GET = route<{ key: string }>(async (req, { key }) => json(await getCategory(key, Boolean(await getUser(req)))));

export const PUT = route<{ key: string }>(async (req, { key }) => {
  await requireUser(req);
  return json(await updateCategory(key, await readJson(req)));
});

export const DELETE = route<{ key: string }>(async (req, { key }) => {
  await requireUser(req);
  await deleteCategory(key);
  return json({ ok: true });
});
