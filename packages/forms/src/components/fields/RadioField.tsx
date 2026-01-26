/**
 * Radio field component.
 */

import type { FormFieldProps } from '../../types';

export function RadioField({ field, value, onChange, error, disabled }: FormFieldProps) {
  const options = field.config?.options || [];

  return (
    <fieldset className="reverso-field reverso-radio-field">
      {field.label && (
        <legend className="reverso-field-label">
          {field.label}
          {field.required && <span className="reverso-field-required">*</span>}
        </legend>
      )}
      <div className="reverso-radio-group">
        {options.map((option) => (
          <div key={option.value} className="reverso-radio-option">
            <input
              type="radio"
              id={`${field.id}-${option.value}`}
              name={field.name}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              className="reverso-field-radio"
            />
            <label className="reverso-radio-label" htmlFor={`${field.id}-${option.value}`}>
              {option.label}
            </label>
          </div>
        ))}
      </div>
      {field.help && <p className="reverso-field-help">{field.help}</p>}
      {error && <p className="reverso-field-error-message">{error}</p>}
    </fieldset>
  );
}
