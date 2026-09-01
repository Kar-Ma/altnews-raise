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
  adapter: process.env.VERCEL
    ? vercel({ includeFiles: FONTS })
    : node({ mode: 'standalone' }),
  server: { port: 4400 },
});
