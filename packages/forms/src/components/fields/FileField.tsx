/**
 * File upload field component.
 */

import type { FormFieldProps } from '../../types';

export function FileField({ field, value, onChange, error, disabled }: FormFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      if (field.config?.multiple) {
        onChange(Array.from(files));
      } else {
        onChange(files[0]);
      }
    } else {
      onChange(undefined);
    }
  };

  return (
    <div className="reverso-field reverso-file-field">
      {field.label && (
        <label className="reverso-field-label" htmlFor={field.id}>
          {field.label}
          {field.required && <span className="reverso-field-required">*</span>}
        </label>
      )}
      <input
        type="file"
        id={field.id}
        name={field.name}
        onChange={handleChange}
        disabled={disabled}
        className={`reverso-field-input reverso-field-file ${error ? 'reverso-field-error' : ''}`}
        accept={field.config?.accept}
        multiple={field.config?.multiple}
      />
      {field.help && <p className="reverso-field-help">{field.help}</p>}
      {error && <p className="reverso-field-error-message">{error}</p>}
    </div>
  );
}
