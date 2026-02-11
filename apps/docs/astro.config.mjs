import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: 'Reverso CMS',
      description: 'The front-to-back CMS for modern web development',
      logo: {
        light: './src/assets/logo-light.svg',
        dark: './src/assets/logo-dark.svg',
        replacesTitle: true,
      },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/hogrid/reverso' },
        { icon: 'discord', label: 'Discord', href: 'https://discord.gg/reverso' },
        { icon: 'x.com', label: 'X', href: 'https://twitter.com/reversocms' },
      ],
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Introduction', link: '/getting-started/introduction/' },
            { label: 'Quick Start', link: '/getting-started/quick-start/' },
            { label: 'Installation', link: '/getting-started/installation/' },
            { label: 'Configuration', link: '/getting-started/configuration/' },
          ],
        },
        {
          label: 'Core Concepts',
          items: [
            { label: 'How It Works', link: '/concepts/how-it-works/' },
            { label: 'Markers', link: '/concepts/markers/' },
            { label: 'Field Types', link: '/concepts/field-types/' },
            { label: 'Schema Structure', link: '/concepts/schema/' },
          ],
        },
        {
          label: 'Guides',
          items: [
            { label: 'Creating Pages', link: '/guides/creating-pages/' },
            { label: 'Using Repeaters', link: '/guides/repeaters/' },
            { label: 'Media Management', link: '/guides/media/' },
            { label: 'Form Builder', link: '/guides/forms/' },
            { label: 'SEO & Redirects', link: '/guides/seo/' },
            { label: 'Internationalization', link: '/guides/i18n/' },
          ],
        },
        {
          label: 'Packages',
          collapsed: true,
          items: [
            { label: 'Overview', link: '/packages/overview/' },
            { label: '@reverso/core', link: '/packages/core/' },
            { label: '@reverso/scanner', link: '/packages/scanner/' },
            { label: '@reverso/db', link: '/packages/db/' },
            { label: '@reverso/api', link: '/packages/api/' },
            { label: '@reverso/admin', link: '/packages/admin/' },
            { label: '@reverso/blocks', link: '/packages/blocks/' },
            { label: '@reverso/forms', link: '/packages/forms/' },
            { label: '@reverso/cli', link: '/packages/cli/' },
            { label: '@reverso/mcp', link: '/packages/mcp/' },
            { label: 'create-reverso', link: '/packages/create-reverso/' },
          ],
        },
        {
          label: 'API Reference',
          collapsed: true,
          items: [
            { label: 'REST API', link: '/api/rest/' },
            { label: 'MCP Tools', link: '/api/mcp/' },
          ],
        },
      ],
      editLink: {
        baseUrl: 'https://github.com/hogrid/reverso/edit/main/apps/docs/',
      },
      customCss: ['./src/styles/custom.css'],
      head: [
        {
          tag: 'meta',
          attrs: {
            property: 'og:image',
            content: 'https://reverso.dev/og-image.png',
          },
        },
      ],
    }),
  ],
});
