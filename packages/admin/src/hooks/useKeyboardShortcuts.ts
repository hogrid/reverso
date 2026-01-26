import { useCallback, useEffect } from 'react';

type KeyboardShortcutHandler = (event: KeyboardEvent) => void;

interface ShortcutConfig {
  /** Key to match (e.g., 's', 'z', 'y', 'Escape') */
  key: string;
  /** Require Ctrl/Cmd key */
  ctrl?: boolean;
  /** Require Shift key */
  shift?: boolean;
  /** Require Alt/Option key */
  alt?: boolean;
  /** Handler function */
  handler: KeyboardShortcutHandler;
  /** Whether to prevent default behavior (default: true) */
  preventDefault?: boolean;
  /** Whether the shortcut is enabled (default: true) */
  enabled?: boolean;
}

interface UseKeyboardShortcutsOptions {
  /** Array of shortcut configurations */
  shortcuts: ShortcutConfig[];
  /** Whether all shortcuts are enabled (default: true) */
  enabled?: boolean;
}

/**
 * Hook for handling keyboard shortcuts.
 *
 * @example
 * ```tsx
 * useKeyboardShortcuts({
 *   shortcuts: [
 *     { key: 's', ctrl: true, handler: handleSave },
 *     { key: 'z', ctrl: true, handler: handleUndo },
 *     { key: 'z', ctrl: true, shift: true, handler: handleRedo },
 *     { key: 'Escape', handler: handleCancel },
 *   ],
 * });
 * ```
 */
export function useKeyboardShortcuts({
  shortcuts,
  enabled = true,
}: UseKeyboardShortcutsOptions): void {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs (unless it's Escape)
      const target = event.target as HTMLElement;
      const isInputElement =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      for (const shortcut of shortcuts) {
        const {
          key,
          ctrl = false,
          shift = false,
          alt = false,
          handler,
          preventDefault = true,
          enabled: shortcutEnabled = true,
        } = shortcut;

        if (!shortcutEnabled) continue;

        // Skip non-escape shortcuts in input elements
        if (isInputElement && key.toLowerCase() !== 'escape') {
          // Allow Ctrl+S in inputs for saving
          if (!(ctrl && key.toLowerCase() === 's')) {
            continue;
          }
        }

        // Check if modifiers match
        const ctrlMatch = ctrl === (event.ctrlKey || event.metaKey);
        const shiftMatch = shift === event.shiftKey;
        const altMatch = alt === event.altKey;
        const keyMatch = event.key.toLowerCase() === key.toLowerCase();

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          if (preventDefault) {
            event.preventDefault();
          }
          handler(event);
          return;
        }
      }
    },
    [enabled, shortcuts]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
}

/**
 * Predefined shortcut configurations for common editor actions.
 */
export const editorShortcuts = {
  save: (handler: KeyboardShortcutHandler): ShortcutConfig => ({
    key: 's',
    ctrl: true,
    handler,
  }),
  undo: (handler: KeyboardShortcutHandler): ShortcutConfig => ({
    key: 'z',
    ctrl: true,
    handler,
  }),
  redo: (handler: KeyboardShortcutHandler): ShortcutConfig => ({
    key: 'z',
    ctrl: true,
    shift: true,
    handler,
  }),
  redoAlt: (handler: KeyboardShortcutHandler): ShortcutConfig => ({
    key: 'y',
    ctrl: true,
    handler,
  }),
  escape: (handler: KeyboardShortcutHandler): ShortcutConfig => ({
    key: 'Escape',
    handler,
  }),
};
