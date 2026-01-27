---
title: Form Builder
description: Create and manage forms with Reverso CMS
---

# Form Builder

Reverso includes a powerful form builder for creating contact forms, surveys, and more.

## Creating Forms

Forms are created and managed in the admin panel at `/forms`.

### Form Settings

- **Name**: Internal identifier
- **Slug**: URL-friendly identifier for submissions
- **Status**: Draft, Published, or Archived
- **Multi-step**: Enable wizard-style forms

### Notification Settings

- **Email notifications**: Send emails on submission
- **Webhook**: POST data to external URL

### Spam Protection

- **Honeypot**: Hidden field to catch bots
- **Rate limiting**: Limit submissions per minute

## Form Fields

Add fields using the visual builder:

| Field Type | Description |
|------------|-------------|
| Text | Single line text |
| Email | Email with validation |
| Textarea | Multi-line text |
| Number | Numeric input |
| Select | Dropdown selection |
| Checkbox | Single checkbox |
| Radio | Radio button group |
| Date | Date picker |
| File | File upload |
| Hidden | Hidden field |

### Field Properties

Each field can be configured with:

- **Label**: Display label
- **Name**: Field identifier
- **Placeholder**: Placeholder text
- **Help text**: Description for users
- **Required**: Mark as required
- **Validation**: Custom validation rules
- **Width**: Grid width (1-12)
- **Conditional logic**: Show/hide based on other fields

## Using Forms in Frontend

### With @reverso/forms Package

```tsx
import { Form } from '@reverso/forms';

export function ContactPage() {
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

### Custom Implementation

```tsx
async function handleSubmit(data: FormData) {
  const response = await fetch('/api/reverso/public/forms/contact/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: Object.fromEntries(data) }),
  });

  if (!response.ok) {
    throw new Error('Submission failed');
  }

  return response.json();
}
```

## Multi-Step Forms

Create wizard-style forms:

1. Enable "Multi-step" in form settings
2. Define steps with names and descriptions
3. Assign fields to steps

```tsx
import { Form } from '@reverso/forms';

<Form
  slug="registration"
  // Progress indicator
  showProgress={true}
  // Navigation buttons
  prevLabel="Back"
  nextLabel="Continue"
  submitLabel="Complete Registration"
/>
```

## Conditional Logic

Show/hide fields based on other field values:

In the admin:
1. Select a field
2. Add condition: "Show this field when..."
3. Choose field, operator, and value

Example: Show "Company" field only when "Business" is selected.

## Handling Submissions

### View in Admin

Submissions appear in the admin at `/forms/:id/submissions`.

Features:
- View submission data
- Mark as read/spam/archived
- Export to CSV
- Search and filter

### Webhook Integration

Configure webhooks to send data to external services:

```json
{
  "formId": "form_123",
  "formSlug": "contact",
  "submissionId": "sub_456",
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "message": "Hello!"
  },
  "submittedAt": "2025-01-15T10:30:00Z"
}
```

### Email Notifications

Configure email notifications:

- Recipient emails (comma-separated)
- Subject template
- Include all form data

## Validation

### Built-in Validation

- **Required**: Field must have a value
- **Email**: Valid email format
- **Min/Max**: Length constraints
- **Pattern**: Regex pattern

### Custom Validation

Add custom Zod schemas in field config:

```json
{
  "validation": "z.string().min(10).max(500)"
}
```

## Spam Protection

### Honeypot Field

A hidden field that bots typically fill:

```tsx
<Form slug="contact" honeypot={true} />
```

If the hidden field has a value, submission is rejected.

### Rate Limiting

Limit submissions per IP:

```json
{
  "rateLimitPerMinute": 5
}
```

## API Endpoints

### Public Submit (No Auth)

```bash
POST /api/reverso/public/forms/:slug/submit

{
  "data": {
    "name": "John",
    "email": "john@example.com"
  }
}
```

### List Submissions (Auth Required)

```bash
GET /api/reverso/forms/:id/submissions
```

### Export Submissions

```bash
POST /api/reverso/forms/:id/submissions/export
```

Returns CSV file.

## Best Practices

### 1. Keep Forms Simple

Ask only for essential information.

### 2. Use Clear Labels

```
❌ "Name"
✅ "Your Full Name"
```

### 3. Provide Help Text

Guide users on what's expected:

```
Email: "We'll never share your email"
Phone: "Include country code"
```

### 4. Confirm Success

Always show a clear success message after submission.

### 5. Test Thoroughly

- Test all validation
- Test conditional logic
- Test on mobile devices
- Test webhook integration

## Next Steps

- [SEO & Redirects](/guides/seo/) - Manage SEO and redirects
- [Internationalization](/guides/i18n/) - Multi-language support
