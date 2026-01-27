
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  Code,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Image,
  Italic,
  Link,
  Link2Off,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Redo,
  RemoveFormatting,
  Strikethrough,
  Table,
  Underline,
  Undo,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { EditorToolbarProps } from './types';

interface ToolbarButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
}

function ToolbarButton({ icon: Icon, title, onClick, isActive, disabled }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        inline-flex items-center justify-center h-8 w-8 rounded
        text-sm font-medium transition-colors
        hover:bg-gray-100 dark:hover:bg-gray-800
        disabled:pointer-events-none disabled:opacity-50
        ${isActive ? 'bg-gray-200 dark:bg-gray-700' : ''}
      `}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function ToolbarSeparator() {
  return <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />;
}

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  disabled?: boolean;
}

function Dropdown({ trigger, children, disabled }: DropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={`
          inline-flex items-center gap-1 h-8 px-2 rounded
          text-sm font-medium transition-colors
          hover:bg-gray-100 dark:hover:bg-gray-800
          disabled:pointer-events-none disabled:opacity-50
        `}
      >
        {trigger}
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
            role="presentation"
          />
          <div
            className="absolute top-full left-0 mt-1 z-50 min-w-[150px] rounded-md border bg-white dark:bg-gray-900 shadow-md py-1"
            onClick={() => setOpen(false)}
            onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
            role="menu"
          >
            {children}
          </div>
        </>
      )}
    </div>
  );
}

interface DropdownItemProps {
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  onClick: () => void;
  isActive?: boolean;
}

function DropdownItem({ icon: Icon, children, onClick, isActive }: DropdownItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full flex items-center gap-2 px-3 py-1.5 text-sm
        hover:bg-gray-100 dark:hover:bg-gray-800
        ${isActive ? 'bg-gray-100 dark:bg-gray-800' : ''}
      `}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
}

