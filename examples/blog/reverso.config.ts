import { defineConfig } from '@reverso/core';

export default defineConfig({
  name: 'Reverso Blog Example',

  // Source directory to scan for data-reverso markers
  srcDir: './src',

  // Output directory for generated files
  outputDir: '.reverso',

  // Database configuration
  database: {
    provider: 'sqlite',
    url: '.reverso/blog.db',
  },

  // Scanner configuration
  scanner: {
    include: ['**/*.tsx'],
    exclude: ['**/node_modules/**', '**/.next/**'],
  },

  // Development server settings
  dev: {
    port: 3001,
  },
});
