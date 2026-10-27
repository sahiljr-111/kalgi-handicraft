import { SignJWT, jwtVerify } from 'jose';
import type { NextRequest, NextResponse } from 'next/server';
import { getJwtSecret } from './env';

// NOTE: no database imports here, so middleware (edge runtime) can use this file.

export const AUTH_COOKIE = 'kalgi_admin';
const MAX_AGE = 7 * 24 * 60 * 60;

export type Role = 'owner' | 'staff';
export interface AuthUser {
  sub: string;
  email: string;
  role: Role;
}

const key = () => new TextEncoder().encode(getJwtSecret());

export async function signToken(user: AuthUser): Promise<string> {
  return new SignJWT({ email: user.email, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.sub)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(key());
}

export async function verifyToken(token: string | undefined | null): Promise<AuthUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ['HS256'] });
    if (!payload.sub || (payload.role !== 'owner' && payload.role !== 'staff')) return null;
    return { sub: payload.sub, email: String(payload.email ?? ''), role: payload.role };
  } catch {
    return null;
  }
}

function tokenFrom(req: NextRequest): string | undefined {
  const cookie = req.cookies.get(AUTH_COOKIE)?.value;
  if (cookie) return cookie;
  const header = req.headers.get('authorization');
  return header?.startsWith('Bearer ') ? header.slice(7) : undefined;
}

/** The signed-in admin, or null for public visitors. */
export const getUser = (req: NextRequest) => verifyToken(tokenFrom(req));

export function setAuthCookie(res: NextResponse, token: string) {
  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export function clearAuthCookie(res: NextResponse) {
  res.cookies.set(AUTH_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
}
