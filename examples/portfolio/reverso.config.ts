import { defineConfig } from '@reverso/core';

export default defineConfig({
  include: ['src/**/*.tsx'],
  exclude: ['node_modules', '.next'],
  output: {
    schema: '.reverso/schema.json',
    types: '.reverso/types.ts',
  },
  database: {
    provider: 'sqlite',
    url: '.reverso/portfolio.db',
  },
  locales: ['en'],
  defaultLocale: 'en',
});
