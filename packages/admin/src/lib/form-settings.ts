/**
 * Mapping between a stored form and the form builder's settings dialog.
 */

import type { FormDetail, UpdateFormInput } from '@/api/hooks/useForms';

export interface FormSettingsValues {
  name: string;
  slug: string;
  description: string;
  submitButtonText: string;
  successMessage: string;
  redirectUrl: string;
  honeypotEnabled: boolean;
  rateLimitPerMinute: number;
  /** Comma-separated, as typed in the dialog. */
  notifyEmails: string;
  webhookUrl: string;
  webhookEnabled: boolean;
}

export const DEFAULT_SUBMIT_TEXT = 'Submit';
export const DEFAULT_SUCCESS_MESSAGE = 'Thank you for your submission!';

/** Dialog values for a stored form. */
export function formToSettings(form: FormDetail): FormSettingsValues {
  return {
    name: form.name,
    slug: form.slug,
    description: form.description || '',
    submitButtonText: form.settings?.submitButtonText || DEFAULT_SUBMIT_TEXT,
    successMessage: form.settings?.successMessage || DEFAULT_SUCCESS_MESSAGE,
    redirectUrl: form.settings?.redirectUrl || '',
    honeypotEnabled: form.honeypotEnabled ?? true,
    rateLimitPerMinute: form.rateLimitPerMinute ?? 10,
    notifyEmails: form.notifyEmails?.join(', ') || '',
    webhookUrl: form.webhookUrl || '',
    webhookEnabled: form.webhookEnabled ?? false,
  };
}

export type FormSettingsUpdate = UpdateFormInput & {
  /** null clears the stored webhook URL. */
  webhookUrl: string | null;
};

/**
 * PUT /forms/:id body for the dialog values. `settings` replaces the stored
 * JSON wholesale, so an empty redirect URL is simply left out (cleared);
 * an empty webhook URL is sent as null to clear it.
 */
export function settingsToUpdate(values: FormSettingsValues): FormSettingsUpdate {
  const redirectUrl = values.redirectUrl.trim();
  const webhookUrl = values.webhookUrl.trim();
  return {
    name: values.name,
    slug: values.slug,
    description: values.description,
    settings: {
      submitButtonText: values.submitButtonText,
      successMessage: values.successMessage,
      ...(redirectUrl ? { redirectUrl } : {}),
    },
    honeypotEnabled: values.honeypotEnabled,
    rateLimitPerMinute: values.rateLimitPerMinute,
    notifyEmails: values.notifyEmails
      .split(',')
      .map((email) => email.trim())
      .filter(Boolean),
    webhookUrl: webhookUrl || null,
    webhookEnabled: values.webhookEnabled,
  };
}
