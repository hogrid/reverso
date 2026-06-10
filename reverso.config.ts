import { defineConfig } from '@reverso/core';

export default defineConfig({
  // Source directory to scan for data-reverso markers
  srcDir: './src',

  // Output directory for generated files
  outputDir: '.reverso',

  // Database configuration
  database: {
    provider: 'sqlite',
    url: '.reverso/dev.db',
  },

  // API server configuration
  api: {
    cors: true,
  },

  // Development server settings
  dev: {
    port: 3001,
  },
});
