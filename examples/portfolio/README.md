# Reverso Portfolio Example

A modern portfolio template demonstrating Reverso CMS capabilities with Next.js.

## Features

- **Hero section** with personal introduction, social links, and profile image
- **Skills showcase** with icon, title, and description cards
- **Projects gallery** with hover effects and project details
- **About section** with bio, stats, and work experience timeline
- **Contact section** with info and contact form
- **Fixed navigation** with editable links

## Content Structure

The scanner will detect:

\`\`\`
home/
  hero/
    greeting, name, title, bio (text/textarea)
    profileImage (image)
    primaryCta, secondaryCta (text)
    socialLinks (repeater)
  skills/
    title, subtitle (text/textarea)
    items (repeater)
      $.icon, $.title, $.description
  projects/
    title, subtitle, viewAllText (text/textarea)
    items (repeater)
      $.image, $.category, $.title, $.description
  about/
    title (text)
    content (wysiwyg)
    stats (repeater)
    experienceTitle (text)
    experience (repeater)
  contact/
    title, subtitle (text/textarea)
    email (email), location, availability, submitText (text)

site/
  nav/
    logo, ctaText (text)
    links (repeater)
\`\`\`

## Getting Started

\`\`\`bash
pnpm install
pnpm reverso:scan
pnpm dev
\`\`\`

## Learn More

- [Reverso Documentation](https://reverso.dev/docs)
