import { NextRequest, NextResponse } from 'next/server';
import { DASHBOARD_AUTH_COOKIE, isValidDashboardSession } from './src/lib/dashboardAuth';

const protectedDashboardRoutes = ['/dashboard'];
const protectedApiRoutes = ['/api/applications', '/api/coupons'];

function isProtectedPath(pathname: string) {
  const isDashboardRoute =
    protectedDashboardRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`)) &&
    pathname !== '/dashboard/login';

  const isAdminApiRoute = protectedApiRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  return isDashboardRoute || isAdminApiRoute;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(DASHBOARD_AUTH_COOKIE)?.value;

  if (await isValidDashboardSession(token)) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = '/dashboard/login';
  loginUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/applications/:path*', '/api/coupons/:path*'],
};
