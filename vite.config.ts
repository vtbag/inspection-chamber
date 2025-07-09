import { defineConfig } from 'vite';

export default defineConfig({
  root: 'nsrc',  // Set the root directory
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: ['nsrc/index.html']
    }
  }
});
