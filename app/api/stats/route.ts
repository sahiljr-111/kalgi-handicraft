import { requireUser } from '@/server/session';
import { json, route } from '@/server/http';
import { getStats } from '@/server/services/stats';

export const GET = route(async (req) => {
  await requireUser(req);
  return json(await getStats());
});
