---
title: "@reverso/forms"
description: Form builder components for Reverso CMS
---

# @reverso/forms

The forms package provides React components for rendering and handling forms created in the Reverso admin.

## Installation

```bash
npm install @reverso/forms
```

## Usage

### Basic Form

```tsx
import { Form } from '@reverso/forms';

function ContactPage() {
  return (
    <Form
      slug="contact"
      onSuccess={() => {
        alert('Thank you for your message!');
      }}
      onError={(error) => {
        console.error('Submission failed:', error);
      }}
    />
  );
}
```

### With Custom Styling

```tsx
<Form
  slug="contact"
  className="my-form"
  fieldClassName="my-field"
  buttonClassName="my-submit-btn"
  submitLabel="Send Message"
/>
```

## Props

### Form Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `slug` | `string` | - | Form slug (required) |
| `apiUrl` | `string` | `/api/reverso` | API base URL |
| `onSuccess` | `() => void` | - | Success callback |
| `onError` | `(error: Error) => void` | - | Error callback |
| `className` | `string` | - | Form container class |
| `fieldClassName` | `string` | - | Field wrapper class |
| `inputClassName` | `string` | - | Input element class |
| `labelClassName` | `string` | - | Label class |
| `errorClassName` | `string` | - | Error message class |
| `buttonClassName` | `string` | - | Submit button class |
| `submitLabel` | `string` | `'Submit'` | Submit button text |
| `honeypot` | `boolean` | `true` | Enable honeypot spam protection |
| `showProgress` | `boolean` | `true` | Show multi-step progress |
| `prevLabel` | `string` | `'Back'` | Previous step button |
| `nextLabel` | `string` | `'Next'` | Next step button |

## Field Components

### Available Fields

| Component | Field Type | Description |
|-----------|------------|-------------|
| `TextField` | `text` | Single-line input |
| `EmailField` | `email` | Email with validation |
| `TextareaField` | `textarea` | Multi-line text |
| `NumberField` | `number` | Numeric input |
| `SelectField` | `select` | Dropdown |
| `CheckboxField` | `checkbox` | Single checkbox |
| `RadioField` | `radio` | Radio group |
| `DateField` | `date` | Date picker |
| `FileField` | `file` | File upload |
| `HiddenField` | `hidden` | Hidden field |

### Using Individual Fields

```tsx
import {
  TextField,
  EmailField,
  TextareaField,
  SubmitButton,
} from '@reverso/forms';

function CustomForm() {
  return (
    <form onSubmit={handleSubmit}>
      <TextField
        name="name"
        label="Your Name"
        required
      />
      <EmailField
        name="email"
        label="Email Address"
        required
      />
      <TextareaField
        name="message"
        label="Message"
        rows={5}
      />
      <SubmitButton>Send</SubmitButton>
    </form>
  );
}
```

## Multi-Step Forms

```tsx
<Form
  slug="registration"
  showProgress={true}
  prevLabel="Back"
  nextLabel="Continue"
  submitLabel="Complete Registration"
/>
```

The form automatically:
- Shows step indicator
- Validates each step before proceeding
- Preserves data between steps
- Shows navigation buttons

## Conditional Logic

Fields with conditions are automatically shown/hidden:

```tsx
// Configured in admin:
// Show "company" field when "type" is "business"

<Form slug="contact">
  {/* Company field appears only when type=business */}
</Form>
```

## Validation

### Built-in Validation

- **Required**: Field must have a value
- **Email**: Valid email format
- **Min/Max**: Character length limits
- **Pattern**: Custom regex

### Custom Validation

```tsx
import { Form, useReversoForm } from '@reverso/forms';

function CustomForm() {
  const form = useReversoForm('contact', {
    validate: (values) => {
      const errors = {};
      if (values.age && values.age < 18) {
        errors.age = 'Must be 18 or older';
      }
      return errors;
    },
  });

  return <Form form={form} />;
}
```

## Styling

### CSS Classes

```css
/* Form container */
.reverso-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Field wrapper */
.reverso-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

/* Labels */
.reverso-label {
  font-weight: 500;
}

/* Inputs */
.reverso-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
}

/* Error state */
.reverso-input-error {
  border-color: #ef4444;
}

/* Error message */
.reverso-error {
  color: #ef4444;
  font-size: 0.875rem;
}

/* Submit button */
.reverso-submit {
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border-radius: 0.375rem;
}

/* Progress indicator */
.reverso-progress {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.reverso-progress-step {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: #e2e8f0;
}

.reverso-progress-step.active {
  background: #3b82f6;
  color: white;
}
```

### Tailwind Integration

```tsx
<Form
  slug="contact"
  className="space-y-4"
  fieldClassName="flex flex-col gap-1"
  inputClassName="px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
  labelClassName="font-medium text-sm"
  errorClassName="text-red-500 text-sm"
  buttonClassName="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
/>
```

## Hooks

### useReversoForm

```tsx
import { useReversoForm } from '@reverso/forms';

function MyForm() {
  const {
    fields,        // Form fields configuration
    values,        // Current field values
    errors,        // Validation errors
    isSubmitting,  // Submission in progress
    currentStep,   // Current step (multi-step)
    totalSteps,    // Total steps
    setFieldValue, // Set a field's value
    validateField, // Validate a single field
    validateStep,  // Validate current step
    nextStep,      // Go to next step
    prevStep,      // Go to previous step
    submit,        // Submit the form
  } = useReversoForm('contact');

  return (
    <form onSubmit={submit}>
      {fields.map((field) => (
        <div key={field.name}>
          <label>{field.label}</label>
          <input
            type={field.type}
            value={values[field.name] || ''}
            onChange={(e) => setFieldValue(field.name, e.target.value)}
          />
          {errors[field.name] && (
            <span className="error">{errors[field.name]}</span>
          )}
        </div>
      ))}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Sending...' : 'Submit'}
      </button>
    </form>
  );
}
```

### useConditionalFields

```tsx
import { useConditionalFields } from '@reverso/forms';

const { visibleFields, isFieldVisible } = useConditionalFields(
  fields,
  values
);

// visibleFields - array of currently visible fields
// isFieldVisible(fieldName) - check if specific field is visible
```

## File Uploads

```tsx
<Form
  slug="application"
  onFileUpload={async (file) => {
    // Custom upload handler
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    return response.json(); // { url, filename }
  }}
/>
```

## Spam Protection

### Honeypot

Enabled by default - invisible field that bots typically fill:

```tsx
<Form slug="contact" honeypot={true} />
```

### Rate Limiting

Configured in admin - limits submissions per IP.

## TypeScript

```typescript
import type {
  FormProps,
  FormFieldConfig,
  FormValues,
  FormErrors,
  UseReversoFormReturn,
} from '@reverso/forms';
```

## Server-Side Rendering

The form fetches configuration client-side. For SSR:

```tsx
// pages/contact.tsx (Next.js)
export async function getServerSideProps() {
  const form = await fetch('/api/reverso/public/forms/contact');
  return { props: { formConfig: await form.json() } };
}

function ContactPage({ formConfig }) {
  return <Form config={formConfig} />;
}
```

## Next Steps

- [Form Builder Guide](/guides/forms/) - Creating forms in admin
- [@reverso/admin](/packages/admin/) - Admin panel
