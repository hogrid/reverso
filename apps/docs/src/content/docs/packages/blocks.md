---
title: "@reverso/blocks"
description: Tiptap-based block editor for Reverso CMS
---

# @reverso/blocks

The blocks package provides a rich block editor based on Tiptap, used for `wysiwyg` and `blocks` field types.

## Installation

```bash
npm install @reverso/blocks
```

## Usage

### Basic Editor

```tsx
import { BlockEditor } from '@reverso/blocks';

function MyEditor() {
  const [content, setContent] = useState('<p>Hello world</p>');

  return (
    <BlockEditor
      value={content}
      onChange={setContent}
      placeholder="Start typing..."
    />
  );
}
```

### With Toolbar

```tsx
import { BlockEditor, EditorToolbar } from '@reverso/blocks';

function MyEditor() {
  const [content, setContent] = useState('');

  return (
    <div className="editor-container">
      <BlockEditor
        value={content}
        onChange={setContent}
        toolbar={<EditorToolbar />}
      />
    </div>
  );
}
```

## Props

### BlockEditor Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | `''` | HTML content |
| `onChange` | `(html: string) => void` | - | Change handler |
| `placeholder` | `string` | - | Placeholder text |
| `toolbar` | `ReactNode` | - | Custom toolbar |
| `editable` | `boolean` | `true` | Enable editing |
| `extensions` | `Extension[]` | - | Additional Tiptap extensions |
| `className` | `string` | - | Container class |
| `minHeight` | `string` | `'200px'` | Minimum height |

## Extensions

### Included Extensions

The editor includes these Tiptap extensions:

| Extension | Description |
|-----------|-------------|
| **StarterKit** | Basic formatting (bold, italic, lists, etc.) |
| **Heading** | H1-H6 headings |
| **Link** | Hyperlinks |
| **Image** | Image blocks |
| **Table** | Table support |
| **CodeBlock** | Code blocks with syntax highlighting |
| **Placeholder** | Placeholder text |
| **Typography** | Smart typography |
| **TextAlign** | Text alignment |

### Custom Extensions

Add your own Tiptap extensions:

```tsx
import { BlockEditor } from '@reverso/blocks';
import { Extension } from '@tiptap/core';

const CustomExtension = Extension.create({
  name: 'customExtension',
  // ... extension config
});

<BlockEditor
  value={content}
  onChange={setContent}
  extensions={[CustomExtension]}
/>
```

## Toolbar

### Default Toolbar

```tsx
import { EditorToolbar } from '@reverso/blocks';

<BlockEditor
  toolbar={<EditorToolbar />}
  // ...
/>
```

Includes buttons for:
- Bold, Italic, Underline, Strike
- Headings (H1, H2, H3)
- Lists (bullet, ordered)
- Links
- Images
- Code blocks
- Tables
- Text alignment
- Clear formatting

### Custom Toolbar

```tsx
import { EditorToolbar, ToolbarButton } from '@reverso/blocks';

<BlockEditor
  toolbar={
    <EditorToolbar>
      <ToolbarButton command="toggleBold" icon={<BoldIcon />} />
      <ToolbarButton command="toggleItalic" icon={<ItalicIcon />} />
      <ToolbarSeparator />
      <ToolbarButton command="toggleHeading" args={{ level: 2 }} icon={<H2Icon />} />
    </EditorToolbar>
  }
/>
```

## Media Integration

### Image Upload

```tsx
<BlockEditor
  value={content}
  onChange={setContent}
  onImageUpload={async (file) => {
    // Upload to your server
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/reverso/media', {
      method: 'POST',
      body: formData,
    });

    const { data } = await response.json();
    return data.url; // Return the uploaded image URL
  }}
/>
```

### Media Library Picker

```tsx
<BlockEditor
  onImageSelect={async () => {
    // Open media picker dialog
    const selected = await openMediaPicker({ type: 'image' });
    return selected.url;
  }}
/>
```

## Output Formats

### HTML (Default)

```tsx
const [html, setHtml] = useState('<p>Hello</p>');

<BlockEditor
  value={html}
  onChange={setHtml}
/>
```

### JSON (Tiptap Document)

```tsx
import { BlockEditor } from '@reverso/blocks';

<BlockEditor
  value={content}
  onChange={setContent}
  outputFormat="json"
/>

// Output: { type: 'doc', content: [...] }
```

### Markdown

```tsx
<BlockEditor
  value={content}
  onChange={setContent}
  outputFormat="markdown"
/>

// Output: "# Heading\n\nParagraph text..."
```

## Styling

### CSS Classes

```css
/* Editor container */
.reverso-editor {
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
}

/* Toolbar */
.reverso-toolbar {
  border-bottom: 1px solid #e2e8f0;
  padding: 0.5rem;
}

/* Content area */
.reverso-editor-content {
  padding: 1rem;
  min-height: 200px;
}

/* Placeholder */
.reverso-editor-content .is-empty::before {
  content: attr(data-placeholder);
  color: #94a3b8;
}
```

### Custom Theme

```tsx
<BlockEditor
  className="my-custom-editor"
  theme={{
    toolbar: 'bg-gray-50 border-b',
    content: 'prose prose-sm',
    placeholder: 'text-gray-400',
  }}
/>
```

## Read-Only Mode

Display content without editing:

```tsx
<BlockEditor
  value={content}
  editable={false}
  toolbar={null} // Hide toolbar
/>
```

## Collaborative Editing

Support for collaborative editing with Yjs:

```tsx
import { BlockEditor, withCollaboration } from '@reverso/blocks';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

const ydoc = new Y.Doc();
const provider = new WebsocketProvider('ws://localhost:1234', 'room', ydoc);

<BlockEditor
  collaboration={{
    document: ydoc,
    provider: provider,
    user: {
      name: 'User',
      color: '#f00',
    },
  }}
/>
```

## TypeScript

```typescript
import type {
  BlockEditorProps,
  EditorToolbarProps,
  OutputFormat,
} from '@reverso/blocks';
```

## Integration with Reverso

Used automatically for `wysiwyg` and `blocks` field types:

```tsx
// In your JSX
<div
  data-reverso="home.about.content"
  data-reverso-type="wysiwyg"
>
  <p>Default content here...</p>
</div>
```

The admin panel renders a `BlockEditor` for this field.

## Performance

- **Lazy loading**: Editor bundles are loaded on demand
- **Virtualization**: Large documents are virtualized
- **Debounced updates**: onChange is debounced by default

```tsx
<BlockEditor
  value={content}
  onChange={setContent}
  debounce={300} // ms
/>
```

## Next Steps

- [@reverso/admin](/packages/admin/) - Admin panel integration
- [Field Types](/concepts/field-types/) - All available field types
