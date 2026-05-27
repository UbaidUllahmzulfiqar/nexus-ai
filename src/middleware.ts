import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const PUBLIC_PATHS = ['/', '/login', '/signup', '/api/auth'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // allow public paths
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  // protect dashboard and app routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/app')) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/app/:path*'],
};
