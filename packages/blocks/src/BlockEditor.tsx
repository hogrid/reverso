import { Highlight } from '@tiptap/extension-highlight';
import { Image } from '@tiptap/extension-image';
import { Link } from '@tiptap/extension-link';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableRow } from '@tiptap/extension-table-row';
import { TextAlign } from '@tiptap/extension-text-align';
import { Underline } from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { useEffect, useMemo } from 'react';
import { EditorToolbar } from './EditorToolbar';
import type { BlockEditorProps } from './types';

// CSS styles for the editor
const editorStyles = `
  .reverso-block-editor {
    border: 1px solid hsl(var(--border, 220 13% 91%));
    border-radius: 0.5rem;
    overflow: hidden;
    background: hsl(var(--background, 0 0% 100%));
  }

  .reverso-block-editor .ProseMirror {
    outline: none;
    min-height: inherit;
    padding: 1rem;
  }

  .reverso-block-editor .ProseMirror p.is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    float: left;
    color: hsl(var(--muted-foreground, 220 9% 46%));
    pointer-events: none;
    height: 0;
  }

  /* Prose styling */
  .reverso-block-editor .ProseMirror {
    font-size: 0.875rem;
    line-height: 1.625;
  }

  .reverso-block-editor .ProseMirror > * + * {
    margin-top: 0.75em;
  }

  .reverso-block-editor .ProseMirror h1 {
    font-size: 1.875rem;
    font-weight: 700;
    line-height: 1.2;
  }

  .reverso-block-editor .ProseMirror h2 {
    font-size: 1.5rem;
    font-weight: 600;
    line-height: 1.3;
  }

  .reverso-block-editor .ProseMirror h3 {
    font-size: 1.25rem;
    font-weight: 600;
    line-height: 1.4;
  }

  .reverso-block-editor .ProseMirror blockquote {
    border-left: 3px solid hsl(var(--border, 220 13% 91%));
    padding-left: 1rem;
    font-style: italic;
    color: hsl(var(--muted-foreground, 220 9% 46%));
  }

  .reverso-block-editor .ProseMirror code {
    background: hsl(var(--muted, 220 14% 96%));
    padding: 0.2em 0.4em;
    border-radius: 0.25rem;
    font-family: ui-monospace, monospace;
    font-size: 0.875em;
  }

  .reverso-block-editor .ProseMirror pre {
    background: hsl(var(--muted, 220 14% 96%));
    padding: 1rem;
    border-radius: 0.5rem;
    overflow-x: auto;
  }

  .reverso-block-editor .ProseMirror pre code {
    background: none;
    padding: 0;
  }

  .reverso-block-editor .ProseMirror ul,
  .reverso-block-editor .ProseMirror ol {
    padding-left: 1.5rem;
  }

  .reverso-block-editor .ProseMirror ul {
    list-style-type: disc;
  }

  .reverso-block-editor .ProseMirror ol {
    list-style-type: decimal;
  }

  .reverso-block-editor .ProseMirror a {
    color: hsl(var(--primary, 221 83% 53%));
    text-decoration: underline;
    cursor: pointer;
  }

  .reverso-block-editor .ProseMirror a:hover {
    opacity: 0.8;
  }

  .reverso-block-editor .ProseMirror img {
    max-width: 100%;
    height: auto;
    border-radius: 0.5rem;
  }

  .reverso-block-editor .ProseMirror img.ProseMirror-selectednode {
    outline: 2px solid hsl(var(--primary, 221 83% 53%));
  }

  .reverso-block-editor .ProseMirror hr {
    border: none;
    border-top: 1px solid hsl(var(--border, 220 13% 91%));
    margin: 1.5rem 0;
  }

  .reverso-block-editor .ProseMirror mark {
    background: #fef08a;
    padding: 0.1em 0.2em;
    border-radius: 0.125rem;
  }

  /* Table styles */
  .reverso-block-editor .ProseMirror table {
    border-collapse: collapse;
    table-layout: fixed;
    width: 100%;
    margin: 1rem 0;
    overflow: hidden;
  }

  .reverso-block-editor .ProseMirror th,
  .reverso-block-editor .ProseMirror td {
    border: 1px solid hsl(var(--border, 220 13% 91%));
    padding: 0.5rem;
    vertical-align: top;
    box-sizing: border-box;
    position: relative;
  }

  .reverso-block-editor .ProseMirror th {
    background: hsl(var(--muted, 220 14% 96%));
    font-weight: 600;
    text-align: left;
  }

  .reverso-block-editor .ProseMirror .selectedCell::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    background: hsl(var(--primary, 221 83% 53%) / 0.1);
    pointer-events: none;
  }

  /* Text alignment */
  .reverso-block-editor .ProseMirror [style*="text-align: center"] {
    text-align: center;
  }

  .reverso-block-editor .ProseMirror [style*="text-align: right"] {
    text-align: right;
  }

  .reverso-block-editor .ProseMirror [style*="text-align: justify"] {
    text-align: justify;
  }

  /* Disabled state */
  .reverso-block-editor.disabled {
    opacity: 0.6;
    pointer-events: none;
  }

  .reverso-block-editor.disabled .ProseMirror {
    cursor: not-allowed;
  }
`;

export function BlockEditor({
  content = '',
  onChange,
  placeholder = 'Start writing...',
  disabled = false,
  readOnly = false,
  minHeight = 200,
  maxHeight,
  showWordCount = true,
  showCharCount = false,
  className,
  autoFocus = false,
  onEditorReady,
}: BlockEditorProps) {
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'editor-image',
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: false,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    [placeholder]
  );

  const editor = useEditor({
    extensions,
    content,
    editable: !disabled && !readOnly,
    autofocus: autoFocus,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html);
    },
    onCreate: ({ editor }) => {
      onEditorReady?.(editor);
    },
  });

  // Update content when prop changes externally
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  // Update editable state
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled && !readOnly);
    }
  }, [editor, disabled, readOnly]);

  const wordCount = useMemo(() => {
    if (!editor) return 0;
    const text = editor.getText();
    return text.split(/\s+/).filter(Boolean).length;
  }, [editor]);

  const charCount = useMemo(() => {
    if (!editor) return 0;
    return editor.getText().length;
  }, [editor]);

  return (
    <>
      <style>{editorStyles}</style>
      <div className={`reverso-block-editor ${disabled ? 'disabled' : ''} ${className || ''}`}>
        {!readOnly && <EditorToolbar editor={editor} disabled={disabled} />}

        <div
          style={{
            minHeight: `${minHeight}px`,
            maxHeight: maxHeight ? `${maxHeight}px` : undefined,
            overflowY: maxHeight ? 'auto' : undefined,
          }}
        >
          <EditorContent editor={editor} />
        </div>

        {(showWordCount || showCharCount) && (
          <div className="flex items-center justify-end gap-3 border-t bg-gray-50 dark:bg-gray-900 px-3 py-1.5 text-xs text-gray-500">
            {showWordCount && <span>{wordCount} words</span>}
            {showCharCount && <span>{charCount} characters</span>}
          </div>
        )}
      </div>
    </>
  );
}
