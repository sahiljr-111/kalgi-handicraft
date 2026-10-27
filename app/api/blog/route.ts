import { getUser } from '@/server/auth';
import { requireUser } from '@/server/session';
import { json, queryOf, readJson, route } from '@/server/http';
import { createPost, listPosts } from '@/server/services/blog';

export const GET = route(async (req) => json(await listPosts(queryOf(req), Boolean(await getUser(req)))));

export const POST = route(async (req) => {
  await requireUser(req);
  return json(await createPost(await readJson(req)), { status: 201 });
});
