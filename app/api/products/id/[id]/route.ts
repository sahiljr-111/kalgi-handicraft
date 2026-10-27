import { requireUser } from '@/server/session';
import { json, route } from '@/server/http';
import { getProductById } from '@/server/services/products';

export const GET = route<{ id: string }>(async (req, { id }) => {
  await requireUser(req);
  return json(await getProductById(id));
});
