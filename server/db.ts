import mongoose from 'mongoose';
import { env } from './env';

type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };

// Reuse one connection per server instance: serverless functions and Next.js
// dev hot-reloads would otherwise open a new pool on every request.
const g = globalThis as unknown as { __kalgiMongoose?: Cache };
const cache: Cache = (g.__kalgiMongoose ??= { conn: null, promise: null });

export async function connectDB(): Promise<typeof mongoose> {
  // 1 = connected, 2 = connecting. After a network drop the driver can end up
  // fully disconnected (0); queries would then wait and time out forever, so
  // start a fresh connection instead of reusing the dead one.
  const state = mongoose.connection.readyState;
  if (cache.conn && (state === 1 || state === 2)) return cache.conn;
  if (cache.conn && state !== 1 && state !== 2) {
    console.warn(`[db] connection lost (state ${state}), reconnecting`);
    cache.conn = null;
    cache.promise = null;
  }
  if (!env.mongoUri) throw new Error('MONGODB_URI is not set. Add it to .env.local (see .env.example).');
  mongoose.set('strictQuery', true);
  cache.promise ??= mongoose.connect(env.mongoUri, { maxPoolSize: 10, serverSelectionTimeoutMS: 10_000 });
  try {
    cache.conn = await cache.promise;
  } catch (err) {
    cache.promise = null;
    throw err;
  }
  return cache.conn;
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  cache.conn = null;
  cache.promise = null;
}
