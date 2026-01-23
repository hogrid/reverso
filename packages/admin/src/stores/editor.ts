import type { ContentValue } from '@reverso/core';
import { create } from 'zustand';

export interface FieldChange {
  path: string;
  oldValue: ContentValue;
  newValue: ContentValue;
  timestamp: number;
}

export interface EditorState {
  // Current page being edited
  currentPage: string | null;

  // Dirty fields (unsaved changes)
  dirtyFields: Map<string, ContentValue>;

  // Change history for undo/redo
  history: FieldChange[];
  historyIndex: number;

  // Autosave state
  autosaveEnabled: boolean;
  lastSaved: Date | null;
  isSaving: boolean;

  // Focus state
  focusedField: string | null;

  // Validation errors
  validationErrors: Map<string, string>;

  // Actions
  setCurrentPage: (slug: string | null) => void;
  setFieldValue: (path: string, value: ContentValue, oldValue?: ContentValue) => void;
  markFieldClean: (path: string) => void;
  clearDirtyFields: () => void;
  hasDirtyFields: () => boolean;
  getDirtyFieldsData: () => Record<string, ContentValue>;

  // History actions
  undo: () => FieldChange | null;
  redo: () => FieldChange | null;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Autosave actions
  setAutosaveEnabled: (enabled: boolean) => void;
  setLastSaved: (date: Date | null) => void;
  setIsSaving: (saving: boolean) => void;

  // Focus actions
  setFocusedField: (path: string | null) => void;

  // Validation actions
  setValidationError: (path: string, error: string) => void;
  clearValidationError: (path: string) => void;
  clearAllValidationErrors: () => void;
  hasValidationErrors: () => boolean;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  // Initial state
  currentPage: null,
  dirtyFields: new Map(),
  history: [],
  historyIndex: -1,
  autosaveEnabled: true,
  lastSaved: null,
  isSaving: false,
  focusedField: null,
  validationErrors: new Map(),

  // Page actions
  setCurrentPage: (slug) => {
    set({
      currentPage: slug,
      dirtyFields: new Map(),
      history: [],
      historyIndex: -1,
      validationErrors: new Map(),
    });
  },

  // Field value actions
  setFieldValue: (path, value, oldValue) => {
    const { dirtyFields, history, historyIndex } = get();
    const newDirtyFields = new Map(dirtyFields);
    newDirtyFields.set(path, value);

    // Add to history if oldValue provided
    let newHistory = history;
    let newHistoryIndex = historyIndex;

    if (oldValue !== undefined) {
      // Truncate any redo history
      newHistory = history.slice(0, historyIndex + 1);
      newHistory.push({
        path,
        oldValue,
        newValue: value,
        timestamp: Date.now(),
      });
      newHistoryIndex = newHistory.length - 1;

      // Limit history size
      if (newHistory.length > 100) {
        newHistory = newHistory.slice(-100);
        newHistoryIndex = newHistory.length - 1;
      }
    }

    set({
      dirtyFields: newDirtyFields,
      history: newHistory,
      historyIndex: newHistoryIndex,
    });
  },

  markFieldClean: (path) => {
    const { dirtyFields } = get();
    const newDirtyFields = new Map(dirtyFields);
    newDirtyFields.delete(path);
    set({ dirtyFields: newDirtyFields });
  },

  clearDirtyFields: () => {
    set({
      dirtyFields: new Map(),
      lastSaved: new Date(),
    });
  },

  hasDirtyFields: () => {
    return get().dirtyFields.size > 0;
  },

  getDirtyFieldsData: () => {
    const data: Record<string, ContentValue> = {};
    for (const [path, value] of get().dirtyFields) {
      data[path] = value;
    }
    return data;
  },

  // History actions
  undo: () => {
    const { history, historyIndex, dirtyFields } = get();
    if (historyIndex < 0) return null;

    const change = history[historyIndex];
    if (!change) return null;

    const newDirtyFields = new Map(dirtyFields);
    newDirtyFields.set(change.path, change.oldValue);

    set({
      historyIndex: historyIndex - 1,
      dirtyFields: newDirtyFields,
    });

    return change;
  },

  redo: () => {
    const { history, historyIndex, dirtyFields } = get();
    if (historyIndex >= history.length - 1) return null;

    const change = history[historyIndex + 1];
    if (!change) return null;

    const newDirtyFields = new Map(dirtyFields);
    newDirtyFields.set(change.path, change.newValue);

    set({
      historyIndex: historyIndex + 1,
      dirtyFields: newDirtyFields,
    });

    return change;
  },

  canUndo: () => get().historyIndex >= 0,

  canRedo: () => get().historyIndex < get().history.length - 1,

  // Autosave actions
  setAutosaveEnabled: (enabled) => set({ autosaveEnabled: enabled }),

  setLastSaved: (date) => set({ lastSaved: date }),

  setIsSaving: (saving) => set({ isSaving: saving }),

  // Focus actions
  setFocusedField: (path) => set({ focusedField: path }),

  // Validation actions
  setValidationError: (path, error) => {
    const { validationErrors } = get();
    const newErrors = new Map(validationErrors);
    newErrors.set(path, error);
    set({ validationErrors: newErrors });
  },

  clearValidationError: (path) => {
    const { validationErrors } = get();
    const newErrors = new Map(validationErrors);
    newErrors.delete(path);
    set({ validationErrors: newErrors });
  },

  clearAllValidationErrors: () => {
    set({ validationErrors: new Map() });
  },

  hasValidationErrors: () => {
    return get().validationErrors.size > 0;
  },
}));
