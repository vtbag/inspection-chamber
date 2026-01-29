import { defineConfig, fontProviders } from 'astro/config';


export default defineConfig({
  devToolbar: { enabled: false },
  site: 'https://none',
  compressHTML: true,

  experimental: {
    preserveScriptOrder: true,
    headingIdCompat: true,
    fonts: [{
      provider: fontProviders.local(),
      name: "Roboto Condensed",
      cssVariable: "--vtbag-ic-font-labels",
      options: {
        variants: [
          {
            weight: 400,
            style: "normal",
            src: ["./src/assets/fonts/optimizedRobotoCondensed.woff2"],
            display: "block",
            unicodeRange: ["U+20-7E"],
          },
        ],
      }
    }, {
      provider: fontProviders.local(),
      name: "Audiowide",
      cssVariable: "--vtbag-ic-font-logo",
      options: {
        variants: [
          {
            weight: 400,
            style: "normal",
            src: ["./src/assets/fonts/optimizedAudiowide.woff2"],
            display: "block",
            unicodeRange: ["U+20-7E"],
          },
        ],
      }
    }],
  },
  prefetch: false,

  trailingSlash: 'always',

  vite: {
    build: {
      minify: false,
      cssMinify: false,
      assetsInlineLimit: 400000,
    },
    server: {
      fs: {
        allow: ['..']
      }
    },
  },
});

