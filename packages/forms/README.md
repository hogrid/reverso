# @reverso/forms

Form builder system for Reverso CMS.

## Installation

```bash
npm install @reverso/forms
```

## Usage

```tsx
import { Form, useReversoForm } from '@reverso/forms';

function ContactForm() {
  const { form, handleSubmit } = useReversoForm({
    fields: [
      { name: 'name', type: 'text', label: 'Name', required: true },
      { name: 'email', type: 'email', label: 'Email', required: true },
      { name: 'message', type: 'textarea', label: 'Message' },
    ],
  });

  return (
    <Form
      form={form}
      onSubmit={handleSubmit(async (data) => {
        await fetch('/api/contact', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      })}
    />
  );
}
```

## Features

- **10 Field Types**: Text, email, textarea, number, select, checkbox, radio, date, file, hidden
- **Multi-Step Forms**: Built-in step navigation
- **Conditional Fields**: Show/hide based on other field values
- **Validation**: Zod-based with custom rules
- **Honeypot**: Built-in spam protection

## Peer Dependencies

- React 18+
- React DOM 18+

## Documentation

See [https://reverso.dev/docs/packages/forms](https://reverso.dev/docs/packages/forms)

## License

MIT
