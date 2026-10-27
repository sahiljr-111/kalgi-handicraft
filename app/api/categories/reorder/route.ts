import { requireUser } from '@/server/session';
import { json, readJson, route } from '@/server/http';
import { reorderCategories } from '@/server/services/categories';

export const PUT = route(async (req) => {
  await requireUser(req);
  await reorderCategories(await readJson(req));
  return json({ ok: true });
});
