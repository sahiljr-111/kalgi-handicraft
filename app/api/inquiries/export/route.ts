import { requireUser } from '@/server/session';
import { queryOf, route } from '@/server/http';
import { exportInquiriesCsv } from '@/server/services/inquiries';

export const GET = route(async (req) => {
  await requireUser(req);
  const csv = await exportInquiriesCsv(queryOf(req));
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="kalgi-inquiries-${date}.csv"`,
    },
  });
});
