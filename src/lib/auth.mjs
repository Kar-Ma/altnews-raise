import { createHash, timingSafeEqual } from 'node:crypto';

// Demo-grade auth: one shared password for the whole newsroom, held in an
// httpOnly cookie. It is enough to keep the goal out of a stranger's hands and
// no more — a real deployment should put this behind the org's own SSO.

const COOKIE = 'open_appeal_admin';

export const adminPassword = () => process.env.ADMIN_PASSWORD || 'letmein';

const token = () =>
  createHash('sha256')
    .update(adminPassword() + (process.env.SESSION_SALT || 'open-appeal'))
    .digest('hex');

export function isAuthed(cookies) {
  if (adminLocked()) return false;
  const given = cookies.get(COOKIE)?.value;
  if (!given) return false;
  const expected = token();
  if (given.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

export function signIn(cookies, password) {
  if (adminLocked()) return false;
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

/** Anything that is not someone's laptop running `npm run dev`. */
export const isDeployed = () =>
  process.env.NODE_ENV === 'production' ||
  Boolean(process.env.VERCEL || process.env.RENDER || process.env.RAILWAY_ENVIRONMENT || process.env.FLY_APP_NAME);

/**
 * A deployed admin with no password set would be an open control panel on the
 * public internet. Refuse to open at all rather than fall back to a default
 * everyone can read in this repository.
 */
export const adminLocked = () => usingDefaultPassword() && isDeployed();
