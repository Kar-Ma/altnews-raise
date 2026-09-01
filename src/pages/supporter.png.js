import { getSnapshot } from '../lib/source.mjs';
import { supporterPng, cleanName } from '../lib/supporter.mjs';

export const prerender = false;

export async function GET({ url }) {
  const s = await getSnapshot();
  const amountRupees = Number(url.searchParams.get('amount'));
  const png = await supporterPng(s, {
    name: cleanName(url.searchParams.get('name')),
    showAmount: url.searchParams.get('showAmount') === '1',
    amountPaise: Number.isFinite(amountRupees) && amountRupees > 0
      ? Math.round(amountRupees * 100)
      : null,
  });
  return new Response(png, {
    headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=60' },
  });
}
