/**
 * Checkbox field component.
 */

import type { FormFieldProps } from '../../types';

export function CheckboxField({ field, value, onChange, error, disabled }: FormFieldProps) {
  return (
    <div className="reverso-field reverso-checkbox-field">
      <div className="reverso-checkbox-wrapper">
        <input
          type="checkbox"
          id={field.id}
          name={field.name}
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className={`reverso-field-checkbox ${error ? 'reverso-field-error' : ''}`}
        />
        {field.label && (
          <label className="reverso-checkbox-label" htmlFor={field.id}>
            {field.label}
            {field.required && <span className="reverso-field-required">*</span>}
          </label>
        )}
      </div>
      {field.help && <p className="reverso-field-help">{field.help}</p>}
      {error && <p className="reverso-field-error-message">{error}</p>}
    </div>
  );
}
