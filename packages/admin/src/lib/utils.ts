import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge class names with Tailwind CSS support
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a field path into a human-readable label
 * e.g., "home.hero.title" -> "Title"
 */
export function formatLabel(path: string): string {
  const parts = path.split('.');
  const lastPart = parts[parts.length - 1] ?? path;
  // Handle repeater placeholders
  const cleanPart = lastPart.replace(/\$/g, '');
  // Convert camelCase/snake_case to Title Case
  return cleanPart
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());
}

/**
 * Generate a unique ID for form fields
 */
export function generateFieldId(path: string): string {
  return `field-${path.replace(/\./g, '-').replace(/\$/g, 'item')}`;
}

/**
 * Debounce function for autosave
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
}

/**
 * Check if file is an image
 */
export function isImageFile(filename: string): boolean {
  const ext = getFileExtension(filename).toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'].includes(ext);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

/**
 * Basic HTML sanitization to prevent XSS attacks.
 * Removes script tags, event handlers, and dangerous attributes.
 * For production, consider using DOMPurify.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';

  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove event handlers (onclick, onerror, onload, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]+/gi, '');

  // Remove javascript: URLs
  sanitized = sanitized.replace(/javascript\s*:/gi, '');

  // Remove data: URLs in src/href (potential XSS vector)
  sanitized = sanitized.replace(/(src|href)\s*=\s*["']?\s*data:/gi, '$1="');

  // Remove style attributes with expression() (IE XSS vector)
  sanitized = sanitized.replace(/style\s*=\s*["'][^"']*expression\s*\([^)]*\)[^"']*["']/gi, '');

  return sanitized;
}

/**
 * Parse options string into array of { value, label } objects
 * Supports formats:
 * - "a,b,c" -> [{ value: 'a', label: 'A' }, ...]
 * - "a:Label A,b:Label B" -> [{ value: 'a', label: 'Label A' }, ...]
 * - JSON array: '[{"value":"a","label":"A"}]'
 */
export function parseOptions(optionsStr: string): Array<{ value: string; label: string }> {
  if (!optionsStr) return [];

  // Try parsing as JSON first
  try {
    const parsed = JSON.parse(optionsStr);
    if (Array.isArray(parsed)) {
      return parsed.map((opt) => {
        if (typeof opt === 'string') {
          return { value: opt, label: formatLabel(opt) };
        }
        return { value: String(opt.value), label: opt.label || String(opt.value) };
      });
    }
  } catch {
    // Not JSON, parse as comma-separated
  }

  // Parse comma-separated format
  return optionsStr.split(',').map((item) => {
    const trimmed = item.trim();
    if (trimmed.includes(':')) {
      const [value = '', label = ''] = trimmed.split(':');
      return { value: value.trim(), label: label.trim() || formatLabel(value.trim()) };
    }
    return { value: trimmed, label: formatLabel(trimmed) };
  });
}
