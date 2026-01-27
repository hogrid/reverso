/**
 * Unit tests for Zustand stores.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '../stores/editor';

describe('Editor Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useEditorStore.setState({
      currentPage: null,
      dirtyFields: new Map(),
      history: [],
      historyIndex: -1,
      autosaveEnabled: true,
      lastSaved: null,
      isSaving: false,
      focusedField: null,
      validationErrors: new Map(),
    });
  });

  describe('Page Management', () => {
    it('should set current page', () => {
      useEditorStore.getState().setCurrentPage('home');
      expect(useEditorStore.getState().currentPage).toBe('home');
    });

    it('should clear dirty fields when changing page', () => {
      const store = useEditorStore.getState();
      store.setFieldValue('test.field', 'value', 'old');
      expect(store.hasDirtyFields()).toBe(true);

      store.setCurrentPage('new-page');
      expect(useEditorStore.getState().hasDirtyFields()).toBe(false);
    });

    it('should clear history when changing page', () => {
      const store = useEditorStore.getState();
      store.setFieldValue('test.field', 'value1', 'value0');
      store.setFieldValue('test.field', 'value2', 'value1');
      expect(useEditorStore.getState().history.length).toBe(2);

      store.setCurrentPage('new-page');
      expect(useEditorStore.getState().history.length).toBe(0);
      expect(useEditorStore.getState().historyIndex).toBe(-1);
    });
  });

  describe('Dirty Fields', () => {
    it('should track dirty fields', () => {
      const store = useEditorStore.getState();
      store.setFieldValue('home.hero.title', 'New Title');

      expect(store.hasDirtyFields()).toBe(true);
      expect(store.getDirtyFieldsData()).toEqual({
        'home.hero.title': 'New Title',
      });
    });

    it('should mark field as clean', () => {
      const store = useEditorStore.getState();
      store.setFieldValue('home.hero.title', 'New Title');
      expect(store.hasDirtyFields()).toBe(true);

      store.markFieldClean('home.hero.title');
      expect(useEditorStore.getState().hasDirtyFields()).toBe(false);
    });

    it('should clear all dirty fields', () => {
      const store = useEditorStore.getState();
      store.setFieldValue('field1', 'value1');
      store.setFieldValue('field2', 'value2');
      expect(store.hasDirtyFields()).toBe(true);

      store.clearDirtyFields();
      expect(useEditorStore.getState().hasDirtyFields()).toBe(false);
      expect(useEditorStore.getState().lastSaved).toBeInstanceOf(Date);
    });

    it('should return dirty fields as object', () => {
      const store = useEditorStore.getState();
      store.setFieldValue('field1', 'value1');
      store.setFieldValue('field2', 'value2');

      const data = store.getDirtyFieldsData();
      expect(data).toEqual({
        field1: 'value1',
        field2: 'value2',
      });
    });
  });

  describe('History (Undo/Redo)', () => {
    it('should add changes to history', () => {
      const store = useEditorStore.getState();
      store.setFieldValue('test', 'new', 'old');

      expect(useEditorStore.getState().history.length).toBe(1);
      expect(useEditorStore.getState().history[0]).toMatchObject({
        path: 'test',
        oldValue: 'old',
        newValue: 'new',
      });
    });

    it('should not add to history without oldValue', () => {
      const store = useEditorStore.getState();
      store.setFieldValue('test', 'value');

      expect(useEditorStore.getState().history.length).toBe(0);
    });

    it('should undo changes', () => {
      const store = useEditorStore.getState();
      store.setFieldValue('test', 'value1', 'initial');
      store.setFieldValue('test', 'value2', 'value1');

      expect(useEditorStore.getState().dirtyFields.get('test')).toBe('value2');

      store.undo();
      expect(useEditorStore.getState().dirtyFields.get('test')).toBe('value1');

      store.undo();
      expect(useEditorStore.getState().dirtyFields.get('test')).toBe('initial');
    });

    it('should redo changes', () => {
      const store = useEditorStore.getState();
      store.setFieldValue('test', 'value1', 'initial');
      store.setFieldValue('test', 'value2', 'value1');

      store.undo();
      store.undo();
      expect(useEditorStore.getState().dirtyFields.get('test')).toBe('initial');

      store.redo();
      expect(useEditorStore.getState().dirtyFields.get('test')).toBe('value1');

      store.redo();
      expect(useEditorStore.getState().dirtyFields.get('test')).toBe('value2');
    });

    it('should report canUndo correctly', () => {
      const store = useEditorStore.getState();
      expect(store.canUndo()).toBe(false);

      store.setFieldValue('test', 'value', 'old');
      expect(useEditorStore.getState().canUndo()).toBe(true);

      store.undo();
      expect(useEditorStore.getState().canUndo()).toBe(false);
    });

    it('should report canRedo correctly', () => {
      const store = useEditorStore.getState();
      expect(store.canRedo()).toBe(false);

      store.setFieldValue('test', 'value', 'old');
      expect(useEditorStore.getState().canRedo()).toBe(false);

      store.undo();
      expect(useEditorStore.getState().canRedo()).toBe(true);

      store.redo();
      expect(useEditorStore.getState().canRedo()).toBe(false);
    });

    it('should truncate redo history on new change', () => {
      const store = useEditorStore.getState();
      store.setFieldValue('test', 'v1', 'v0');
      store.setFieldValue('test', 'v2', 'v1');
      store.setFieldValue('test', 'v3', 'v2');

      store.undo();
      store.undo();
      // Now at v1, with v2 and v3 in redo stack

      store.setFieldValue('test', 'v4', 'v1');
      // Should have truncated v2 and v3

      expect(useEditorStore.getState().canRedo()).toBe(false);
      expect(useEditorStore.getState().history.length).toBe(2); // v0->v1, v1->v4
    });

    it('should limit history to 100 entries', () => {
      const store = useEditorStore.getState();

      // Add 110 changes
      for (let i = 0; i < 110; i++) {
        store.setFieldValue('test', `value${i + 1}`, `value${i}`);
      }

      expect(useEditorStore.getState().history.length).toBe(100);
    });
  });

  describe('Autosave', () => {
    it('should toggle autosave', () => {
      const store = useEditorStore.getState();
      expect(store.autosaveEnabled).toBe(true);

      store.setAutosaveEnabled(false);
      expect(useEditorStore.getState().autosaveEnabled).toBe(false);
    });

    it('should track saving state', () => {
      const store = useEditorStore.getState();
      expect(store.isSaving).toBe(false);

      store.setIsSaving(true);
      expect(useEditorStore.getState().isSaving).toBe(true);
    });

    it('should track last saved time', () => {
      const store = useEditorStore.getState();
      const now = new Date();
      store.setLastSaved(now);
      expect(useEditorStore.getState().lastSaved).toEqual(now);
    });
  });

  describe('Focus', () => {
    it('should track focused field', () => {
      const store = useEditorStore.getState();
      expect(store.focusedField).toBeNull();

      store.setFocusedField('home.hero.title');
      expect(useEditorStore.getState().focusedField).toBe('home.hero.title');

      store.setFocusedField(null);
      expect(useEditorStore.getState().focusedField).toBeNull();
    });
  });

  describe('Validation Errors', () => {
    it('should set validation error', () => {
      const store = useEditorStore.getState();
      store.setValidationError('field1', 'Required field');

      expect(useEditorStore.getState().validationErrors.get('field1')).toBe('Required field');
      expect(store.hasValidationErrors()).toBe(true);
    });

    it('should clear validation error', () => {
      const store = useEditorStore.getState();
      store.setValidationError('field1', 'Error');
      store.clearValidationError('field1');

      expect(useEditorStore.getState().validationErrors.has('field1')).toBe(false);
    });

    it('should clear all validation errors', () => {
      const store = useEditorStore.getState();
      store.setValidationError('field1', 'Error 1');
      store.setValidationError('field2', 'Error 2');

      store.clearAllValidationErrors();
      expect(useEditorStore.getState().hasValidationErrors()).toBe(false);
    });

    it('should report hasValidationErrors correctly', () => {
      const store = useEditorStore.getState();
      expect(store.hasValidationErrors()).toBe(false);

      store.setValidationError('field', 'Error');
      expect(useEditorStore.getState().hasValidationErrors()).toBe(true);
    });
  });
});
