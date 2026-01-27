---
title: Markers
description: Learn how to use data-reverso markers in your code
---

# Markers

Markers are HTML data attributes that tell Reverso which elements should be editable in the CMS.

## Basic Syntax

```tsx
<element data-reverso="page.section.field" data-reverso-type="fieldtype">
  Default Content
</element>
```

## The Path

The `data-reverso` attribute contains a **path** that defines where the field lives in your schema:

```
page.section.field
  │     │      │
  │     │      └── Field name
  │     └── Section name
  └── Page name
```

### Examples

```tsx
// Page: home, Section: hero, Field: title
<h1 data-reverso="home.hero.title">Welcome</h1>

// Page: about, Section: team, Field: description
<p data-reverso="about.team.description">Our team...</p>

// Page: blog, Section: post, Field: featured_image
<img data-reverso="blog.post.featured_image" />
```

## Available Attributes

| Attribute | Required | Description |
|-----------|----------|-------------|
| `data-reverso` | Yes | The field path |
| `data-reverso-type` | No | Field type (default: "text") |
| `data-reverso-label` | No | Display label in admin |
| `data-reverso-placeholder` | No | Placeholder text |
| `data-reverso-required` | No | Mark as required |
| `data-reverso-options` | No | Options for select fields |
| `data-reverso-min` | No | Minimum value/length |
| `data-reverso-max` | No | Maximum value/length |
| `data-reverso-width` | No | Field width (1-12 grid) |
| `data-reverso-help` | No | Help text for editors |

## Field Type Attribute

Use `data-reverso-type` to specify the field type:

```tsx
// Text input (default)
<h1 data-reverso="home.hero.title">Title</h1>

// Explicitly set type
<h1 data-reverso="home.hero.title" data-reverso-type="text">Title</h1>

// Textarea for multi-line
<p data-reverso="home.hero.subtitle" data-reverso-type="textarea">
  Description
</p>

// Rich text editor
<div data-reverso="home.about.content" data-reverso-type="wysiwyg">
  <p>Rich content here</p>
</div>

// Image field
<img
  data-reverso="home.hero.image"
  data-reverso-type="image"
  src="/placeholder.jpg"
/>
```

## Labels and Help Text

Make the admin panel clearer for content editors:

```tsx
<h1
  data-reverso="home.hero.title"
  data-reverso-label="Hero Title"
  data-reverso-help="The main headline visitors see first"
  data-reverso-placeholder="Enter a compelling headline..."
>
  Welcome
</h1>
```

## Validation Attributes

Add validation rules:

```tsx
// Required field
<input
  data-reverso="contact.form.email"
  data-reverso-type="email"
  data-reverso-required="true"
/>

// Min/max length
<textarea
  data-reverso="home.hero.subtitle"
  data-reverso-type="textarea"
  data-reverso-min="10"
  data-reverso-max="200"
/>

// Number range
<input
  data-reverso="product.details.price"
  data-reverso-type="number"
  data-reverso-min="0"
  data-reverso-max="10000"
/>
```

## Select Options

Define options for select fields:

```tsx
<select
  data-reverso="page.settings.layout"
  data-reverso-type="select"
  data-reverso-options="full:Full Width,sidebar:With Sidebar,narrow:Narrow"
>
  <option value="full">Full Width</option>
</select>
```

Options format: `value:label,value:label`

## Layout Control

Control field width in the admin panel:

```tsx
// Full width (default)
<input data-reverso="home.hero.title" data-reverso-width="12" />

// Half width
<input data-reverso="home.hero.firstname" data-reverso-width="6" />
<input data-reverso="home.hero.lastname" data-reverso-width="6" />

// One third
<input data-reverso="home.stats.value1" data-reverso-width="4" />
<input data-reverso="home.stats.value2" data-reverso-width="4" />
<input data-reverso="home.stats.value3" data-reverso-width="4" />
```

## Repeater Pattern

For repeatable content, use `$` as a placeholder:

```tsx
// This creates a repeater in the admin
{features.map((feature, index) => (
  <div key={index}>
    <h3 data-reverso="home.features.$.title">{feature.title}</h3>
    <p data-reverso="home.features.$.description">{feature.description}</p>
  </div>
))}
```

The `$` indicates "this is a repeatable item".

## Best Practices

### 1. Consistent Naming

Use consistent, descriptive names:

```tsx
// Good
data-reverso="home.hero.title"
data-reverso="home.hero.subtitle"
data-reverso="home.hero.cta_text"

// Avoid
data-reverso="home.a.b"
data-reverso="h1"
```

### 2. Logical Grouping

Group related fields in the same section:

```tsx
// All hero content in one section
<h1 data-reverso="home.hero.title">...</h1>
<p data-reverso="home.hero.subtitle">...</p>
<img data-reverso="home.hero.background" />

// Separate section for testimonials
<p data-reverso="home.testimonials.$.quote">...</p>
<span data-reverso="home.testimonials.$.author">...</span>
```

### 3. Always Add Labels

Help content editors understand each field:

```tsx
<input
  data-reverso="contact.info.phone"
  data-reverso-type="tel"
  data-reverso-label="Phone Number"
  data-reverso-help="Include country code"
/>
```

## Next Steps

- [Field Types](/concepts/field-types/) - Explore all available field types
- [Schema Structure](/concepts/schema/) - Understand the generated schema
