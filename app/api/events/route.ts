import { z } from 'zod';
import { readJson, route } from '@/server/http';
import { rateLimit } from '@/server/rateLimit';
import { recordEvent } from '@/server/services/stats';

const eventInput = z.object({
  type: z.enum(['whatsapp_click', 'call_click']),
  productSlug: z.string().max(200).optional().default(''),
  path: z.string().max(300).optional().default(''),
});

export const POST = route(async (req) => {
  await rateLimit(req, 'events', 30, 60, 'Too many events');
  await recordEvent(eventInput.parse(await readJson(req)));
  return new Response(null, { status: 204 });
});
