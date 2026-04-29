import { NextResponse } from 'next/server';
import {
  DASHBOARD_AUTH_COOKIE,
  DASHBOARD_SESSION_MAX_AGE,
  createDashboardSessionToken,
  getDashboardPassword,
} from '@/lib/dashboardAuth';

export async function POST(request: Request) {
  const { password } = await request.json();
  const expectedPassword = getDashboardPassword();

  if (!expectedPassword) {
    return NextResponse.json(
      { error: 'Dashboard password is not configured' },
      { status: 500 }
    );
  }

  if (!password || password !== expectedPassword) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: DASHBOARD_AUTH_COOKIE,
    value: await createDashboardSessionToken(),
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: DASHBOARD_SESSION_MAX_AGE,
    path: '/',
  });

  return response;
}
