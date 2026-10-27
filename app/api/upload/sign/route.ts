import { requireUser } from '@/server/session';
import { json, route } from '@/server/http';
import { signUpload } from '@/server/storage';

export const POST = route(async (req) => {
  await requireUser(req);
  return json(signUpload());
});
