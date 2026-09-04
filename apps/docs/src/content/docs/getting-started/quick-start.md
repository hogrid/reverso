---
title: Quick Start
description: Get started with Reverso CMS in 5 minutes
---

# Quick Start

Get your CMS running in 5 minutes.

## 1. Create a new project

```bash
npx create-reverso@latest my-site
cd my-site
```

The generated site (Next.js by default) already reads its content through
`@reverso/client`; the components carry `data-reverso` markers with fallback
text.

## 2. Add markers to your components

```tsx
// app/page.tsx
export default function Home() {
  return (
    <section>
      <h1 data-reverso="home.hero.title" data-reverso-type="text">
        Hello World
      </h1>
      <p data-reverso="home.hero.subtitle" data-reverso-type="textarea">
        Welcome to my website
      </p>
    </section>
  );
}
```

## 3. Start the CMS

```bash
# Scans markers, creates the database, serves API + admin, watches for changes
npm run reverso:dev      # or: npx reverso dev
```

## 4. Create the first admin and edit content

Open `http://localhost:3001/admin`. On a fresh install the login page opens
in **create your account** mode. Register, open the page detected from your
markers, edit a field and save: it is published immediately.

## 5. Run your site

```bash
npm run dev
```

Your site renders the content you saved; until then it shows the fallback
text from the components. Add a new marker to any component and it appears
in the admin without restarting anything.

## Next Steps

- Learn about [markers](/concepts/markers/)
- Explore [field types](/concepts/field-types/)
- Read the [CLI reference](/cli/)
