import { createHash, timingSafeEqual } from 'node:crypto';

// Demo-grade auth: one shared password for the whole newsroom, held in an
// httpOnly cookie. It is enough to keep the goal out of a stranger's hands and
// no more — a real deployment should put this behind the org's own SSO.

const COOKIE = 'tally_admin';

export const adminPassword = () => process.env.ADMIN_PASSWORD || 'letmein';

const token = () =>
  createHash('sha256')
    .update(adminPassword() + (process.env.SESSION_SALT || 'tally'))
    .digest('hex');

export function isAuthed(cookies) {
  const given = cookies.get(COOKIE)?.value;
  if (!given) return false;
  const expected = token();
  if (given.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

export function signIn(cookies, password) {
  if (password !== adminPassword()) return false;
  cookies.set(COOKIE, token(), {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 14,
  });
  return true;
}

export function signOut(cookies) {
  cookies.delete(COOKIE, { path: '/' });
}

export const usingDefaultPassword = () => !process.env.ADMIN_PASSWORD;
