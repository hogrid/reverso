---
title: "@reverso/admin"
description: React admin panel for Reverso CMS
---

# @reverso/admin

The admin package provides a React-based administration interface for managing content, media, forms, and redirects.

## Overview

The admin panel is automatically served by the Reverso API at `/admin`. It includes:

- **Page Editor** - Edit content for each page
- **Media Library** - Upload and manage files
- **Form Builder** - Create and manage forms
- **Submissions** - View form submissions
- **Redirects** - Manage URL redirects
- **Settings** - Configure the CMS

## Accessing the Admin

```bash
# Start the server
reverso dev

# Access admin at
http://localhost:4000/admin
```

## Features

### Page Editor

Edit content for pages detected by the scanner:

- **Field-by-field editing** with appropriate inputs
- **Live preview** of content changes
- **Locale selector** for i18n content
- **Publish/unpublish** workflow
- **Version history** (coming soon)

### Field Types

The admin renders appropriate editors for each field type:

| Field Type | Editor Component |
|------------|------------------|
| `text` | Single-line input |
| `textarea` | Multi-line textarea |
| `wysiwyg` | Rich text editor (Tiptap) |
| `markdown` | Markdown editor with preview |
| `blocks` | Block editor |
| `number` | Number input with validation |
| `boolean` | Toggle switch |
| `select` | Dropdown select |
| `checkbox` | Checkbox group |
| `radio` | Radio button group |
| `date` | Date picker |
| `datetime` | Date + time picker |
| `color` | Color picker |
| `image` | Image picker with preview |
| `gallery` | Multi-image gallery |
| `file` | File upload |
| `video` | Video picker |
| `map` | Map coordinate picker |
| `link` | URL input with validation |
| `relation` | Related content selector |

### Media Library

Full-featured media management:

- **Grid/List views**
- **Drag-and-drop upload**
- **Image preview** with dimensions
- **Search and filter** by type
- **Bulk selection** and delete
- **Edit metadata** (alt text, caption)

### Form Builder

Visual form creation:

- **Drag-and-drop** field ordering
- **Field type palette**
- **Property editor** for each field
- **Conditional logic** configuration
- **Multi-step forms** support
- **Live preview**

### Submissions

View and manage form submissions:

- **Searchable table**
- **Status management** (new, read, spam, archived)
- **Export to CSV**
- **Individual submission detail**

### Redirects

URL redirect management:

- **Create/edit redirects**
- **Status codes** (301, 302, 307, 308)
- **Enable/disable** toggle
- **Hit tracking** statistics
- **Bulk import** from CSV

## UI Components

Built with shadcn/ui and Tailwind CSS:

```tsx
// Example: Using admin components
import { Button } from '@reverso/admin/components/ui/button';
import { Input } from '@reverso/admin/components/ui/input';
import { Card } from '@reverso/admin/components/ui/card';
```

## Customization

### Theme

The admin uses CSS variables for theming:

```css
:root {
  --primary: 220 90% 56%;
  --primary-foreground: 0 0% 100%;
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
  /* ... */
}

.dark {
  --background: 222 47% 11%;
  --foreground: 0 0% 100%;
  /* ... */
}
```

### Branding

Configure branding in `reverso.config.ts`:

```typescript
export default {
  admin: {
    // Logo shown in sidebar
    logo: '/logo.svg',

    // Primary color
    primaryColor: '#3b82f6',

    // Custom title
    title: 'My CMS',

    // Disable dark mode toggle
    darkMode: false,
  },
};
```

## Authentication

The admin integrates with Better Auth:

```typescript
// Login
POST /api/reverso/auth/login
{ email, password }

// Session check
GET /api/reverso/auth/me

// Logout
POST /api/reverso/auth/logout
```

### Protected Routes

All admin routes require authentication:

```tsx
// Automatic redirect to login if not authenticated
<Route path="/admin/*" element={<ProtectedRoute />} />
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + S` | Save changes |
| `Ctrl/Cmd + P` | Publish content |
| `Ctrl/Cmd + K` | Open command palette |
| `Escape` | Close modal/sidebar |

## State Management

Uses React Query for server state:

```typescript
// Example hook usage
import { useQuery, useMutation } from '@tanstack/react-query';

// Fetch content
const { data: content } = useQuery({
  queryKey: ['content', path],
  queryFn: () => api.getContent(path),
});

// Update content
const updateMutation = useMutation({
  mutationFn: (data) => api.updateContent(path, data),
  onSuccess: () => queryClient.invalidateQueries(['content']),
});
```

## API Integration

The admin communicates with the API:

```typescript
// API client
import { api } from '@reverso/admin/api';

// Content operations
await api.content.get(path, locale);
await api.content.update(path, { value, locale });
await api.content.publish(id);

// Media operations
await api.media.list({ type: 'image', limit: 20 });
await api.media.upload(file);
await api.media.delete(id);

// Form operations
await api.forms.list();
await api.forms.create(data);
await api.forms.getSubmissions(formId);
```

## Responsive Design

The admin is fully responsive:

- **Desktop**: Full sidebar + content area
- **Tablet**: Collapsible sidebar
- **Mobile**: Bottom navigation + full-screen panels

## Accessibility

Built with accessibility in mind:

- Proper ARIA labels
- Keyboard navigation
- Focus management
- Screen reader support
- Color contrast compliance

## Development

### Running Standalone

```bash
cd packages/admin
pnpm dev
```

### Building

```bash
cd packages/admin
pnpm build
```

The built admin is embedded in `@reverso/api`.

## Next Steps

- [@reverso/blocks](/packages/blocks/) - Block editor
- [@reverso/forms](/packages/forms/) - Form components
