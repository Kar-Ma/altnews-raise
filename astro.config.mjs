import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import vercel from '@astrojs/vercel';

// The poster renderer reads these at request time, so a serverless bundle has
// to be told to carry them.
const FONTS = [
  'public/fonts/display-600.woff',
  'public/fonts/display-700.woff',
  'public/fonts/display-800.woff',
  'public/fonts/text-400.woff',
  'public/fonts/text-600.woff',
  'public/fonts/text-700.woff',
];

// One repo, both hosts: Vercel sets VERCEL=1 during its build, everywhere else
// gets the Node server. Nobody has to edit this file to deploy.
export default defineConfig({
  output: 'server',

  // Astro's built-in CSRF check compares the Origin header against the host it
  // thinks it is serving. Behind Vercel's proxy those differ, so every POST to
  // /api/admin came back "Cross-site POST form submissions are forbidden" —
  // the settings page saved nothing in production while working fine locally.
  //
  // Turning it off is safe here because the session cookie is SameSite=Lax,
  // which browsers refuse to send on a cross-site POST at all. A forged form
  // from another site therefore arrives with no cookie and is rejected as not
  // signed in. See src/lib/auth.mjs.
  security: { checkOrigin: false },
  adapter: process.env.VERCEL
    ? vercel({ includeFiles: FONTS })
    : node({ mode: 'standalone' }),
  server: { port: 4400 },
});
