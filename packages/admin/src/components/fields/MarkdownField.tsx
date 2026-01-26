import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cn, sanitizeHtml } from '@/lib/utils';
import {
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
  Quote,
  Strikethrough,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FieldRendererProps } from './FieldRenderer';

// Escape HTML special characters to prevent XSS
function escapeHtml(text: string): string {
  const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
  };
  return text.replace(/[&<>"']/g, (char) => escapeMap[char] || char);
}

// Validate URL to prevent XSS via javascript:/data: protocols
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url, 'https://example.com');
    return ['http:', 'https:', 'mailto:'].includes(parsed.protocol);
  } catch {
    // If parsing fails, check if it's a relative URL (starts with / or ./)
    return url.startsWith('/') || url.startsWith('./') || url.startsWith('../');
  }
}

function sanitizeUrl(url: string): string {
  return isValidUrl(url) ? url : '#';
}

// Simple markdown to HTML converter for preview
function markdownToHtml(markdown: string): string {
  // First escape HTML to prevent XSS, but preserve markdown syntax
  let html = markdown;

  // Escape HTML in text content (but we need to be careful with markdown syntax)
  // We'll escape < and > that aren't part of valid markdown
  html = html.replace(/<(?![a-zA-Z/])/g, '&lt;');
  html = html.replace(/(?<![a-zA-Z"])>/g, '&gt;');

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>');

  // Bold, italic, strikethrough
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

  // Code blocks
  html = html.replace(
    /```(\w+)?\n([\s\S]+?)```/g,
    '<pre class="bg-muted p-3 rounded-md overflow-x-auto my-2"><code>$2</code></pre>'
  );
  html = html.replace(/`(.+?)`/g, '<code class="bg-muted px-1 rounded">$1</code>');

  // Blockquotes
  html = html.replace(
    /^&gt; (.+)$/gm,
    '<blockquote class="border-l-4 border-muted-foreground pl-4 italic my-2">$1</blockquote>'
  );

  // Links and images - validate URLs to prevent javascript: injection
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, url) => {
    const safeUrl = sanitizeUrl(url.trim());
    return `<img src="${safeUrl}" alt="${escapeHtml(alt)}" class="max-w-full rounded my-2" />`;
  });
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
    const safeUrl = sanitizeUrl(url.trim());
    return `<a href="${safeUrl}" class="text-primary underline" rel="noopener noreferrer">${escapeHtml(text)}</a>`;
  });

  // Lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4">$1</li>');
  html = html.replace(/^[-*] (.+)$/gm, '<li class="ml-4 list-disc">$1</li>');

  // Paragraphs
  html = html.replace(/\n\n/g, '</p><p class="my-2">');
  html = `<p class="my-2">${html}</p>`;

  // Final sanitization pass
  return sanitizeHtml(html);
}

export function MarkdownField({ field, value, onChange, disabled }: FieldRendererProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tab, setTab] = useState<'write' | 'preview'>('write');

  const markdown = (value as string) || '';

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const insertMarkdown = useCallback(
    (before: string, after = '', placeholder = '') => {
      const textarea = textareaRef.current;
      if (!textarea || disabled) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = markdown.substring(start, end) || placeholder;
      const newText =
        markdown.substring(0, start) + before + selectedText + after + markdown.substring(end);

      onChange(newText);

      // Clear previous timeout if any
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Restore cursor position
      timeoutRef.current = setTimeout(() => {
        textarea.focus();
        const newCursorPos = start + before.length + selectedText.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    },
    [markdown, onChange, disabled]
  );

  const toolbarButtons = [
    { icon: Bold, action: () => insertMarkdown('**', '**', 'bold'), title: 'Bold' },
    { icon: Italic, action: () => insertMarkdown('*', '*', 'italic'), title: 'Italic' },
    {
      icon: Strikethrough,
      action: () => insertMarkdown('~~', '~~', 'strikethrough'),
      title: 'Strikethrough',
    },
    { icon: Code, action: () => insertMarkdown('`', '`', 'code'), title: 'Inline code' },
    null, // Separator
    { icon: Heading1, action: () => insertMarkdown('# ', '', 'Heading 1'), title: 'Heading 1' },
    { icon: Heading2, action: () => insertMarkdown('## ', '', 'Heading 2'), title: 'Heading 2' },
    { icon: Heading3, action: () => insertMarkdown('### ', '', 'Heading 3'), title: 'Heading 3' },
    null, // Separator
    { icon: List, action: () => insertMarkdown('- ', '', 'List item'), title: 'Bullet list' },
    {
      icon: ListOrdered,
      action: () => insertMarkdown('1. ', '', 'List item'),
      title: 'Numbered list',
    },
    { icon: Quote, action: () => insertMarkdown('> ', '', 'Quote'), title: 'Blockquote' },
    null, // Separator
    { icon: Link, action: () => insertMarkdown('[', '](url)', 'link text'), title: 'Link' },
    { icon: Image, action: () => insertMarkdown('![', '](url)', 'alt text'), title: 'Image' },
  ];

  return (
    <div className="border rounded-lg overflow-hidden">
      <Tabs value={tab} onValueChange={(v) => setTab(v as 'write' | 'preview')}>
        <div className="flex items-center justify-between border-b bg-muted/50 px-2">
          {/* Toolbar */}
          <div className="flex items-center gap-0.5 py-1 overflow-x-auto">
            {toolbarButtons.map((btn, idx) =>
              btn === null ? (
                <div key={`sep-${idx}`} className="w-px h-4 bg-border mx-1" />
              ) : (
                <Button
                  key={btn.title}
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={btn.action}
                  disabled={disabled || tab === 'preview'}
                  title={btn.title}
                >
                  <btn.icon className="h-4 w-4" />
                </Button>
              )
            )}
          </div>

          <TabsList className="h-8">
            <TabsTrigger value="write" className="text-xs px-3 h-6">
              Write
            </TabsTrigger>
            <TabsTrigger value="preview" className="text-xs px-3 h-6">
              Preview
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="write" className="m-0">
          <Textarea
            ref={textareaRef}
            value={markdown}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || 'Write your markdown here...'}
            disabled={disabled}
            className="border-0 rounded-none min-h-[200px] resize-y font-mono text-sm focus-visible:ring-0"
            rows={field.rows || 10}
          />
        </TabsContent>

        <TabsContent value="preview" className="m-0">
          <div
            className={cn(
              'min-h-[200px] p-4 prose prose-sm max-w-none dark:prose-invert',
              !markdown && 'text-muted-foreground'
            )}
            dangerouslySetInnerHTML={{
              __html: markdown ? markdownToHtml(markdown) : '<p>Nothing to preview</p>',
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
