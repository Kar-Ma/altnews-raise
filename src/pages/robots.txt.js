import { getSnapshot } from '../lib/source.mjs';

export const prerender = false;

// A page quoting invented figures under a real organisation's name has no
// business in a search index, so demo mode asks crawlers to stay out entirely.
// Once it is reading real payments, only the control panel stays hidden.
export async function GET() {
  const { mode } = await getSnapshot();
  const body = mode === 'demo'
    ? `# Demo deployment: the numbers here are generated, not real.\nUser-agent: *\nDisallow: /\n`
    : `# The public appeal is meant to be found. The control panel is not.\nUser-agent: *\nDisallow: /admin\nDisallow: /api/admin\nAllow: /\n`;
  return new Response(body, {
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=300' },
  });
}
