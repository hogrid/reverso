/**
 * Hidden field component.
 */

import type { FormFieldProps } from '../../types';

export function HiddenField({ field, value }: FormFieldProps) {
  return <input type="hidden" id={field.id} name={field.name} value={(value as string) || ''} />;
}
