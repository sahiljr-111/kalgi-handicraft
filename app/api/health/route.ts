import { connectDB } from '@/server/db';
import { json, route } from '@/server/http';

export const dynamic = 'force-dynamic';

export const GET = route(async () => {
  const conn = await connectDB();
  return json({ ok: true, db: conn.connection.readyState === 1, time: new Date().toISOString() });
});
