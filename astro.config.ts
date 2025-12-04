import { defineConfig } from 'astro/config';


export default defineConfig({
  devToolbar: { enabled: false },
  site: 'https://none',
  compressHTML: true,

  experimental: {
    preserveScriptOrder: true,
    headingIdCompat: true,
    fonts: [/*{
      provider: fontProviders.google(),
      name: "Roboto Condensed",
      cssVariable: "--font-labels",
      styles: ["normal"],
      subsets: ["latin"],
      display: "block",
      unicodeRange: ["U+26"],
    }, {
      provider: fontProviders.google(),
      name: "Audiowide",
      cssVariable: "--font-logo-old",
      styles: ["normal"],
      subsets: ["latin"],
      display: "block",
      unicodeRange: ["U+26"],
    },*/ {
      provider: "local",
      name: "Roboto Condensed",
      cssVariable: "--font-labels",
      variants: [
        {
          weight: 400,
          style: "normal",
          src: ["./src/assets/fonts/optimizedRobotoCondensed.woff2"],
          display: "block",
          unicodeRange: ["U+20-7E"],
        },
      ],
    },{
      provider: "local",
      name: "Audiowide",
      cssVariable: "--font-logo",
      variants: [
        {
          weight: 400,
          style: "normal",
          src: ["./src/assets/fonts/optimizedAudiowide.woff2"],
          display: "block",
          unicodeRange: ["U+20-7E"],
        },
      ],
    }],
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

