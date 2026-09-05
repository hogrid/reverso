import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cn, sanitizeHtml } from '@/lib/utils';
import { Bold, Code, Italic, List, ListOrdered, Quote, Underline } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FieldRendererProps } from './FieldRenderer';

// Simple WYSIWYG toolbar actions
const toolbarActions = [
  { icon: Bold, command: 'bold', label: 'Bold' },
  { icon: Italic, command: 'italic', label: 'Italic' },
  { icon: Underline, command: 'underline', label: 'Underline' },
  { icon: List, command: 'insertUnorderedList', label: 'Bullet List' },
  { icon: ListOrdered, command: 'insertOrderedList', label: 'Numbered List' },
  { icon: Quote, command: 'formatBlock', value: 'blockquote', label: 'Quote' },
  { icon: Code, command: 'formatBlock', value: 'pre', label: 'Code Block' },
];

export function WysiwygField({ field, value, onChange, disabled }: FieldRendererProps) {
  const htmlValue = String(value ?? '');
  const [mode, setMode] = useState<'visual' | 'html'>('visual');
  const editorRef = useRef<HTMLDivElement | null>(null);
  // HTML we last pushed to the parent; used to tell our own edits apart from
  // external changes (undo/redo, HTML tab, reload) so typing never resets the
  // caret by re-rendering the contenteditable's innerHTML.
  const lastEmitted = useRef<string | null>(null);
  // Current value, readable from the mount callback without making that
  // callback change identity (which would detach and re-attach the node).
  const htmlValueRef = useRef(htmlValue);
  htmlValueRef.current = htmlValue;

  // Switching to the HTML tab unmounts this pane, and switching back mounts a
  // brand-new, empty div. Painting it here rather than in the effect below is
  // what keeps the editor from coming back blank: the effect skips values it
  // believes are already on screen, which is true of the old node only.
  const attachEditor = useCallback((el: HTMLDivElement | null) => {
    editorRef.current = el;
    if (!el) return;
    const current = htmlValueRef.current;
    el.innerHTML = sanitizeHtml(current);
    lastEmitted.current = current;
  }, []);

  useEffect(() => {
    if (mode !== 'visual') return;
    const el = editorRef.current;
    if (!el) return;
    if (htmlValue === lastEmitted.current) return;
    const next = sanitizeHtml(htmlValue);
    if (el.innerHTML !== next) {
      el.innerHTML = next;
    }
    lastEmitted.current = htmlValue;
  }, [htmlValue, mode]);

  // Execute formatting command
  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    const el = editorRef.current;
    if (el) {
      lastEmitted.current = el.innerHTML;
      onChange(el.innerHTML);
    }
  }, [onChange]);

  // Handle content changes from contenteditable
  const handleInput = useCallback(
    (e: React.FormEvent<HTMLDivElement>) => {
      const content = e.currentTarget.innerHTML;
      lastEmitted.current = content;
      onChange(content);
    },
    [onChange]
  );

  // Handle HTML textarea changes
  const handleHtmlChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  return (
    <div className="border rounded-md overflow-hidden">
      {/* Mode tabs */}
      <Tabs value={mode} onValueChange={(v) => setMode(v as 'visual' | 'html')}>
        <div className="flex items-center justify-between border-b bg-muted/50 px-2">
          {/* Toolbar */}
          {mode === 'visual' && (
            <div className="flex items-center gap-1 py-1">
              {toolbarActions.map((action) => (
                <Button
                  key={action.command + (action.value ?? '')}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => execCommand(action.command, action.value)}
                  disabled={disabled}
                  title={action.label}
                >
                  <action.icon className="h-4 w-4" />
                </Button>
              ))}
            </div>
          )}
          {mode === 'html' && <div />}

          {/* Mode switcher */}
          <TabsList className="h-8">
            <TabsTrigger value="visual" className="text-xs px-2 py-1">
              Visual
            </TabsTrigger>
            <TabsTrigger value="html" className="text-xs px-2 py-1">
              HTML
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Content area */}
        <TabsContent value="visual" className="m-0">
          {/* The HTML is set imperatively (see effect above); React never
              re-renders the children, so the caret stays where the user is. */}
          <div
            ref={attachEditor}
            id={field.path}
            role="textbox"
            aria-multiline="true"
            aria-label={field.label || field.path}
            contentEditable={!disabled}
            tabIndex={0}
            suppressContentEditableWarning
            className={cn(
              'min-h-[200px] p-4 prose prose-sm max-w-none focus:outline-none',
              disabled && 'bg-muted cursor-not-allowed'
            )}
            onInput={handleInput}
          />
        </TabsContent>

        <TabsContent value="html" className="m-0">
          <Textarea
            value={htmlValue}
            onChange={handleHtmlChange}
            disabled={disabled}
            rows={10}
            className="border-0 rounded-none font-mono text-sm resize-none focus-visible:ring-0"
            placeholder="<p>Enter HTML content...</p>"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
