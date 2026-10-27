import type { NextRequest } from 'next/server';
import { connectDB } from './db';
import { RateLimit } from './models';
import { HttpError, clientIp } from './http';

/**
 * Fixed-window rate limit stored in MongoDB (a TTL index cleans up expired
 * windows). Works on serverless hosts, where in-memory counters reset per
 * instance.
 */
export async function rateLimit(req: NextRequest, name: string, limit: number, windowSeconds: number, message: string) {
  await connectDB();
  const key = `${name}:${clientIp(req)}`;
  const now = new Date();
  const hit = await RateLimit.findOneAndUpdate(
    { _id: key, expiresAt: { $gt: now } },
    { $inc: { count: 1 } },
    { returnDocument: 'after' },
  ).lean();
  if (!hit) {
    await RateLimit.updateOne(
      { _id: key },
      { $set: { count: 1, expiresAt: new Date(now.getTime() + windowSeconds * 1000) } },
      { upsert: true },
    );
    return;
  }
  if (hit.count > limit) throw new HttpError(429, message);
}
