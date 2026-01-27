# @reverso/blocks

Block editor component for Reverso CMS built with Tiptap.

## Installation

```bash
npm install @reverso/blocks
```

## Usage

```tsx
import { BlockEditor } from '@reverso/blocks';

function MyEditor() {
  const [content, setContent] = useState('');

  return (
    <BlockEditor
      value={content}
      onChange={setContent}
      placeholder="Start writing..."
    />
  );
}
```

## Features

- **Rich Text**: Bold, italic, underline, strikethrough, code, highlight
- **Headings**: H1, H2, H3 with toolbar
- **Lists**: Bullet and ordered lists
- **Blocks**: Blockquote, code blocks with syntax highlighting
- **Tables**: Full table support with headers
- **Media**: Image insertion and alignment
- **Links**: Link creation and editing

## Peer Dependencies

- React 18+
- React DOM 18+

## Documentation

See [https://reverso.dev/docs/packages/blocks](https://reverso.dev/docs/packages/blocks)

## License

MIT
