import { getUser } from '@/server/auth';
import { requireUser } from '@/server/session';
import { json, queryOf, readJson, route } from '@/server/http';
import { createProduct, listProducts } from '@/server/services/products';

export const GET = route(async (req) => json(await listProducts(queryOf(req), Boolean(await getUser(req)))));

export const POST = route(async (req) => {
  await requireUser(req);
  return json(await createProduct(await readJson(req)), { status: 201 });
});
