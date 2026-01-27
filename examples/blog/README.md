# Reverso Blog Example

A complete blog template demonstrating Reverso CMS capabilities with Next.js.

## Features

- **Homepage** with hero section, featured posts grid, and newsletter signup
- **Blog posts** with rich text content, author info, tags, and categories
- **Global components** (header, footer) with editable navigation
- **Repeaters** for dynamic content (posts, navigation links, social links)
- **Multiple field types** showcased (text, textarea, image, date, wysiwyg, multiselect)

## Getting Started

1. Install dependencies:
   \`\`\`bash
   pnpm install
   \`\`\`

2. Run the Reverso scanner to detect markers:
   \`\`\`bash
   pnpm reverso:scan
   \`\`\`

3. Start the development server:
   \`\`\`bash
   pnpm dev
   \`\`\`

4. Open Reverso admin panel to edit content:
   \`\`\`bash
   pnpm reverso:dev
   \`\`\`

## Content Structure

The scanner will detect the following structure:

\`\`\`
home/
  hero/
    title (text)
    subtitle (textarea)
    backgroundImage (image)
    ctaText (text)
  featured/
    title (text)
    description (textarea)
    posts (repeater)
      $.image (image)
      $.category (text)
      $.title (text)
      $.excerpt (textarea)
      $.author (text)
      $.date (date)
  newsletter/
    title (text)
    description (textarea)
    buttonText (text)
    disclaimer (text)

post/
  header/
    category (text)
    title (text)
    excerpt (textarea)
    date (date)
    readTime (text)
  author/
    avatar (image)
    name (text)
  featuredImage (image)
  content (wysiwyg)
  tags (multiselect)

site/
  header/
    logo (image)
    siteName (text)
    navigation (repeater)
    ctaText (text)
  footer/
    siteName (text)
    description (textarea)
    socialLinks (repeater)
    quickLinksTitle (text)
    quickLinks (repeater)
    categoriesTitle (text)
    categories (repeater)
    copyright (text)
\`\`\`

## Customization

Edit the components in \`src/components/\` to customize the layout and styling. The \`data-reverso-*\` attributes define what content is editable through the admin panel.

## Learn More

- [Reverso Documentation](https://reverso.dev/docs)
- [Next.js Documentation](https://nextjs.org/docs)
