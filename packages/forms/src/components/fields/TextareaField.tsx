/**
 * Textarea field component.
 */

import type { FormFieldProps } from '../../types';

export function TextareaField({ field, value, onChange, error, disabled }: FormFieldProps) {
  return (
    <div className="reverso-field reverso-textarea-field">
      {field.label && (
        <label className="reverso-field-label" htmlFor={field.id}>
          {field.label}
          {field.required && <span className="reverso-field-required">*</span>}
        </label>
      )}
      <textarea
        id={field.id}
        name={field.name}
        value={(value as string) || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        disabled={disabled}
        className={`reverso-field-input reverso-field-textarea ${error ? 'reverso-field-error' : ''}`}
        rows={field.config?.rows || 4}
        minLength={field.config?.minLength}
        maxLength={field.config?.maxLength}
      />
      {field.help && <p className="reverso-field-help">{field.help}</p>}
      {error && <p className="reverso-field-error-message">{error}</p>}
    </div>
  );
}
