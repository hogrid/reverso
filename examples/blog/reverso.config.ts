import { defineConfig } from '@reverso/core';

export default defineConfig({
  // Source files to scan for data-reverso markers
  include: ['src/**/*.tsx'],
  exclude: ['node_modules', '.next'],

  // Output configuration
  output: {
    schema: '.reverso/schema.json',
    types: '.reverso/types.ts',
  },

  // Database configuration
  database: {
    provider: 'sqlite',
    url: '.reverso/blog.db',
  },

  // Locales support
  locales: ['en', 'pt'],
  defaultLocale: 'en',
});
