/**
 * @reverso/blocks
 *
 * Block editor component for Reverso CMS built with Tiptap.
 * Provides a visual block-based content editing experience.
 *
 * @example
 * ```tsx
 * import { BlockEditor } from '@reverso/blocks';
 *
 * function MyEditor() {
 *   const [content, setContent] = useState('<p>Hello World</p>');
 *
 *   return (
 *     <BlockEditor
 *       content={content}
 *       onChange={setContent}
 *       placeholder="Start writing..."
 *     />
 *   );
 * }
 * ```
 */

export const VERSION = '0.0.0';

// Components
export { BlockEditor } from './BlockEditor';
export { EditorToolbar } from './EditorToolbar';

// Types
export type {
  BlockContent,
  BlockEditorProps,
  CalloutAttributes,
  CalloutType,
  CodeBlockAttributes,
  EditorToolbarProps,
  ImageBlockAttributes,
  ToolbarButtonConfig,
  ToolbarGroupConfig,
} from './types';

// Re-export useful types from Tiptap for consumers
export type { Editor, JSONContent } from '@tiptap/react';
