import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { cn, sanitizeHtml } from '@/lib/utils';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Image,
  Italic,
  Link,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
  Redo,
  Strikethrough,
  Underline,
  Undo,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FieldRendererProps } from './FieldRenderer';

// Block editor placeholder - in production this would use @reverso/blocks with Tiptap
// For now, we create a simplified contenteditable-based editor

interface ToolbarButtonProps {
  icon: React.ElementType;
  command: string;
  active?: boolean;
  disabled?: boolean;
  title: string;
  value?: string;
}

function ToolbarButton({
  icon: Icon,
  command,
  active,
  disabled,
  title,
  value,
}: ToolbarButtonProps) {
  const handleClick = () => {
    document.execCommand(command, false, value);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn('h-8 w-8', active && 'bg-accent')}
      onClick={handleClick}
      disabled={disabled}
      title={title}
      type="button"
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}

export function BlocksField({ field, value, onChange, disabled }: FieldRendererProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  // Initialize content with sanitization to prevent XSS
  useEffect(() => {
    if (editorRef.current && typeof value === 'string') {
      const sanitized = sanitizeHtml(value);
      editorRef.current.innerHTML = sanitized;
      setIsEmpty(!sanitized || sanitized === '<p><br></p>');
    }
  }, []);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      onChange(html);
      setIsEmpty(!html || html === '<p><br></p>' || html === '<br>');
    }
  }, [onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle keyboard shortcuts
    if (e.metaKey || e.ctrlKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          document.execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          document.execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          document.execCommand('underline');
          break;
        case 'z':
          if (e.shiftKey) {
            e.preventDefault();
            document.execCommand('redo');
          } else {
            e.preventDefault();
            document.execCommand('undo');
          }
          break;
      }
    }
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      document.execCommand('createLink', false, url);
    }
  };

  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      document.execCommand('insertImage', false, url);
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/50 px-2 py-1">
        {/* Text formatting */}
        <ToolbarButton icon={Bold} command="bold" title="Bold (Ctrl+B)" disabled={disabled} />
        <ToolbarButton icon={Italic} command="italic" title="Italic (Ctrl+I)" disabled={disabled} />
        <ToolbarButton
          icon={Underline}
          command="underline"
          title="Underline (Ctrl+U)"
          disabled={disabled}
        />
        <ToolbarButton
          icon={Strikethrough}
          command="strikeThrough"
          title="Strikethrough"
          disabled={disabled}
        />
        <ToolbarButton
          icon={Code}
          command="insertHTML"
          value="<code></code>"
          title="Inline code"
          disabled={disabled}
        />

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Headings */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2" disabled={disabled}>
              <Pilcrow className="h-4 w-4 mr-1" />
              <span className="text-xs">Paragraph</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => document.execCommand('formatBlock', false, 'p')}>
              <Pilcrow className="h-4 w-4 mr-2" />
              Paragraph
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => document.execCommand('formatBlock', false, 'h1')}>
              <Heading1 className="h-4 w-4 mr-2" />
              Heading 1
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => document.execCommand('formatBlock', false, 'h2')}>
              <Heading2 className="h-4 w-4 mr-2" />
              Heading 2
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => document.execCommand('formatBlock', false, 'h3')}>
              <Heading3 className="h-4 w-4 mr-2" />
              Heading 3
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => document.execCommand('formatBlock', false, 'blockquote')}
            >
              <Quote className="h-4 w-4 mr-2" />
              Quote
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Lists */}
        <ToolbarButton
          icon={List}
          command="insertUnorderedList"
          title="Bullet list"
          disabled={disabled}
        />
        <ToolbarButton
          icon={ListOrdered}
          command="insertOrderedList"
          title="Numbered list"
          disabled={disabled}
        />

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Alignment */}
        <ToolbarButton
          icon={AlignLeft}
          command="justifyLeft"
          title="Align left"
          disabled={disabled}
        />
        <ToolbarButton
          icon={AlignCenter}
          command="justifyCenter"
          title="Align center"
          disabled={disabled}
        />
        <ToolbarButton
          icon={AlignRight}
          command="justifyRight"
          title="Align right"
          disabled={disabled}
        />
        <ToolbarButton
          icon={AlignJustify}
          command="justifyFull"
          title="Justify"
          disabled={disabled}
        />

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Insert */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={insertLink}
          disabled={disabled}
          title="Insert link"
          type="button"
        >
          <Link className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={insertImage}
          disabled={disabled}
          title="Insert image"
          type="button"
        >
          <Image className="h-4 w-4" />
        </Button>

        <div className="flex-1" />

        {/* Undo/Redo */}
        <ToolbarButton icon={Undo} command="undo" title="Undo (Ctrl+Z)" disabled={disabled} />
        <ToolbarButton icon={Redo} command="redo" title="Redo (Ctrl+Shift+Z)" disabled={disabled} />
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className={cn(
          'min-h-[200px] p-4 outline-none',
          'prose prose-sm max-w-none dark:prose-invert',
          '[&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        data-placeholder={field.placeholder || 'Start writing...'}
        style={{
          minHeight: field.rows ? `${field.rows * 24}px` : '200px',
        }}
      />

      {/* Footer with word count */}
      <div className="flex items-center justify-end border-t bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
        <span>
          {editorRef.current?.textContent?.split(/\s+/).filter(Boolean).length || 0} words
        </span>
      </div>

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: hsl(var(--muted-foreground));
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
