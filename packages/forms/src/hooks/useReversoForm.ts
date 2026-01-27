/**
 * Main form hook for @reverso/forms.
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import type {
  FormConfig,
  FormFieldConfig,
  FormState,
  FormSubmissionData,
  FormSubmitResult,
} from '../types';
import { buildFormSchema } from '../validation/buildSchema';
import { useConditionalFields } from './useConditionalFields';

export interface UseReversoFormOptions {
  config: FormConfig;
  onSubmit?: (data: FormSubmissionData) => Promise<FormSubmitResult>;
  defaultValues?: FormSubmissionData;
}

export interface UseReversoFormReturn {
  // Form state
  form: ReturnType<typeof useForm>;
  state: FormState;

  // Multi-step
  currentStep: number;
  totalSteps: number;
  canGoNext: boolean;
  canGoPrev: boolean;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;

  // Fields
  visibleFields: FormFieldConfig[];
  currentStepFields: FormFieldConfig[];
  isFieldVisible: (fieldName: string) => boolean;

  // Actions
  handleSubmit: () => void;
  reset: () => void;

  // Config access
  config: FormConfig;
}

/**
 * Main hook for using Reverso forms.
 */
export function useReversoForm({
  config,
  onSubmit,
  defaultValues = {},
}: UseReversoFormOptions): UseReversoFormReturn {
  const [state, setState] = useState<FormState>({
    currentStep: 1,
    isSubmitting: false,
    isSubmitted: false,
  });

  // Build validation schema
  const schema = useMemo(() => buildFormSchema(config.fields), [config.fields]);

  // Initialize react-hook-form
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onBlur',
  });

  const formData = form.watch();

  // Conditional fields
  const { visibleFields, isFieldVisible } = useConditionalFields(config.fields, formData);

  // Multi-step logic
  const totalSteps = config.isMultiStep && config.steps ? config.steps.length : 1;

  const currentStepFields = useMemo(() => {
    if (!config.isMultiStep) {
      return visibleFields;
    }
    return visibleFields.filter((field) => field.step === state.currentStep);
  }, [config.isMultiStep, visibleFields, state.currentStep]);

  const canGoNext = state.currentStep < totalSteps;
  const canGoPrev = state.currentStep > 1;

  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    const fieldNames = currentStepFields.map((f) => f.name);
    const result = await form.trigger(fieldNames);
    return result;
  }, [form, currentStepFields]);

  const nextStep = useCallback(async () => {
    if (!canGoNext) return;

    const isValid = await validateCurrentStep();
    if (isValid) {
      setState((prev) => ({ ...prev, currentStep: prev.currentStep + 1 }));
    }
  }, [canGoNext, validateCurrentStep]);

  const prevStep = useCallback(() => {
    if (!canGoPrev) return;
    setState((prev) => ({ ...prev, currentStep: prev.currentStep - 1 }));
  }, [canGoPrev]);

  const goToStep = useCallback(
    (step: number) => {
      if (step >= 1 && step <= totalSteps) {
        setState((prev) => ({ ...prev, currentStep: step }));
      }
    },
    [totalSteps]
  );

  // Submit handler
  const handleSubmit = useCallback(() => {
    form.handleSubmit(async (data) => {
      setState((prev) => ({ ...prev, isSubmitting: true, submitError: undefined }));

      try {
        if (onSubmit) {
          const result = await onSubmit(data);

          if (result.success) {
            setState((prev) => ({ ...prev, isSubmitting: false, isSubmitted: true }));

            if (result.redirectUrl) {
              // Validate redirect URL to prevent open redirect attacks
              const isSafeRedirect = (url: string): boolean => {
                // Allow relative paths
                if (url.startsWith('/') && !url.startsWith('//')) {
                  return true;
                }
                // Allow same-origin URLs
                try {
                  const parsed = new URL(url, window.location.origin);
                  return parsed.origin === window.location.origin;
                } catch {
                  return false;
                }
              };

              if (isSafeRedirect(result.redirectUrl)) {
                window.location.href = result.redirectUrl;
              } else {
                console.warn('Blocked unsafe redirect URL:', result.redirectUrl);
              }
            }
          } else {
            setState((prev) => ({
              ...prev,
              isSubmitting: false,
              submitError: result.message || 'Submission failed',
            }));

            // Set field errors if provided
            if (result.errors) {
              for (const [field, message] of Object.entries(result.errors)) {
                form.setError(field, { message });
              }
            }
          }
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isSubmitting: false,
          submitError: error instanceof Error ? error.message : 'An error occurred',
        }));
      }
    })();
  }, [form, onSubmit]);

  const reset = useCallback(() => {
    form.reset(defaultValues);
    setState({
      currentStep: 1,
      isSubmitting: false,
      isSubmitted: false,
    });
  }, [form, defaultValues]);

  return {
    form,
    state,
    currentStep: state.currentStep,
    totalSteps,
    canGoNext,
    canGoPrev,
    nextStep,
    prevStep,
    goToStep,
    visibleFields,
    currentStepFields,
    isFieldVisible,
    handleSubmit,
    reset,
    config,
  };
}
