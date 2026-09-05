import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  base: '/admin/',
  test: {
    // The admin is a browser-only SPA; run unit tests in a DOM environment
    // so browser APIs (DOMPurify, document, window) work as in production.
    environment: 'jsdom',
    exclude: ['**/node_modules/**', '**/e2e/**'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Standalone admin dev (`pnpm dev` in packages/admin) proxies to the
      // Reverso API started by `reverso dev` (default port 3001).
      //
      // `changeOrigin` is deliberately off: rewriting Host to the target
      // makes the browser's Origin (localhost:5173) disagree with the Host
      // the API sees, and the API rejects cookie-authenticated writes whose
      // Origin points somewhere else. Passing the original Host through keeps
      // the two in step, and localhost targets do not need the rewrite.
      '/api': {
        target: 'http://localhost:3001',
      },
      '/auth': {
        target: 'http://localhost:3001',
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyDirOnce: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
});
