// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'


const PUBLIC_ROUTE = ['/login', '/signup', '/verify-otp', '/select-organization'];
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("accessToken")?.value || request.cookies.get("refreshToken")?.value;
  const isPublicRoute = PUBLIC_ROUTE.some(r => pathname.startsWith(r));
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token && isPublicRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}