---
title: Field Types
description: All 35+ field types available in Reverso CMS
---

# Field Types

Reverso supports 35+ field types to cover all your content management needs.

## Text Fields

### text
Single-line text input.

```tsx
<h1 data-reverso="home.hero.title" data-reverso-type="text">
  Hello World
</h1>
```

### textarea
Multi-line text without formatting.

```tsx
<p data-reverso="home.hero.description" data-reverso-type="textarea">
  A longer description that spans multiple lines...
</p>
```

### email
Email address with validation.

```tsx
<a data-reverso="contact.info.email" data-reverso-type="email">
  hello@example.com
</a>
```

### url
URL with validation.

```tsx
<a data-reverso="social.links.website" data-reverso-type="url">
  https://example.com
</a>
```

### phone
Phone number input.

```tsx
<a data-reverso="contact.info.phone" data-reverso-type="phone">
  +1 (555) 123-4567
</a>
```

### number
Numeric input with optional min/max.

```tsx
<span
  data-reverso="product.details.price"
  data-reverso-type="number"
  data-reverso-min="0"
>
  99.99
</span>
```

### range
Slider for numeric ranges.

```tsx
<input
  data-reverso="settings.volume"
  data-reverso-type="range"
  data-reverso-min="0"
  data-reverso-max="100"
/>
```

## Rich Content

### wysiwyg
Rich text editor with formatting.

```tsx
<div data-reverso="blog.post.content" data-reverso-type="wysiwyg">
  <p>This is <strong>rich</strong> content.</p>
</div>
```

### markdown
Markdown editor with preview.

```tsx
<div data-reverso="docs.page.content" data-reverso-type="markdown">
  # Markdown Content

  Write in **markdown** format.
</div>
```

### code
Code editor with syntax highlighting.

```tsx
<pre data-reverso="docs.example.code" data-reverso-type="code">
  const hello = "world";
</pre>
```

### blocks
Block-based editor (similar to Notion/Gutenberg).

```tsx
<div data-reverso="page.main.content" data-reverso-type="blocks">
  <!-- Block content -->
</div>
```

## Selection Fields

### select
Single selection dropdown.

```tsx
<select
  data-reverso="page.settings.layout"
  data-reverso-type="select"
  data-reverso-options="full:Full Width,sidebar:With Sidebar"
>
</select>
```

### multiselect
Multiple selection.

```tsx
<div
  data-reverso="post.meta.tags"
  data-reverso-type="multiselect"
  data-reverso-options="tech:Technology,design:Design,news:News"
>
</div>
```

### radio
Radio button group.

```tsx
<div
  data-reverso="form.choice.option"
  data-reverso-type="radio"
  data-reverso-options="a:Option A,b:Option B,c:Option C"
>
</div>
```

### checkbox
Single checkbox.

```tsx
<input
  data-reverso="settings.notifications.enabled"
  data-reverso-type="checkbox"
/>
```

### checkboxgroup
Multiple checkboxes.

```tsx
<div
  data-reverso="user.preferences.features"
  data-reverso-type="checkboxgroup"
  data-reverso-options="dark:Dark Mode,notifications:Notifications"
>
</div>
```

### boolean
True/false toggle.

```tsx
<span data-reverso="post.meta.featured" data-reverso-type="boolean">
</span>
```

## Media Fields

### image
Single image upload.

```tsx
<img
  data-reverso="home.hero.image"
  data-reverso-type="image"
  src="/placeholder.jpg"
/>
```

### gallery
Multiple images.

```tsx
<div data-reverso="portfolio.project.images" data-reverso-type="gallery">
</div>
```

### file
File upload (any type).

```tsx
<a data-reverso="resources.download.file" data-reverso-type="file">
  Download PDF
</a>
```

### video
Video file or embed.

```tsx
<video data-reverso="home.hero.video" data-reverso-type="video">
</video>
```

### audio
Audio file.

