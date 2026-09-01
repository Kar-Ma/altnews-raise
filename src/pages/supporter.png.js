import { getRaise } from '../lib/raise.mjs';
import { supporterPng, cleanName } from '../lib/supporter.mjs';

export const prerender = false;

export async function GET({ url }) {
  const s = await getRaise();
  const png = await supporterPng(s, { name: cleanName(url.searchParams.get('name')) });
  return new Response(png, {
    headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=60' },
  });
}