export function EditorToolbar({ editor, disabled, className }: EditorToolbarProps) {
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const linkInputRef = useRef<HTMLInputElement>(null);

  // Focus link input when shown
  useEffect(() => {
    if (showLinkInput && linkInputRef.current) {
      linkInputRef.current.focus();
    }
  }, [showLinkInput]);

  const setLink = useCallback(() => {
    if (!editor || !linkUrl) return;

    // Empty URL removes the link
    if (linkUrl === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // Add https if no protocol
    const url = linkUrl.match(/^https?:\/\//) ? linkUrl : `https://${linkUrl}`;
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    setLinkUrl('');
    setShowLinkInput(false);
  }, [editor, linkUrl]);

  const addImage = useCallback(() => {
    if (!editor) return;
    const url = prompt('Enter image URL:');
    if (url) {
      // Validate URL to prevent XSS via javascript: or data: URLs
      try {
        const parsedUrl = new URL(url, window.location.origin);
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          alert('Only HTTP and HTTPS URLs are allowed for images.');
          return;
        }
        editor.chain().focus().setImage({ src: parsedUrl.href }).run();
      } catch {
        // If URL parsing fails, try adding https:// prefix
        try {
          const urlWithProtocol = `https://${url}`;
          const parsedUrl = new URL(urlWithProtocol);
          editor.chain().focus().setImage({ src: parsedUrl.href }).run();
        } catch {
          alert('Please enter a valid URL.');
        }
      }
    }
  }, [editor]);

  const addTable = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div
      className={`flex flex-wrap items-center gap-0.5 border-b bg-gray-50 dark:bg-gray-900 px-2 py-1.5 ${className || ''}`}
    >
      {/* Undo/Redo */}
      <ToolbarButton
        icon={Undo}
        title="Undo (Ctrl+Z)"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={disabled || !editor.can().undo()}
      />
      <ToolbarButton
        icon={Redo}
        title="Redo (Ctrl+Y)"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={disabled || !editor.can().redo()}
      />

      <ToolbarSeparator />

      {/* Text Style Dropdown */}
      <Dropdown
        trigger={
          <>
            <Pilcrow className="h-4 w-4" />
            <span className="text-xs">
              {editor.isActive('heading', { level: 1 })
                ? 'Heading 1'
                : editor.isActive('heading', { level: 2 })
                  ? 'Heading 2'
                  : editor.isActive('heading', { level: 3 })
                    ? 'Heading 3'
                    : editor.isActive('blockquote')
                      ? 'Quote'
                      : editor.isActive('codeBlock')
                        ? 'Code'
                        : 'Paragraph'}
            </span>
          </>
        }
        disabled={disabled}
      >
        <DropdownItem
          icon={Pilcrow}
          onClick={() => editor.chain().focus().setParagraph().run()}
          isActive={editor.isActive('paragraph')}
        >
          Paragraph
        </DropdownItem>
        <DropdownItem
          icon={Heading1}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
        >
          Heading 1
        </DropdownItem>
        <DropdownItem
          icon={Heading2}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
        >
          Heading 2
        </DropdownItem>
        <DropdownItem
          icon={Heading3}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
        >
          Heading 3
        </DropdownItem>
        <DropdownItem
          icon={Quote}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
        >
          Quote
        </DropdownItem>
        <DropdownItem
          icon={Code2}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive('codeBlock')}
        >
          Code Block
        </DropdownItem>
      </Dropdown>

      <ToolbarSeparator />

      {/* Text Formatting */}
      <ToolbarButton
        icon={Bold}
        title="Bold (Ctrl+B)"
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        disabled={disabled}
      />
      <ToolbarButton
        icon={Italic}
        title="Italic (Ctrl+I)"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        disabled={disabled}
      />
      <ToolbarButton
        icon={Underline}
        title="Underline (Ctrl+U)"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        disabled={disabled}
      />
      <ToolbarButton
        icon={Strikethrough}
        title="Strikethrough"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        disabled={disabled}
      />
      <ToolbarButton
        icon={Code}
        title="Inline Code"
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive('code')}
        disabled={disabled}
      />
      <ToolbarButton
        icon={Highlighter}
        title="Highlight"
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        isActive={editor.isActive('highlight')}
        disabled={disabled}
      />

      <ToolbarSeparator />

      {/* Lists */}
      <ToolbarButton
        icon={List}
        title="Bullet List"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        disabled={disabled}
      />
      <ToolbarButton
        icon={ListOrdered}
        title="Numbered List"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        disabled={disabled}
      />

      <ToolbarSeparator />

      {/* Alignment */}
      <ToolbarButton
        icon={AlignLeft}
        title="Align Left"
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        isActive={editor.isActive({ textAlign: 'left' })}
        disabled={disabled}
      />
      <ToolbarButton
        icon={AlignCenter}
        title="Align Center"
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        isActive={editor.isActive({ textAlign: 'center' })}
        disabled={disabled}
      />
      <ToolbarButton
        icon={AlignRight}
        title="Align Right"
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        isActive={editor.isActive({ textAlign: 'right' })}
        disabled={disabled}
      />
      <ToolbarButton
        icon={AlignJustify}
        title="Justify"
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        isActive={editor.isActive({ textAlign: 'justify' })}
        disabled={disabled}
      />

      <ToolbarSeparator />

      {/* Insert */}
      {showLinkInput ? (
        <div className="flex items-center gap-1">
          <input
            ref={linkInputRef}
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="Enter URL..."
            className="h-7 px-2 text-sm border rounded bg-white dark:bg-gray-800 w-[180px]"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                setLink();
              } else if (e.key === 'Escape') {
                setShowLinkInput(false);
                setLinkUrl('');
              }
            }}
          />
          <button
            type="button"
            onClick={setLink}
            className="h-7 px-2 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setShowLinkInput(false);
              setLinkUrl('');
            }}
            className="h-7 px-2 text-xs border rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
        </div>
      ) : (
        <>
          <ToolbarButton
            icon={Link}
            title="Add Link"
            onClick={() => setShowLinkInput(true)}
            isActive={editor.isActive('link')}
            disabled={disabled}
          />
          {editor.isActive('link') && (
            <ToolbarButton
              icon={Link2Off}
              title="Remove Link"
              onClick={() => editor.chain().focus().unsetLink().run()}
              disabled={disabled}
            />
          )}
        </>
      )}
      <ToolbarButton icon={Image} title="Insert Image" onClick={addImage} disabled={disabled} />
      <ToolbarButton icon={Table} title="Insert Table" onClick={addTable} disabled={disabled} />
      <ToolbarButton
        icon={Minus}
        title="Horizontal Rule"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        disabled={disabled}
      />

      <div className="flex-1" />

      {/* Clear Formatting */}
      <ToolbarButton
        icon={RemoveFormatting}
        title="Clear Formatting"
        onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        disabled={disabled}
      />
    </div>
  );
}
