import { requireUser } from '@/server/session';
import { json, readJson, route } from '@/server/http';
import { getPostById, setPostStatus } from '@/server/services/blog';

export const GET = route<{ id: string }>(async (req, { id }) => {
  await requireUser(req);
  return json(await getPostById(id));
});

export const PATCH = route<{ id: string }>(async (req, { id }) => {
  await requireUser(req);
  return json(await setPostStatus(id, await readJson(req)));
});
