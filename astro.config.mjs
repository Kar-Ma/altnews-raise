import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// Demo runs on the Node adapter so `npm run dev` and `npm start` behave the same.
// To deploy on Vercel: npm i @astrojs/vercel, then swap the adapter for vercel().
export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  server: { port: 4400 },
});
