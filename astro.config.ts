import { defineConfig, fontProviders } from 'astro/config';


export default defineConfig({
  devToolbar: { enabled: false },
  site: 'https://none',
  compressHTML: true,

  experimental: {
    preserveScriptOrder: true,
    headingIdCompat: true,
    fonts: [{
      provider: fontProviders.google(),
      name: "Roboto Condensed",
      cssVariable: "--font-labels",
      styles: ["normal"],
      subsets: ["latin"],
      display: "block",
    },{
      provider: fontProviders.google(),
      name: "Audiowide",
      cssVariable: "--font-logo",
      styles: ["normal"],
      subsets: ["latin"],
      display: "block",
    }]
  },
  prefetch: false,

  trailingSlash: 'always',

  vite: {
    build: {
      minify: true,
      cssMinify: true,
      assetsInlineLimit: 400000,
    },
    server: {
      fs: {
        allow: ['..']
      }
    },
  },
});

