export const DASHBOARD_AUTH_COOKIE = 'dashboard_auth';
export const DASHBOARD_SESSION_MAX_AGE = 60 * 60 * 8;

export function getDashboardPassword() {
  return process.env.DASHBOARD_PASSWORD || process.env.DOWNLOAD_PASSWORD || '';
}

function getDashboardSecret() {
  return process.env.ENCRYPTION_KEY || getDashboardPassword();
}

export async function createDashboardSessionToken() {
  const password = getDashboardPassword();
  const secret = getDashboardSecret();

  if (!password || !secret) {
    return '';
  }

  const payload = new TextEncoder().encode(`${password}:${secret}`);
  const digest = await crypto.subtle.digest('SHA-256', payload);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function isValidDashboardSession(token?: string) {
  if (!token) {
    return false;
  }

  const expectedToken = await createDashboardSessionToken();
  return Boolean(expectedToken) && token === expectedToken;
}
