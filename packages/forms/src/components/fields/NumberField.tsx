/**
 * Number field component.
 */

import type { FormFieldProps } from '../../types';

export function NumberField({ field, value, onChange, error, disabled }: FormFieldProps) {
  return (
    <div className="reverso-field reverso-number-field">
      {field.label && (
        <label className="reverso-field-label" htmlFor={field.id}>
          {field.label}
          {field.required && <span className="reverso-field-required">*</span>}
        </label>
      )}
      <input
        type="number"
        id={field.id}
        name={field.name}
        value={value !== undefined ? String(value) : ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
        placeholder={field.placeholder}
        disabled={disabled}
        className={`reverso-field-input ${error ? 'reverso-field-error' : ''}`}
        min={field.config?.min}
        max={field.config?.max}
      />
      {field.help && <p className="reverso-field-help">{field.help}</p>}
      {error && <p className="reverso-field-error-message">{error}</p>}
    </div>
  );
}
