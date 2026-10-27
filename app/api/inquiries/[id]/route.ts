import { requireUser } from '@/server/session';
import { json, readJson, route } from '@/server/http';
import { deleteInquiry, getInquiry, updateInquiry } from '@/server/services/inquiries';

export const GET = route<{ id: string }>(async (req, { id }) => {
  await requireUser(req);
  return json(await getInquiry(id));
});

export const PATCH = route<{ id: string }>(async (req, { id }) => {
  await requireUser(req);
  return json(await updateInquiry(id, await readJson(req)));
});

export const DELETE = route<{ id: string }>(async (req, { id }) => {
  await requireUser(req);
  await deleteInquiry(id);
  return json({ ok: true });
});
