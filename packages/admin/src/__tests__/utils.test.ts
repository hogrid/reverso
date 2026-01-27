/**
 * Unit tests for admin utility functions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  cn,
  formatLabel,
  generateFieldId,
  debounce,
  formatFileSize,
  getFileExtension,
  isImageFile,
  truncate,
  sanitizeHtml,
  parseOptions,
} from '../lib/utils';

describe('cn', () => {
  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('should merge Tailwind classes correctly', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('should handle arrays', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
  });

  it('should handle objects', () => {
    expect(cn({ foo: true, bar: false })).toBe('foo');
  });
});

describe('formatLabel', () => {
  it('should extract and format the last part of a path', () => {
    expect(formatLabel('home.hero.title')).toBe('Title');
    expect(formatLabel('about.content')).toBe('Content');
  });

  it('should handle camelCase', () => {
    expect(formatLabel('home.hero.heroImage')).toBe('Hero Image');
    expect(formatLabel('home.hero.ctaButton')).toBe('Cta Button');
  });

  it('should handle snake_case', () => {
    expect(formatLabel('home.hero.hero_image')).toBe('Hero image');
    expect(formatLabel('home.hero.cta_button')).toBe('Cta button');
  });

  it('should remove repeater placeholders', () => {
    expect(formatLabel('home.posts.$.title')).toBe('Title');
    expect(formatLabel('posts.$')).toBe('');
  });

  it('should handle single segment paths', () => {
    expect(formatLabel('title')).toBe('Title');
  });
});

describe('generateFieldId', () => {
  it('should convert path to valid ID', () => {
    expect(generateFieldId('home.hero.title')).toBe('field-home-hero-title');
  });

  it('should replace repeater placeholders', () => {
    expect(generateFieldId('home.posts.$.title')).toBe('field-home-posts-item-title');
  });
});

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should debounce function calls', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn();
    debouncedFn();
    debouncedFn();

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should pass arguments to the debounced function', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn('arg1', 'arg2');

    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
  });

  it('should reset timer on subsequent calls', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn();
    vi.advanceTimersByTime(50);
    debouncedFn();
    vi.advanceTimersByTime(50);

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);

    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('formatFileSize', () => {
  it('should format bytes', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
    expect(formatFileSize(500)).toBe('500 Bytes');
  });

  it('should format kilobytes', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
  });

  it('should format megabytes', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1 MB');
    expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1.5 MB');
  });

  it('should format gigabytes', () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
  });
});

describe('getFileExtension', () => {
  it('should extract file extension', () => {
    expect(getFileExtension('image.png')).toBe('png');
    expect(getFileExtension('document.pdf')).toBe('pdf');
    expect(getFileExtension('file.tar.gz')).toBe('gz');
  });

  it('should handle files without extension', () => {
    expect(getFileExtension('README')).toBe('');
  });

  it('should handle hidden files', () => {
    // Hidden files starting with . return empty extension
    expect(getFileExtension('.gitignore')).toBe('');
    expect(getFileExtension('.bashrc')).toBe('');
    // Hidden files with extension return the extension
    expect(getFileExtension('.env.local')).toBe('local');
  });
});

describe('isImageFile', () => {
  it('should return true for image extensions', () => {
    expect(isImageFile('photo.jpg')).toBe(true);
    expect(isImageFile('photo.jpeg')).toBe(true);
    expect(isImageFile('photo.png')).toBe(true);
    expect(isImageFile('photo.gif')).toBe(true);
    expect(isImageFile('photo.webp')).toBe(true);
    expect(isImageFile('photo.svg')).toBe(true);
    expect(isImageFile('photo.avif')).toBe(true);
  });

  it('should return false for non-image extensions', () => {
    expect(isImageFile('document.pdf')).toBe(false);
    expect(isImageFile('video.mp4')).toBe(false);
    expect(isImageFile('audio.mp3')).toBe(false);
    expect(isImageFile('data.json')).toBe(false);
  });

  it('should be case-insensitive', () => {
    expect(isImageFile('photo.PNG')).toBe(true);
    expect(isImageFile('photo.JPG')).toBe(true);
    expect(isImageFile('photo.WEBP')).toBe(true);
  });
});

describe('truncate', () => {
  it('should truncate long text', () => {
    expect(truncate('Hello World', 8)).toBe('Hello...');
    expect(truncate('This is a very long text', 15)).toBe('This is a ve...');
  });

  it('should not truncate short text', () => {
    expect(truncate('Hello', 10)).toBe('Hello');
    expect(truncate('Hi', 2)).toBe('Hi');
  });

  it('should handle edge cases', () => {
    expect(truncate('', 5)).toBe('');
    expect(truncate('ABC', 3)).toBe('ABC');
  });
});

describe('sanitizeHtml', () => {
  it('should return empty string for falsy input', () => {
    expect(sanitizeHtml('')).toBe('');
    expect(sanitizeHtml(null as unknown as string)).toBe('');
    expect(sanitizeHtml(undefined as unknown as string)).toBe('');
  });

  it('should remove script tags', () => {
    expect(sanitizeHtml('<script>alert("xss")</script>')).toBe('');
    expect(sanitizeHtml('<p>Hello</p><script>evil()</script><p>World</p>')).toBe('<p>Hello</p><p>World</p>');
  });

  it('should remove event handlers', () => {
    expect(sanitizeHtml('<img src="x" onerror="alert(1)">')).toBe('<img src="x">');
    expect(sanitizeHtml('<div onclick="evil()">Click</div>')).toBe('<div>Click</div>');
    expect(sanitizeHtml('<a onmouseover="evil()">Link</a>')).toBe('<a>Link</a>');
  });

  it('should remove javascript: URLs', () => {
    expect(sanitizeHtml('<a href="javascript:alert(1)">Click</a>')).toBe('<a href="alert(1)">Click</a>');
  });

  it('should remove data: URLs in src/href', () => {
    expect(sanitizeHtml('<img src="data:image/png;base64,...">')).toContain('src="');
    expect(sanitizeHtml('<a href="data:text/html,<script>alert(1)</script>">Link</a>')).toContain('href="');
  });

  it('should preserve safe HTML', () => {
    const safeHtml = '<p>Hello <strong>World</strong></p>';
    expect(sanitizeHtml(safeHtml)).toBe(safeHtml);
  });

  it('should preserve links with safe URLs', () => {
    const safeLink = '<a href="https://example.com">Link</a>';
    expect(sanitizeHtml(safeLink)).toBe(safeLink);
  });
});

describe('parseOptions', () => {
  it('should return empty array for empty input', () => {
    expect(parseOptions('')).toEqual([]);
    expect(parseOptions(null as unknown as string)).toEqual([]);
  });

  it('should parse simple comma-separated values', () => {
    const result = parseOptions('a,b,c');
    expect(result).toEqual([
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
      { value: 'c', label: 'C' },
    ]);
  });

  it('should parse value:label format', () => {
    const result = parseOptions('a:Label A,b:Label B');
    expect(result).toEqual([
      { value: 'a', label: 'Label A' },
      { value: 'b', label: 'Label B' },
    ]);
  });

  it('should parse JSON array format', () => {
    const result = parseOptions('[{"value":"a","label":"Label A"},{"value":"b","label":"Label B"}]');
    expect(result).toEqual([
      { value: 'a', label: 'Label A' },
      { value: 'b', label: 'Label B' },
    ]);
  });

  it('should handle JSON array of strings', () => {
    const result = parseOptions('["a","b","c"]');
    expect(result).toEqual([
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
      { value: 'c', label: 'C' },
    ]);
  });

  it('should trim whitespace', () => {
    const result = parseOptions(' a , b , c ');
    expect(result).toEqual([
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
      { value: 'c', label: 'C' },
    ]);
  });

  it('should handle camelCase values', () => {
    const result = parseOptions('firstName,lastName,emailAddress');
    expect(result).toEqual([
      { value: 'firstName', label: 'First Name' },
      { value: 'lastName', label: 'Last Name' },
      { value: 'emailAddress', label: 'Email Address' },
    ]);
  });
});