```tsx
<audio data-reverso="podcast.episode.file" data-reverso-type="audio">
</audio>
```

### oembed
Embed from URL (YouTube, Vimeo, etc.).

```tsx
<div data-reverso="blog.post.video_embed" data-reverso-type="oembed">
</div>
```

## Date & Time

### date
Date picker.

```tsx
<time data-reverso="event.details.date" data-reverso-type="date">
  2025-01-15
</time>
```

### datetime
Date and time picker.

```tsx
<time data-reverso="event.details.starts_at" data-reverso-type="datetime">
  2025-01-15T09:00
</time>
```

### time
Time picker.

```tsx
<span data-reverso="business.hours.opens" data-reverso-type="time">
  09:00
</span>
```

## Relationships

### relation
Relation to other content.

```tsx
<div data-reverso="post.meta.author" data-reverso-type="relation">
</div>
```

### taxonomy
Categories or tags.

```tsx
<div data-reverso="post.meta.categories" data-reverso-type="taxonomy">
</div>
```

### link
Link with URL and text.

```tsx
<a data-reverso="home.hero.cta" data-reverso-type="link">
  Learn More
</a>
```

### pagelink
Link to internal page.

```tsx
<a data-reverso="nav.menu.item" data-reverso-type="pagelink">
  About Us
</a>
```

### user
User selector.

```tsx
<span data-reverso="post.meta.author" data-reverso-type="user">
</span>
```

## Advanced

### color
Color picker.

```tsx
<div
  data-reverso="theme.colors.primary"
  data-reverso-type="color"
  style={{ backgroundColor: '#2563eb' }}
>
</div>
```

### map
Google Maps location picker.

```tsx
<div data-reverso="contact.location.map" data-reverso-type="map">
</div>
```

### repeater
Repeatable group of fields.

```tsx
{items.map((item, i) => (
  <div key={i}>
    <h3 data-reverso="home.features.$.title">{item.title}</h3>
    <p data-reverso="home.features.$.description">{item.description}</p>
  </div>
))}
```

### group
Group of fields.

```tsx
<div data-reverso="contact.address" data-reverso-type="group">
  <span data-reverso="contact.address.street">...</span>
  <span data-reverso="contact.address.city">...</span>
</div>
```

### flexible
Flexible content layouts.

```tsx
<div data-reverso="page.sections" data-reverso-type="flexible">
  <!-- Multiple layout options -->
</div>
```

## UI Helpers

### message
Display a message in the admin (no editable content).

```tsx
<div
  data-reverso="admin.notice"
  data-reverso-type="message"
  data-reverso-help="This section requires special attention"
>
</div>
```

### tab / accordion / buttongroup
UI organization elements for the admin panel.

## Field Type Reference

| Type | Description | Admin Component |
|------|-------------|-----------------|
| text | Single line text | Text input |
| textarea | Multi-line text | Textarea |
| number | Numeric value | Number input |
| email | Email address | Email input |
| url | Web URL | URL input |
| phone | Phone number | Tel input |
| wysiwyg | Rich text | Tiptap editor |
| markdown | Markdown text | Markdown editor |
| code | Code snippet | Code editor |
| blocks | Block content | Block editor |
| select | Single choice | Dropdown |
| multiselect | Multiple choices | Multi-select |
| checkbox | Boolean | Checkbox |
| boolean | True/false | Toggle |
| image | Single image | Image picker |
| gallery | Multiple images | Gallery manager |
| file | File upload | File picker |
| video | Video | Video picker |
| date | Date | Date picker |
| datetime | Date & time | DateTime picker |
| color | Color value | Color picker |
| map | Location | Map picker |
| repeater | Repeatable items | Repeater UI |
| relation | Content relation | Relation picker |

## Next Steps

- [Schema Structure](/concepts/schema/) - Understand the generated schema
- [Creating Pages](/guides/creating-pages/) - Build your first page
