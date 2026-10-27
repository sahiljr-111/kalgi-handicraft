import { requireUser } from '@/server/session';
import { json, route } from '@/server/http';
import { duplicateProduct } from '@/server/services/products';

export const POST = route<{ key: string }>(async (req, { key }) => {
  await requireUser(req);
  return json(await duplicateProduct(key), { status: 201 });
});
