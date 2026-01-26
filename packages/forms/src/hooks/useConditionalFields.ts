/**
 * Hook for handling conditional field visibility.
 */

import { useMemo } from 'react';
import type { FieldCondition, FormFieldConfig, FormSubmissionData } from '../types';

/**
 * Evaluate a single condition.
 */
function evaluateCondition(condition: FieldCondition, data: FormSubmissionData): boolean {
  const fieldValue = data[condition.field];

  switch (condition.operator) {
    case 'equals':
      return fieldValue === condition.value;

    case 'notEquals':
      return fieldValue !== condition.value;

    case 'contains':
      if (typeof fieldValue === 'string' && typeof condition.value === 'string') {
        return fieldValue.toLowerCase().includes(condition.value.toLowerCase());
      }
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(condition.value);
      }
      return false;

    case 'notContains':
      if (typeof fieldValue === 'string' && typeof condition.value === 'string') {
        return !fieldValue.toLowerCase().includes(condition.value.toLowerCase());
      }
      if (Array.isArray(fieldValue)) {
        return !fieldValue.includes(condition.value);
      }
      return true;

    case 'isEmpty':
      return (
        fieldValue === undefined ||
        fieldValue === null ||
        fieldValue === '' ||
        (Array.isArray(fieldValue) && fieldValue.length === 0)
      );

    case 'isNotEmpty':
      return (
        fieldValue !== undefined &&
        fieldValue !== null &&
        fieldValue !== '' &&
        (!Array.isArray(fieldValue) || fieldValue.length > 0)
      );

    default:
      return true;
  }
}

/**
 * Hook to determine which fields should be visible based on conditional logic.
 */
export function useConditionalFields(
  fields: FormFieldConfig[],
  data: FormSubmissionData
): {
  visibleFields: FormFieldConfig[];
  isFieldVisible: (fieldName: string) => boolean;
} {
  const visibleFields = useMemo(() => {
    return fields.filter((field) => {
      if (!field.condition) {
        return true;
      }
      return evaluateCondition(field.condition, data);
    });
  }, [fields, data]);

  const isFieldVisible = (fieldName: string): boolean => {
    const field = fields.find((f) => f.name === fieldName);
    if (!field || !field.condition) {
      return true;
    }
    return evaluateCondition(field.condition, data);
  };

  return {
    visibleFields,
    isFieldVisible,
  };
}
