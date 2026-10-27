import { requireUser } from '@/server/session';
import { json, readJson, route } from '@/server/http';
import { createUser, listUsers } from '@/server/services/users';

export const GET = route(async (req) => {
  await requireUser(req, 'owner');
  return json(await listUsers());
});

export const POST = route(async (req) => {
  await requireUser(req, 'owner');
  return json(await createUser(await readJson(req)), { status: 201 });
});
