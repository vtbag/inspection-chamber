import { defineConfig } from 'astro/config';


export default defineConfig({
  devToolbar: { enabled: false },
  site: 'https://none',
  compressHTML: false,

  experimental: {
    preserveScriptOrder: true,
    headingIdCompat: true,
  },
  prefetch: false,

  trailingSlash: 'always',

  vite: {
    build: {
      minify: false,
      cssMinify: false,
      assetsInlineLimit: 40000000000,
    },
    server: {
      fs: {
        allow: ['..']
      }
    },
  },
});

