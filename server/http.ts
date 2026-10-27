import mongoose from 'mongoose';
import { NextResponse, type NextRequest } from 'next/server';
import { ZodError } from 'zod';

import { AUTH_COOKIE } from './auth';
import { HttpError } from './errors';

export { HttpError, notFound } from './errors';

export function errorResponse(err: unknown): NextResponse {
  if (err instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of err.issues) {
      const key = issue.path.join('.') || '_';
      fields[key] ??= issue.message;
    }
    return NextResponse.json({ error: 'Please check the highlighted fields', fields }, { status: 400 });
  }
  if (err instanceof HttpError) {
    const res = NextResponse.json({ error: err.message, fields: err.fields }, { status: err.status });
    // A rejected session must not linger: middleware would keep treating it as signed in.
    if (err.status === 401) res.cookies.set(AUTH_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
    return res;
  }
  if (err instanceof mongoose.Error.CastError) {
    return NextResponse.json({ error: `Invalid ${err.path}` }, { status: 400 });
  }
  if (err instanceof mongoose.Error.ValidationError) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
  if (typeof err === 'object' && err && (err as { code?: number }).code === 11000) {
    const key = Object.keys((err as { keyValue?: object }).keyValue ?? {})[0] ?? 'field';
    return NextResponse.json({ error: `That ${key} is already in use`, fields: { [key]: 'Already in use' } }, { status: 409 });
  }
  // Database unreachable (e.g. Atlas Network Access doesn't allow this IP): say so plainly.
  const msg = err instanceof Error ? err.message : '';
  if (
    err instanceof mongoose.Error.MongooseServerSelectionError ||
    /buffering timed out|Could not connect to any servers|ECONNREFUSED|ENOTFOUND/i.test(msg)
  ) {
    console.error('[api] Database unreachable:', msg);
    return NextResponse.json(
      { error: 'Cannot connect to the database right now. Please try again in a minute. If this keeps happening, check MongoDB Atlas → Network Access.' },
      { status: 503 },
    );
  }
  console.error('[api] Unhandled error', err);
  return NextResponse.json(
    {
      error: 'Something went wrong on our side',
      ...(process.env.NODE_ENV === 'production' ? {} : { details: err instanceof Error ? err.message : String(err) }),
    },
    { status: 500 },
  );
}

type Ctx<P> = { params: Promise<P> };

/** Wraps a route handler so thrown errors become JSON responses. */
export function route<P = Record<string, never>>(fn: (req: NextRequest, params: P) => Promise<Response>) {
  return async (req: NextRequest, ctx: Ctx<P>) => {
    try {
      return await fn(req, (await ctx?.params) as P);
    } catch (err) {
      return errorResponse(err);
    }
  };
}

export const json = (data: unknown, init?: ResponseInit) => NextResponse.json(data, init);

export async function readJson(req: NextRequest): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

export const queryOf = (req: NextRequest) => Object.fromEntries(req.nextUrl.searchParams) as Record<string, string | undefined>;

export function clientIp(req: NextRequest): string {
  // Platform-set headers first (Netlify, then Vercel/most proxies).
  return (
    req.headers.get('x-nf-client-connection-ip') ||
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}
