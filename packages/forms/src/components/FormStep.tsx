/**
 * FormStep component - wrapper for multi-step form content.
 */

import type { FormStepConfig } from '../types';

export interface FormStepProps {
  step: FormStepConfig;
  isActive: boolean;
  children: React.ReactNode;
}

export function FormStep({ step, isActive, children }: FormStepProps) {
  if (!isActive) {
    return null;
  }

  return (
    <fieldset className="reverso-form-step">
      <legend className="reverso-form-step-title">{step.name}</legend>
      {step.description && <p className="reverso-form-step-description">{step.description}</p>}
      <div className="reverso-form-step-content">{children}</div>
    </fieldset>
  );
}
