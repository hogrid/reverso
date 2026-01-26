/**
 * Form types for @reverso/forms
 */

/**
 * Form field type.
 */
export type FormFieldType =
  | 'text'
  | 'email'
  | 'textarea'
  | 'number'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'date'
  | 'file'
  | 'hidden';

/**
 * Form field condition.
 */
export interface FieldCondition {
  field: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'isEmpty' | 'isNotEmpty';
  value?: string | number | boolean;
}

/**
 * Select/radio option.
 */
export interface FieldOption {
  label: string;
  value: string;
}

/**
 * Form field configuration.
 */
export interface FormFieldConfig {
  id: string;
  name: string;
  type: FormFieldType;
  label?: string;
  placeholder?: string;
  help?: string;
  required?: boolean;
  validation?: string;
  config?: {
    options?: FieldOption[];
    accept?: string;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    rows?: number;
    multiple?: boolean;
  };
  width?: number;
  step?: number;
  sortOrder?: number;
  condition?: FieldCondition;
}

/**
 * Form step configuration.
 */
export interface FormStepConfig {
  id: string;
  name: string;
  description?: string;
}

/**
 * Form settings.
 */
export interface FormSettings {
  submitButtonText?: string;
  successMessage?: string;
  redirectUrl?: string;
}

/**
 * Form configuration.
 */
export interface FormConfig {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isMultiStep?: boolean;
  steps?: FormStepConfig[];
  fields: FormFieldConfig[];
  settings?: FormSettings;
  honeypotEnabled?: boolean;
}

/**
 * Form submission data.
 */
export interface FormSubmissionData {
  [key: string]: unknown;
}

/**
 * Form submit result.
 */
export interface FormSubmitResult {
  success: boolean;
  message?: string;
  redirectUrl?: string;
  errors?: Record<string, string>;
}

/**
 * Form state.
 */
export interface FormState {
  currentStep: number;
  isSubmitting: boolean;
  isSubmitted: boolean;
  submitError?: string;
}

/**
 * Form field props.
 */
export interface FormFieldProps {
  field: FormFieldConfig;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  disabled?: boolean;
}
