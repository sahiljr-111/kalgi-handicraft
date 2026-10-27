import { NextResponse, type NextRequest } from 'next/server';
import { AUTH_COOKIE, verifyToken } from '@/server/auth';

/** Keeps signed-out visitors out of /admin. API routes check the token themselves. */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const user = await verifyToken(req.cookies.get(AUTH_COOKIE)?.value);

  if (pathname === '/admin/login') {
    return user ? NextResponse.redirect(new URL('/admin', req.url)) : NextResponse.next();
  }
  if (!user) {
    const url = new URL('/admin/login', req.url);
    url.searchParams.set('next', pathname);
    const res = NextResponse.redirect(url);
    res.cookies.delete(AUTH_COOKIE); // drop an expired/invalid token
    return res;
  }
  return NextResponse.next();
}

export const config = { matcher: ['/admin/:path*'] };
