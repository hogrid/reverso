/**
 * @reverso/forms
 *
 * Form builder system for Reverso CMS.
 * Create and manage forms with validation, multi-step support, and integrations.
 *
 * @example
 * ```tsx
 * import { Form, useReversoForm } from '@reverso/forms';
 *
 * function ContactForm() {
 *   return (
 *     <Form
 *       config={formConfig}
 *       onSubmit={async (data) => {
 *         const response = await fetch('/api/forms/submit', {
 *           method: 'POST',
 *           body: JSON.stringify(data),
 *         });
 *         const result = await response.json();
 *         return {
 *           success: result.success,
 *           message: result.message,
 *         };
 *       }}
 *     />
 *   );
 * }
 * ```
 */

export const VERSION = '0.0.0';

// Types
export type {
  FieldCondition,
  FieldOption,
  FormConfig,
  FormFieldConfig,
  FormFieldProps,
  FormFieldType,
  FormSettings,
  FormState,
  FormStepConfig,
  FormSubmissionData,
  FormSubmitResult,
} from './types';

// Components
export { Form } from './components/Form';
export type { FormProps } from './components/Form';

export { FormField } from './components/FormField';
export { FormProgress } from './components/FormProgress';
export type { FormProgressProps } from './components/FormProgress';

export { FormStep } from './components/FormStep';
export type { FormStepProps } from './components/FormStep';

// Field components (for custom form building)
export {
  CheckboxField,
  DateField,
  EmailField,
  FileField,
  HiddenField,
  NumberField,
  RadioField,
  SelectField,
  TextareaField,
  TextField,
} from './components/fields';

// Hooks
export { useReversoForm } from './hooks/useReversoForm';
export type { UseReversoFormOptions, UseReversoFormReturn } from './hooks/useReversoForm';

export { useConditionalFields } from './hooks/useConditionalFields';

// Validation
export { buildFormSchema, validateFormData } from './validation/buildSchema';
