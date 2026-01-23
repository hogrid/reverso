import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import type { FieldRendererProps } from './FieldRenderer';

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'jsx', label: 'JSX' },
  { value: 'tsx', label: 'TSX' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'python', label: 'Python' },
  { value: 'sql', label: 'SQL' },
  { value: 'bash', label: 'Bash' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'yaml', label: 'YAML' },
  { value: 'plaintext', label: 'Plain Text' },
];

interface CodeValue {
  code: string;
  language?: string;
}

export function CodeField({ field, value, onChange, disabled }: FieldRendererProps) {
  const [copied, setCopied] = useState(false);

  // Handle both string and object value formats
  const codeValue: CodeValue =
    typeof value === 'string'
      ? { code: value, language: 'plaintext' }
      : (value as CodeValue) || { code: '', language: 'plaintext' };

  const handleCodeChange = (code: string) => {
    onChange({ ...codeValue, code });
  };

  const handleLanguageChange = (language: string) => {
    onChange({ ...codeValue, language });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeValue.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  // Calculate line numbers
  const lineCount = (codeValue.code || '').split('\n').length;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-muted/50 px-3 py-2">
        <Select
          value={codeValue.language || 'plaintext'}
          onValueChange={handleLanguageChange}
          disabled={disabled}
        >
          <SelectTrigger className="w-[140px] h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((lang) => (
              <SelectItem key={lang.value} value={lang.value}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={handleCopy}
          disabled={!codeValue.code}
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 mr-1" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </>
          )}
        </Button>
      </div>

      {/* Code editor */}
      <div className="relative flex bg-[#1e1e1e]">
        {/* Line numbers */}
        <div className="flex-shrink-0 py-3 px-2 text-right text-muted-foreground/50 select-none font-mono text-sm border-r border-border/20 bg-muted/20">
          {lineNumbers.map((num) => (
            <div key={num} className="leading-6 h-6">
              {num}
            </div>
          ))}
        </div>

        {/* Code input */}
        <Textarea
          value={codeValue.code || ''}
          onChange={(e) => handleCodeChange(e.target.value)}
          placeholder={field.placeholder || '// Enter your code here...'}
          disabled={disabled}
          className={cn(
            'flex-1 min-h-[200px] resize-y font-mono text-sm leading-6',
            'bg-transparent text-gray-100 border-0 rounded-none',
            'focus-visible:ring-0 focus-visible:ring-offset-0',
            'py-3 px-4'
          )}
          rows={field.rows || 10}
          spellCheck={false}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
        <span>{lineCount} lines</span>
        <span>{(codeValue.code || '').length} characters</span>
      </div>
    </div>
  );
}
