// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://brrs-kitchen.com',
  output: 'server',
  adapter: vercel(),
});