import { NextResponse } from 'next/server';
import { DASHBOARD_AUTH_COOKIE } from '@/lib/dashboardAuth';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(DASHBOARD_AUTH_COOKIE);
  response.cookies.set({
    name: DASHBOARD_AUTH_COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
    expires: new Date(0),
    path: '/',
  });

  return response;
}
