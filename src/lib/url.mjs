/**
 * Behind a proxy — which is every serverless host — the URL Astro sees carries
 * the internal hostname, not the one in the visitor's address bar. Left alone
 * that produced `https://localhost/og.png` as the og:image on the live site,
 * so no link preview worked anywhere: the one thing this page is supposed to
 * be good at.
 *
 * The forwarded headers carry the real host. Fall back to the request's own
 * URL for local development, where they are absent and it is already correct.
 */
export function publicOrigin(request, requestUrl) {
  const headers = request?.headers;
  const host = headers?.get('x-forwarded-host') || headers?.get('host');
  if (!host) return new URL(requestUrl).origin;

  const proto = headers.get('x-forwarded-proto')
    || (host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https');
  // A comma-separated chain means several proxies; the first entry is the one
  // the visitor actually typed.
  return `${proto.split(',')[0].trim()}://${host.split(',')[0].trim()}`;
}

/** Absolute public URL for a path, safe to put in a meta tag or hand to a human. */
export function publicUrl(request, requestUrl, path = '/') {
  return new URL(path, publicOrigin(request, requestUrl)).href;
}
