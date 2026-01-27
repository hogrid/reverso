---
title: Media Management
description: Work with images, files, and media in Reverso CMS
---

# Media Management

Reverso includes a full-featured media library for managing images, files, videos, and other uploads.

## Media Library

Access the media library at `/media` in the admin panel. Features include:

- **Grid and list views**
- **Search by filename**
- **Filter by type** (images, videos, documents)
- **Drag-and-drop upload**
- **Bulk selection and delete**

## Image Fields

Add editable images to your content:

```tsx
<img
  data-reverso="home.hero.background"
  data-reverso-type="image"
  data-reverso-label="Hero Background"
  data-reverso-help="Recommended size: 1920x1080"
  src="/images/placeholder.jpg"
  alt="Hero background"
/>
```

### Image Field Options

```tsx
<img
  data-reverso="about.team.photo"
  data-reverso-type="image"
  data-reverso-label="Profile Photo"
  data-reverso-required="true"
  // The src is the default/fallback
  src="/images/default-avatar.jpg"
/>
```

## Gallery Fields

For multiple images:

```tsx
<div
  data-reverso="portfolio.project.images"
  data-reverso-type="gallery"
  data-reverso-label="Project Images"
  data-reverso-help="Upload up to 10 images"
  className="gallery-grid"
>
  {/* Gallery images rendered here */}
</div>
```

Gallery features:
- Upload multiple images at once
- Drag-and-drop reordering
- Individual image editing (alt text, caption)
- Bulk delete

## File Fields

For documents and other files:

```tsx
<a
  data-reverso="resources.document.file"
  data-reverso-type="file"
  data-reverso-label="Download File"
  href="/files/placeholder.pdf"
>
  Download PDF
</a>
```

## Video Fields

For video content:

```tsx
<video
  data-reverso="home.hero.video"
  data-reverso-type="video"
  data-reverso-label="Hero Video"
  controls
>
  <source src="/videos/placeholder.mp4" type="video/mp4" />
</video>
```

## Audio Fields

For audio files:

```tsx
<audio
  data-reverso="podcast.episode.audio"
  data-reverso-type="audio"
  data-reverso-label="Episode Audio"
  controls
>
  <source src="/audio/placeholder.mp3" type="audio/mpeg" />
</audio>
```

## oEmbed Fields

Embed content from YouTube, Vimeo, etc.:

```tsx
<div
  data-reverso="blog.post.video"
  data-reverso-type="oembed"
  data-reverso-label="Video Embed"
  data-reverso-help="Paste a YouTube or Vimeo URL"
>
  {/* Embed rendered here */}
</div>
```

## Upload Configuration

Configure uploads in `reverso.config.ts`:

```typescript
export default {
  media: {
    // Upload directory
    uploadDir: '.reverso/uploads',

    // Maximum file size (10MB)
    maxFileSize: 10 * 1024 * 1024,

    // Allowed MIME types
    allowedTypes: [
      'image/*',
      'video/*',
      'audio/*',
      'application/pdf',
      'application/zip',
    ],

    // Image processing (optional)
    images: {
      // Generate thumbnails
      thumbnails: [
        { width: 150, height: 150, fit: 'cover' },
        { width: 300, height: 300, fit: 'inside' },
      ],
      // Maximum dimensions
      maxWidth: 4096,
      maxHeight: 4096,
      // Quality (1-100)
      quality: 85,
    },
  },
} satisfies ReversoConfig;
```

## API Endpoints

### List Media

```bash
GET /api/reverso/media
```

Query parameters:
- `type`: Filter by type (image, video, audio, document)
- `limit`: Number of results
- `offset`: Pagination offset

### Upload Media

```bash
POST /api/reverso/media
Content-Type: multipart/form-data

file: [binary]
alt: "Image description"
```

### Get Media

```bash
GET /api/reverso/media/:id
```

### Update Media

```bash
PATCH /api/reverso/media/:id

{
  "alt": "Updated description",
  "filename": "new-name.jpg"
}
```

### Delete Media

```bash
DELETE /api/reverso/media/:id
```

## Accessing Media in Frontend

Media files are served from `/uploads/` by default:

```tsx
// In your frontend
const imageUrl = `${API_URL}/uploads/${media.filename}`;
```

## Best Practices

### 1. Always Add Alt Text

```tsx
<img
  data-reverso="about.team.photo"
  data-reverso-type="image"
  data-reverso-label="Team Photo"
  data-reverso-help="Add descriptive alt text for accessibility"
  alt="Team member portrait"
/>
```

### 2. Provide Size Guidance

```tsx
<img
  data-reverso="home.hero.background"
  data-reverso-type="image"
  data-reverso-help="Recommended: 1920x1080px, max 2MB"
/>
```

### 3. Use Appropriate Field Types

| Content | Field Type |
|---------|------------|
| Single image | `image` |
| Multiple images | `gallery` |
| PDF, DOC | `file` |
| Video file | `video` |
| YouTube/Vimeo | `oembed` |
| Audio file | `audio` |

### 4. Organize with Folders

Use descriptive filenames and organize uploads logically.

## Next Steps

- [Form Builder](/guides/forms/) - Create contact forms
- [SEO & Redirects](/guides/seo/) - Manage SEO and redirects
