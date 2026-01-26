/**
 * FormProgress component - shows progress through multi-step forms.
 */

import type { FormStepConfig } from '../types';

export interface FormProgressProps {
  steps: FormStepConfig[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export function FormProgress({ steps, currentStep, onStepClick }: FormProgressProps) {
  return (
    <div className="reverso-form-progress">
      <div className="reverso-progress-steps">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;
          const isClickable = onStepClick && stepNumber < currentStep;

          return (
            <div
              key={step.id}
              className={`reverso-progress-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
            >
              <button
                type="button"
                className="reverso-progress-step-button"
                onClick={() => isClickable && onStepClick(stepNumber)}
                disabled={!isClickable}
                aria-current={isActive ? 'step' : undefined}
              >
                <span className="reverso-progress-step-number">
                  {isCompleted ? '✓' : stepNumber}
                </span>
                <span className="reverso-progress-step-name">{step.name}</span>
              </button>
              {index < steps.length - 1 && <div className="reverso-progress-connector" />}
            </div>
          );
        })}
      </div>
      <div className="reverso-progress-bar">
        <div
          className="reverso-progress-bar-fill"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />
      </div>
    </div>
  );
}
