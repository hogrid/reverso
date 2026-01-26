/**
 * FormField component - dispatches to appropriate field type.
 */

import type { FormFieldConfig, FormFieldProps } from '../types';
import {
  CheckboxField,
  DateField,
  EmailField,
  FileField,
  HiddenField,
  NumberField,
  RadioField,
  SelectField,
  TextField,
  TextareaField,
} from './fields';

/**
 * Render a form field based on its type.
 */
export function FormField(props: FormFieldProps) {
  const { field } = props;

  switch (field.type) {
    case 'text':
      return <TextField {...props} />;

    case 'email':
      return <EmailField {...props} />;

    case 'textarea':
      return <TextareaField {...props} />;

    case 'number':
      return <NumberField {...props} />;

    case 'select':
      return <SelectField {...props} />;

    case 'checkbox':
      return <CheckboxField {...props} />;

    case 'radio':
      return <RadioField {...props} />;

    case 'date':
      return <DateField {...props} />;

    case 'file':
      return <FileField {...props} />;

    case 'hidden':
      return <HiddenField {...props} />;

    default:
      // Default to text field for unknown types
      return <TextField {...props} />;
  }
}
