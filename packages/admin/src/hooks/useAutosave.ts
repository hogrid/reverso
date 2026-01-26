import { useEditorStore } from '@/stores/editor';
import { useCallback, useEffect, useRef } from 'react';

interface UseAutosaveOptions {
  /** Debounce delay in milliseconds (default: 2000) */
  debounceMs?: number;
  /** Whether autosave is enabled (default: true) */
  enabled?: boolean;
  /** Callback to perform the save operation */
  onSave: () => Promise<void>;
  /** Callback when save fails */
  onError?: (error: unknown) => void;
}

interface UseAutosaveReturn {
  /** Trigger a manual save */
  save: () => Promise<void>;
  /** Cancel pending autosave */
  cancel: () => void;
  /** Whether a save is currently in progress */
  isSaving: boolean;
  /** Last saved timestamp */
  lastSaved: Date | null;
  /** Whether there are unsaved changes */
  isDirty: boolean;
}

/**
 * Hook for automatic saving with debouncing.
 * Watches for dirty fields and triggers save after a delay.
 */
export function useAutosave({
  debounceMs = 2000,
  enabled = true,
  onSave,
  onError,
}: UseAutosaveOptions): UseAutosaveReturn {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  const { hasDirtyFields, isSaving, setIsSaving, lastSaved, setLastSaved, autosaveEnabled } =
    useEditorStore();

  const isDirty = hasDirtyFields();
  const isEnabled = enabled && autosaveEnabled;

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const save = useCallback(async () => {
    if (isSaving) return;

    cancel();
    setIsSaving(true);

    try {
      await onSave();
      if (isMountedRef.current) {
        setLastSaved(new Date());
      }
    } catch (error) {
      if (isMountedRef.current) {
        onError?.(error);
      }
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [onSave, onError, isSaving, cancel, setIsSaving, setLastSaved]);

  // Debounced autosave effect
  useEffect(() => {
    if (!isEnabled || !isDirty || isSaving) {
      return;
    }

    timeoutRef.current = setTimeout(() => {
      save();
    }, debounceMs);

    return () => {
      cancel();
    };
  }, [isEnabled, isDirty, isSaving, debounceMs, save, cancel]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      cancel();
    };
  }, [cancel]);

  return {
    save,
    cancel,
    isSaving,
    lastSaved,
    isDirty,
  };
}
