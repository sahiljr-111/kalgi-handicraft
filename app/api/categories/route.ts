import { getUser } from '@/server/auth';
import { requireUser } from '@/server/session';
import { json, readJson, route } from '@/server/http';
import { createCategory, listCategories } from '@/server/services/categories';

export const GET = route(async (req) => {
  const showAll = req.nextUrl.searchParams.get('all') === 'true' && Boolean(await getUser(req));
  return json(await listCategories(showAll));
});

export const POST = route(async (req) => {
  await requireUser(req);
  return json(await createCategory(await readJson(req)), { status: 201 });
});
