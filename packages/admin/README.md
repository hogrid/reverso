# @reverso/admin

Admin panel UI for Reverso CMS built with React and shadcn/ui.

## Installation

```bash
npm install @reverso/admin
```

## Usage

The admin panel is typically served by `@reverso/api` and not used directly. However, you can embed it in your own application:

```typescript
import { App } from '@reverso/admin';

function MyApp() {
  return <App />;
}
```

## Features

- **Modern UI**: Built with shadcn/ui components
- **Field Editors**: 20+ field type renderers
- **Media Library**: Upload, browse, and manage files
- **Form Builder**: Visual form creation
- **Dark Mode**: System-aware theme switching
- **Autosave**: Automatic content saving
- **Undo/Redo**: Full history support

## Pages

- Dashboard with stats
- Pages list and editor
- Media library
- Form builder
- Redirect manager

## Documentation

See [https://reverso.dev/docs/packages/admin](https://reverso.dev/docs/packages/admin)

## License

MIT
