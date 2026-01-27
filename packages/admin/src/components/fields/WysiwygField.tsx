import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cn, sanitizeHtml } from '@/lib/utils';
import { Bold, Code, Italic, List, ListOrdered, Quote, Underline } from 'lucide-react';
import { useCallback, useState } from 'react';
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

  // Execute formatting command
  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
  }, []);

  // Handle content changes from contenteditable
  const handleInput = useCallback(
    (e: React.FormEvent<HTMLDivElement>) => {
      const content = e.currentTarget.innerHTML;
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
                  key={action.command}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
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
          <div
            id={field.path}
            contentEditable={!disabled}
            className={cn(
              'min-h-[200px] p-4 prose prose-sm max-w-none focus:outline-none',
              disabled && 'bg-muted cursor-not-allowed'
            )}
            onInput={handleInput}
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(htmlValue) }}
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
