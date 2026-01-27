---
title: Quick Start
description: Get started with Reverso CMS in 5 minutes
---

# Quick Start

Get your CMS running in 5 minutes.

## 1. Create a new project

```bash
npx create-reverso@latest
```

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

## 3. Scan and start

```bash
# Scan your code for markers
npx reverso scan

# Start the CMS
npx reverso dev
```

## 4. Edit content

Open `http://localhost:3001/admin` and start editing!

## Next Steps

- Learn about [markers](/concepts/markers/)
- Explore [field types](/concepts/field-types/)
- Read the [CLI reference](/cli/)
