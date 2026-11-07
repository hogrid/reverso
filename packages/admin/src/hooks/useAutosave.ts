import { useEditorStore } from '@/stores/editor';
import type { ContentValue } from '@reverso/core';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseAutosaveOptions {
  /** Debounce delay in milliseconds (default: 2000) */
  debounceMs?: number;
  /** Whether autosave is enabled (default: true) */
  enabled?: boolean;
  /**
   * Persist the given dirty fields (full path -> value). The hook snapshots
   * the dirty fields before calling this and, once it resolves, clears only
   * the paths whose value is still the one that was saved; anything edited
   * while the request was in flight stays dirty for the next save.
   */
  onSave: (data: Record<string, ContentValue>) => Promise<void>;
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

  // The dirty-fields map a failed save was attempted against. Every edit
  // replaces the map, so while the store still holds this exact reference
  // nothing changed and autosave stays disarmed: a failing API must not be
  // hammered every `debounceMs` forever. A new edit (or a manual save)
  // re-arms it.
  const [failedOn, setFailedOn] = useState<Map<string, ContentValue> | null>(null);

  const dirtyFields = useEditorStore((state) => state.dirtyFields);
  const isSaving = useEditorStore((state) => state.isSaving);
  const lastSaved = useEditorStore((state) => state.lastSaved);
  const autosaveEnabled = useEditorStore((state) => state.autosaveEnabled);

  const isDirty = dirtyFields.size > 0;
  const isEnabled = enabled && autosaveEnabled;
  const isDisarmedByFailure = failedOn !== null && failedOn === dirtyFields;

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const save = useCallback(async () => {
    const store = useEditorStore.getState();
    if (store.isSaving) return;

    const snapshot = store.getDirtyFieldsData();
    if (Object.keys(snapshot).length === 0) return;
    const page = store.currentPage;

    cancel();
    setFailedOn(null);
    store.setIsSaving(true);

    try {
      await onSave(snapshot);
      // The editor may have moved to another page while the request was in
      // flight; that page's state must not be touched by this save.
      if (useEditorStore.getState().currentPage === page) {
        useEditorStore.getState().clearSavedFields(snapshot);
      }
    } catch (error) {
      if (isMountedRef.current) {
        setFailedOn(useEditorStore.getState().dirtyFields);
        onError?.(error);
      }
    } finally {
      // Always release the flag, even when this editor already unmounted:
      // the store is global, and a stuck flag disables Save on every editor
      // opened afterwards.
      useEditorStore.getState().setIsSaving(false);
    }
  }, [onSave, onError, cancel]);

  // Debounced autosave effect
  useEffect(() => {
    if (!isEnabled || !isDirty || isSaving || isDisarmedByFailure) {
      return;
    }

    timeoutRef.current = setTimeout(() => {
      save();
    }, debounceMs);

    return () => {
      cancel();
    };
  }, [isEnabled, isDirty, isSaving, isDisarmedByFailure, debounceMs, save, cancel]);

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
