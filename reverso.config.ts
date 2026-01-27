import { defineConfig } from '@reverso/core';

export default defineConfig({
  // Source directory to scan for data-reverso markers
  srcDir: './src',

  // Output directory for generated files
  outputDir: '.reverso',

  // Database configuration
  database: {
    type: 'sqlite',
    url: '.reverso/dev.db',
  },

  // API server configuration
  api: {
    port: 4000,
    cors: true,
  },
});
