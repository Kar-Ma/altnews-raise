import { getAppeal } from '../lib/appeal.mjs';

export const prerender = false;

// A page quoting invented figures under a real organisation's name has no
// business in a search index, so demo mode asks crawlers to stay out entirely.
// Once it is reading real payments, only the control panel stays hidden.
export async function GET() {
  const { preview } = await getAppeal();
  const body = preview
    ? `# Preview: the figures here are illustrative, not official.\nUser-agent: *\nDisallow: /\n`
    : `# The public appeal is meant to be found. The control panel is not.\nUser-agent: *\nDisallow: /settings\nDisallow: /api/admin\nAllow: /\n`;
  return new Response(body, {
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=300' },
  });
}
