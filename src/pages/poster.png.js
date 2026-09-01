import { getRaise } from '../lib/raise.mjs';
import { posterPng } from '../lib/poster.mjs';

export const prerender = false;

export async function GET() {
  const s = await getRaise();
  const png = await posterPng(s);
  return new Response(png, {
    headers: {
      'content-type': 'image/png',
      // Short cache: the poster should never be more than a minute stale.
      'cache-control': 'public, max-age=60, s-maxage=60',
    },
  });
}
