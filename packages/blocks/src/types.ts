import type { Editor } from '@tiptap/react';

/**
 * Block editor content format
 */
export type BlockContent = string; // HTML string

/**
 * Block editor props
 */
export interface BlockEditorProps {
  /** Current content (HTML string) */
  content?: string;
  /** Callback when content changes */
  onChange?: (content: string) => void;
  /** Placeholder text when editor is empty */
  placeholder?: string;
  /** Whether the editor is disabled */
  disabled?: boolean;
  /** Whether the editor is read-only */
  readOnly?: boolean;
  /** Minimum height in pixels */
  minHeight?: number;
  /** Maximum height in pixels (enables scrolling) */
  maxHeight?: number;
  /** Show word count in footer */
  showWordCount?: boolean;
  /** Show character count in footer */
  showCharCount?: boolean;
  /** Custom class name for the editor container */
  className?: string;
  /** Autofocus on mount */
  autoFocus?: boolean;
  /** Callback when editor is created */
  onEditorReady?: (editor: Editor) => void;
}

/**
 * Toolbar button configuration
 */
export interface ToolbarButtonConfig {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  action: (editor: Editor) => void;
  isActive?: (editor: Editor) => boolean;
  isDisabled?: (editor: Editor) => boolean;
}

/**
 * Toolbar group configuration
 */
export interface ToolbarGroupConfig {
  name: string;
  buttons: ToolbarButtonConfig[];
}

/**
 * Editor toolbar props
 */
export interface EditorToolbarProps {
  editor: Editor | null;
  disabled?: boolean;
  className?: string;
}

/**
 * Callout block types
 */
export type CalloutType = 'info' | 'warning' | 'error' | 'success' | 'tip';

/**
 * Callout block attributes
 */
export interface CalloutAttributes {
  type: CalloutType;
}

/**
 * Image block attributes
 */
export interface ImageBlockAttributes {
  src: string;
  alt?: string;
  title?: string;
  caption?: string;
  alignment?: 'left' | 'center' | 'right';
  width?: number | string;
}

/**
 * Code block attributes
 */
export interface CodeBlockAttributes {
  language?: string;
}
