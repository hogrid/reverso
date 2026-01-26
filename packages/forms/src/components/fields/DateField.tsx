/**
 * Date field component.
 */

import type { FormFieldProps } from '../../types';

export function DateField({ field, value, onChange, error, disabled }: FormFieldProps) {
  return (
    <div className="reverso-field reverso-date-field">
      {field.label && (
        <label className="reverso-field-label" htmlFor={field.id}>
          {field.label}
          {field.required && <span className="reverso-field-required">*</span>}
        </label>
      )}
      <input
        type="date"
        id={field.id}
        name={field.name}
        value={(value as string) || ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        disabled={disabled}
        className={`reverso-field-input ${error ? 'reverso-field-error' : ''}`}
      />
      {field.help && <p className="reverso-field-help">{field.help}</p>}
      {error && <p className="reverso-field-error-message">{error}</p>}
    </div>
  );
}
