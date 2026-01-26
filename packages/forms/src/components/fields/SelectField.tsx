/**
 * Select field component.
 */

import type { FormFieldProps } from '../../types';

export function SelectField({ field, value, onChange, error, disabled }: FormFieldProps) {
  const options = field.config?.options || [];

  return (
    <div className="reverso-field reverso-select-field">
      {field.label && (
        <label className="reverso-field-label" htmlFor={field.id}>
          {field.label}
          {field.required && <span className="reverso-field-required">*</span>}
        </label>
      )}
      <select
        id={field.id}
        name={field.name}
        value={(value as string) || ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        disabled={disabled}
        className={`reverso-field-input reverso-field-select ${error ? 'reverso-field-error' : ''}`}
        multiple={field.config?.multiple}
      >
        {!field.required && <option value="">Select an option...</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {field.help && <p className="reverso-field-help">{field.help}</p>}
      {error && <p className="reverso-field-error-message">{error}</p>}
    </div>
  );
}
