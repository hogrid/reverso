---
title: Using Repeaters
description: Create repeatable content blocks with Reverso CMS
---

# Using Repeaters

Repeaters allow content editors to add, remove, and reorder items in a list.

## Basic Repeater Pattern

Use `$` in the path to indicate a repeatable item:

```tsx
export function TeamSection() {
  const teamMembers = [
    { name: 'Alice', role: 'CEO' },
    { name: 'Bob', role: 'CTO' },
  ];

  return (
    <section>
      <h2 data-reverso="about.team.title">Our Team</h2>
      <div className="team-grid">
        {teamMembers.map((member, index) => (
          <div key={index} className="team-card">
            <img
              data-reverso="about.team.$.photo"
              data-reverso-type="image"
              data-reverso-label="Photo"
              src="/placeholder-avatar.jpg"
            />
            <h3 data-reverso="about.team.$.name" data-reverso-label="Name">
              {member.name}
            </h3>
            <p data-reverso="about.team.$.role" data-reverso-label="Role">
              {member.role}
            </p>
            <p
              data-reverso="about.team.$.bio"
              data-reverso-type="textarea"
              data-reverso-label="Bio"
            >
              A brief bio...
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
```

The `$` tells Reverso that `team` is a repeater with fields: photo, name, role, and bio.

## How It Works

1. **Scanner detects** paths with `$`
2. **Creates a section** with `isRepeater: true`
3. **Admin shows** a repeater interface with add/remove/reorder
4. **Content stored** with indices: `about.team.0.name`, `about.team.1.name`, etc.

## Features List Example

```tsx
export function FeaturesSection() {
  return (
    <section className="features">
      <h2 data-reverso="home.features.title">Features</h2>
      <p data-reverso="home.features.subtitle" data-reverso-type="textarea">
        Everything you need to succeed
      </p>

      <div className="features-grid">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="feature-card">
            <div
              data-reverso="home.features.$.icon"
              data-reverso-type="image"
              data-reverso-label="Icon"
              className="feature-icon"
            />
            <h3 data-reverso="home.features.$.title" data-reverso-label="Title">
              Feature Title
            </h3>
            <p
              data-reverso="home.features.$.description"
              data-reverso-type="textarea"
              data-reverso-label="Description"
            >
              Feature description goes here
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
```

## Testimonials Example

```tsx
export function TestimonialsSection() {
  return (
    <section className="testimonials">
      <h2 data-reverso="home.testimonials.title">What People Say</h2>

      <div className="testimonials-slider">
        {[1, 2, 3].map((i) => (
          <blockquote key={i} className="testimonial">
            <img
              data-reverso="home.testimonials.$.avatar"
              data-reverso-type="image"
              data-reverso-label="Avatar"
              src="/placeholder-avatar.jpg"
              className="testimonial-avatar"
            />
            <p
              data-reverso="home.testimonials.$.quote"
              data-reverso-type="textarea"
              data-reverso-label="Quote"
              className="testimonial-quote"
            >
              "This product changed my life..."
            </p>
            <footer>
              <cite
                data-reverso="home.testimonials.$.author"
                data-reverso-label="Author Name"
              >
                John Doe
              </cite>
              <span
                data-reverso="home.testimonials.$.company"
                data-reverso-label="Company"
              >
                Acme Inc
              </span>
            </footer>
          </blockquote>
        ))}
      </div>
    </section>
  );
}
```

## FAQ Example

```tsx
export function FAQSection() {
  return (
    <section className="faq">
      <h2 data-reverso="home.faq.title">Frequently Asked Questions</h2>

      <div className="faq-list">
        {[1, 2, 3, 4, 5].map((i) => (
          <details key={i} className="faq-item">
            <summary
              data-reverso="home.faq.$.question"
              data-reverso-label="Question"
            >
              How do I get started?
            </summary>
            <div
              data-reverso="home.faq.$.answer"
              data-reverso-type="wysiwyg"
              data-reverso-label="Answer"
            >
              <p>Getting started is easy...</p>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
```

## Pricing Tiers Example

```tsx
export function PricingSection() {
  return (
    <section className="pricing">
      <h2 data-reverso="pricing.header.title">Simple Pricing</h2>
      <p data-reverso="pricing.header.subtitle" data-reverso-type="textarea">
        Choose the plan that's right for you
      </p>

      <div className="pricing-grid">
        {[1, 2, 3].map((i) => (
          <div key={i} className="pricing-card">
            <h3 data-reverso="pricing.plans.$.name" data-reverso-label="Plan Name">
              Pro
            </h3>
            <p
              data-reverso="pricing.plans.$.description"
              data-reverso-type="textarea"
              data-reverso-label="Description"
            >
              For growing businesses
            </p>
            <div className="price">
              <span
                data-reverso="pricing.plans.$.price"
                data-reverso-type="number"
                data-reverso-label="Price"
              >
                99
              </span>
              <span
                data-reverso="pricing.plans.$.period"
                data-reverso-label="Period"
              >
                /month
              </span>
            </div>
            <div
              data-reverso="pricing.plans.$.features"
              data-reverso-type="wysiwyg"
              data-reverso-label="Features List"
            >
              <ul>
                <li>Unlimited projects</li>
                <li>Priority support</li>
              </ul>
            </div>
            <a
              data-reverso="pricing.plans.$.cta"
              data-reverso-type="link"
              data-reverso-label="CTA Button"
              href="#"
              className="btn"
            >
              Get Started
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
```

## Nested Content

Each repeater item can have multiple fields:

```tsx
{items.map((item, i) => (
  <article key={i}>
    {/* Multiple fields per item */}
    <img data-reverso="blog.posts.$.image" data-reverso-type="image" />
    <span data-reverso="blog.posts.$.category">Category</span>
    <h2 data-reverso="blog.posts.$.title">Post Title</h2>
    <p data-reverso="blog.posts.$.excerpt" data-reverso-type="textarea">
      Excerpt...
    </p>
    <time data-reverso="blog.posts.$.date" data-reverso-type="date">
      2025-01-15
    </time>
    <span data-reverso="blog.posts.$.author">Author Name</span>
    <a data-reverso="blog.posts.$.link" data-reverso-type="link">
      Read More
    </a>
  </article>
))}
```

## Admin Interface

In the admin panel, repeaters show:

- **Add button** to create new items
- **Drag handles** to reorder items
- **Delete button** on each item
- **Collapsed view** to manage many items

## Best Practices

### 1. Set Meaningful Defaults

```tsx
{items.map((_, i) => (
  <div key={i}>
    <h3 data-reverso="home.services.$.title">
      Service Title {/* Good default */}
    </h3>
    <p data-reverso="home.services.$.description">
      Describe this service and its benefits to customers.
    </p>
  </div>
))}
```

### 2. Use Clear Labels

```tsx
<img
  data-reverso="about.team.$.photo"
  data-reverso-type="image"
  data-reverso-label="Team Member Photo"
  data-reverso-help="Square image, minimum 400x400px"
/>
```

### 3. Group Related Fields

Keep all fields for one repeater item together in the markup.

## Next Steps

- [Media Management](/guides/media/) - Work with images and files
- [Form Builder](/guides/forms/) - Create contact forms
