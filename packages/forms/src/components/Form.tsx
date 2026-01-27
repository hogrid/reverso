/**
 * Form component - main form rendering component.
 */

import { Controller } from 'react-hook-form';
import { useReversoForm } from '../hooks/useReversoForm';
import type { FormConfig, FormFieldConfig, FormSubmissionData, FormSubmitResult } from '../types';
import { FormField } from './FormField';
import { FormProgress } from './FormProgress';
import { FormStep } from './FormStep';

export interface FormProps {
  config: FormConfig;
  onSubmit?: (data: FormSubmissionData) => Promise<FormSubmitResult>;
  defaultValues?: FormSubmissionData;
  className?: string;
  children?: React.ReactNode;
}

export function Form({ config, onSubmit, defaultValues, className, children }: FormProps) {
  const {
    form,
    state,
    currentStep,
    totalSteps,
    canGoNext,
    canGoPrev,
    nextStep,
    prevStep,
    goToStep,
    currentStepFields,
    handleSubmit,
  } = useReversoForm({
    config,
    onSubmit,
    defaultValues,
  });

  // Show success state
  if (state.isSubmitted) {
    return (
      <div className={`reverso-form reverso-form-success ${className || ''}`}>
        <div className="reverso-form-success-message">
          <p>{config.settings?.successMessage || 'Thank you for your submission!'}</p>
        </div>
      </div>
    );
  }

  // Calculate column width based on field width (1-12 grid)
  const getFieldWidth = (width?: number) => {
    const cols = width || 12;
    return `${(cols / 12) * 100}%`;
  };

  return (
    <form
      className={`reverso-form ${className || ''}`}
      onSubmit={(e) => {
        e.preventDefault();
        if (config.isMultiStep && canGoNext) {
          nextStep();
        } else {
          handleSubmit();
        }
      }}
      noValidate
    >
      {/* Honeypot field (hidden, only bots will fill this) */}
      {config.honeypotEnabled && (
        <div style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true">
          <input type="text" tabIndex={-1} autoComplete="off" {...form.register('_honeypot')} />
        </div>
      )}

      {/* Multi-step progress */}
      {config.isMultiStep && config.steps && config.steps.length > 1 && (
        <FormProgress steps={config.steps} currentStep={currentStep} onStepClick={goToStep} />
      )}

      {/* Form fields */}
      <div className="reverso-form-fields">
        {config.isMultiStep && config.steps ? (
          config.steps.map((step, index) => (
            <FormStep key={step.id} step={step} isActive={index + 1 === currentStep}>
              <div className="reverso-form-fields-grid">
                {currentStepFields.map((field: FormFieldConfig) => (
                  <div
                    key={field.id}
                    className="reverso-form-field-wrapper"
                    style={{ width: getFieldWidth(field.width) }}
                  >
                    <Controller
                      name={field.name}
                      control={form.control}
                      render={({ field: formField, fieldState }) => (
                        <FormField
                          field={field}
                          value={formField.value}
                          onChange={formField.onChange}
                          error={fieldState.error?.message}
                          disabled={state.isSubmitting}
                        />
                      )}
                    />
                  </div>
                ))}
              </div>
            </FormStep>
          ))
        ) : (
          <div className="reverso-form-fields-grid">
            {currentStepFields.map((field: FormFieldConfig) => (
              <div
                key={field.id}
                className="reverso-form-field-wrapper"
                style={{ width: getFieldWidth(field.width) }}
              >
                <Controller
                  name={field.name}
                  control={form.control}
                  render={({ field: formField, fieldState }) => (
                    <FormField
                      field={field}
                      value={formField.value}
                      onChange={formField.onChange}
                      error={fieldState.error?.message}
                      disabled={state.isSubmitting}
                    />
                  )}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error message */}
      {state.submitError && (
        <div className="reverso-form-error" role="alert">
          <p>{state.submitError}</p>
        </div>
      )}

      {/* Custom children */}
      {children}

      {/* Form actions */}
      <div className="reverso-form-actions">
        {config.isMultiStep && canGoPrev && (
          <button
            type="button"
            className="reverso-form-button reverso-form-button-prev"
            onClick={prevStep}
            disabled={state.isSubmitting}
          >
            Previous
          </button>
        )}
        <button
          type="submit"
          className="reverso-form-button reverso-form-button-submit"
          disabled={state.isSubmitting}
        >
          {state.isSubmitting
            ? 'Submitting...'
            : config.isMultiStep && canGoNext
              ? 'Next'
              : config.settings?.submitButtonText || 'Submit'}
        </button>
      </div>
    </form>
  );
}
