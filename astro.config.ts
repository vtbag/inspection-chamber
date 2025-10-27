import { defineConfig, fontProviders } from 'astro/config';


export default defineConfig({
  devToolbar: { enabled: false },
  site: 'https://none',
  compressHTML: false,

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

