import { requireUser } from '@/server/session';
import { json, readJson, route } from '@/server/http';
import { getSettings, updateSettings } from '@/server/services/settings';

export const GET = route(async () => json(await getSettings()));

export const PUT = route(async (req) => {
  await requireUser(req, 'owner');
  return json(await updateSettings(await readJson(req)));
});
