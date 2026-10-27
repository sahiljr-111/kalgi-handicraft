import { requireUser } from '@/server/session';
import { json, readJson, route } from '@/server/http';
import { createRedirect, listRedirects } from '@/server/services/redirects';

export const GET = route(async (req) => {
  await requireUser(req);
  return json(await listRedirects());
});

export const POST = route(async (req) => {
  await requireUser(req, 'owner');
  return json(await createRedirect(await readJson(req)), { status: 201 });
});
