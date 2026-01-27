---
title: Creating Pages
description: Learn how to create editable pages with Reverso CMS
---

# Creating Pages

This guide shows you how to create pages with editable content using Reverso markers.

## Basic Page Structure

A typical page component with markers:

```tsx
// app/page.tsx (Next.js) or src/pages/index.tsx (Vite)
export default function HomePage() {
  return (
    <main>
      {/* Hero Section */}
      <section className="hero">
        <h1 data-reverso="home.hero.title" data-reverso-type="text">
          Welcome to Our Site
        </h1>
        <p data-reverso="home.hero.subtitle" data-reverso-type="textarea">
          We create amazing digital experiences
        </p>
        <a
          data-reverso="home.hero.cta"
          data-reverso-type="link"
          href="#contact"
        >
          Get Started
        </a>
      </section>

      {/* About Section */}
      <section className="about">
        <h2 data-reverso="home.about.title">About Us</h2>
        <div
          data-reverso="home.about.content"
          data-reverso-type="wysiwyg"
        >
          <p>We are a team of passionate developers...</p>
        </div>
      </section>
    </main>
  );
}
```

## Organizing Sections

Group related content into sections:

```tsx
export function AboutPage() {
  return (
    <>
      {/* Team Section */}
      <section>
        <h2 data-reverso="about.team.title">Our Team</h2>
        <p data-reverso="about.team.description" data-reverso-type="textarea">
          Meet the people behind the magic
        </p>
      </section>

      {/* Mission Section */}
      <section>
        <h2 data-reverso="about.mission.title">Our Mission</h2>
        <div data-reverso="about.mission.content" data-reverso-type="wysiwyg">
          <p>To revolutionize...</p>
        </div>
      </section>

      {/* Values Section */}
      <section>
        <h2 data-reverso="about.values.title">Our Values</h2>
      </section>
    </>
  );
}
```

This creates an "about" page with three sections: team, mission, and values.

## Adding Media

Include images and other media:

```tsx
<section className="hero">
  {/* Background Image */}
  <img
    data-reverso="home.hero.background"
    data-reverso-type="image"
    data-reverso-label="Hero Background"
    src="/images/placeholder-hero.jpg"
    alt="Hero background"
    className="hero-bg"
  />

  {/* Content with Logo */}
  <div className="hero-content">
    <img
      data-reverso="home.hero.logo"
      data-reverso-type="image"
      data-reverso-label="Logo"
      src="/images/logo.png"
      alt="Logo"
    />
    <h1 data-reverso="home.hero.title">Welcome</h1>
  </div>
</section>
```

## Complete Page Example

Here's a full landing page example:

```tsx
// components/LandingPage.tsx
import { useContent } from '@reverso/client'; // Optional: for fetching content

export function LandingPage() {
  return (
    <>
      {/* Navigation */}
      <nav>
        <img
          data-reverso="global.nav.logo"
          data-reverso-type="image"
          src="/logo.svg"
          alt="Logo"
        />
      </nav>

      {/* Hero */}
      <section className="hero">
        <h1
          data-reverso="landing.hero.headline"
          data-reverso-type="text"
          data-reverso-label="Main Headline"
        >
          Build Faster with Reverso
        </h1>
        <p
          data-reverso="landing.hero.subheadline"
          data-reverso-type="textarea"
          data-reverso-label="Subheadline"
        >
          The CMS that works the way you think
        </p>
        <a
          data-reverso="landing.hero.primary_cta"
          data-reverso-type="link"
          data-reverso-label="Primary Button"
          href="#"
          className="btn btn-primary"
        >
          Start Free Trial
        </a>
        <a
          data-reverso="landing.hero.secondary_cta"
          data-reverso-type="link"
          data-reverso-label="Secondary Button"
          href="#"
          className="btn btn-secondary"
        >
          Watch Demo
        </a>
      </section>

      {/* Features */}
      <section className="features">
        <h2 data-reverso="landing.features.title">Why Choose Us</h2>
        <div className="features-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="feature-card">
              <img
                data-reverso={`landing.features.${i}.icon`}
                data-reverso-type="image"
                src={`/icons/feature-${i}.svg`}
              />
              <h3 data-reverso={`landing.features.${i}.title`}>
                Feature {i}
              </h3>
              <p data-reverso={`landing.features.${i}.description`}>
                Description for feature {i}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials">
        <h2 data-reverso="landing.testimonials.title">What Our Clients Say</h2>
        <blockquote
          data-reverso="landing.testimonials.featured.quote"
          data-reverso-type="textarea"
        >
          "This changed everything for our team..."
        </blockquote>
        <cite data-reverso="landing.testimonials.featured.author">
          Jane Doe, CEO
        </cite>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <h2 data-reverso="landing.cta.title">Ready to Get Started?</h2>
        <p data-reverso="landing.cta.description" data-reverso-type="textarea">
          Join thousands of happy customers
        </p>
        <a
          data-reverso="landing.cta.button"
          data-reverso-type="link"
          href="#"
          className="btn btn-large"
        >
          Start Free Trial
        </a>
      </section>

      {/* Footer */}
      <footer>
        <p data-reverso="global.footer.copyright">
          © 2025 Your Company. All rights reserved.
        </p>
      </footer>
    </>
  );
}
```

## Best Practices

### 1. Use Descriptive Labels

```tsx
// Good: Clear labels help content editors
<h1
  data-reverso="home.hero.title"
  data-reverso-label="Hero Title"
  data-reverso-help="The main headline visitors see first (max 60 chars)"
>
  Welcome
</h1>

// Avoid: No context for editors
<h1 data-reverso="home.hero.title">Welcome</h1>
```

### 2. Group Logically

```tsx
// Good: Related content in one section
// home.hero.* all in hero section
<section>
  <h1 data-reverso="home.hero.title">...</h1>
  <p data-reverso="home.hero.subtitle">...</p>
  <img data-reverso="home.hero.image" />
</section>

// Avoid: Scattered naming
<section>
  <h1 data-reverso="home.title">...</h1>
  <p data-reverso="subtitle.home">...</p>
</section>
```

### 3. Use Meaningful Defaults

```tsx
// Good: Realistic placeholder content
<h1 data-reverso="home.hero.title">
  Transform Your Business with AI-Powered Solutions
</h1>

// Avoid: Generic placeholders
<h1 data-reverso="home.hero.title">
  Title Goes Here
</h1>
```

### 4. Set Field Widths

```tsx
// Side-by-side fields in the admin
<div>
  <input data-reverso="contact.form.firstname" data-reverso-width="6" />
  <input data-reverso="contact.form.lastname" data-reverso-width="6" />
</div>
<input data-reverso="contact.form.email" data-reverso-width="12" />
```

## Scanning and Viewing

After adding markers, scan and start the dev server:

```bash
# Scan for markers
npx reverso scan

# Start dev server
npx reverso dev
```

Open `http://localhost:3001` to see your pages in the admin panel.

## Next Steps

- [Using Repeaters](/guides/repeaters/) - Create repeatable content
- [Media Management](/guides/media/) - Work with images and files
