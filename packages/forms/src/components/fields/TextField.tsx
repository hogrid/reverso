/**
 * Text field component.
 */

import type { FormFieldProps } from '../../types';

export function TextField({ field, value, onChange, error, disabled }: FormFieldProps) {
  return (
    <div className="reverso-field reverso-text-field">
      {field.label && (
        <label className="reverso-field-label" htmlFor={field.id}>
          {field.label}
          {field.required && <span className="reverso-field-required">*</span>}
        </label>
      )}
      <input
        type="text"
        id={field.id}
        name={field.name}
        value={(value as string) || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        disabled={disabled}
        className={`reverso-field-input ${error ? 'reverso-field-error' : ''}`}
        minLength={field.config?.minLength}
        maxLength={field.config?.maxLength}
        pattern={field.config?.pattern}
      />
      {field.help && <p className="reverso-field-help">{field.help}</p>}
      {error && <p className="reverso-field-error-message">{error}</p>}
    </div>
  );
}
