import { defineCollection } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

// Astro 5+ content collections need an explicit loader; without it the
// collection is empty and the site builds nothing but the 404 page.
export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
};
