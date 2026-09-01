import { getRaise } from '../lib/raise.mjs';
import { summaryPng } from '../lib/summary.mjs';

export const prerender = false;

export async function GET() {
  const png = await summaryPng(await getRaise());
  return new Response(png, {
    headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=60, s-maxage=60' },
  });
}
