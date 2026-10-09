import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Cambiá `site` por el dominio real de producción antes de publicar.
export default defineConfig({
  site: 'https://peti.cr',
  integrations: [sitemap()],
});
