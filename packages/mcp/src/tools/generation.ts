/**
 * Content generation and analysis tools for the MCP server.
 *
 * These tools provide AI-powered content suggestions and analysis.
 * They are designed to be helpful for content creation workflows.
 */

import type { DrizzleDatabase } from '@reverso/db';
import { z } from 'zod';
import type { ContentAnalysis } from '../types.js';

export const generationTools = {
  analyze_content: {
    description: 'Analyze content for quality, readability, and SEO',
    inputSchema: z.object({
      content: z.string().describe('Content to analyze'),
      type: z.enum(['text', 'html', 'markdown']).optional().describe('Content type'),
    }),
    handler: async (_db: DrizzleDatabase, input: { content: string; type?: string }): Promise<ContentAnalysis> => {
      const text = stripHtml(input.content);
      const words = text.split(/\s+/).filter(Boolean);
      const sentences = text.split(/[.!?]+/).filter(Boolean);
      const wordCount = words.length;

      // Calculate readability (simplified Flesch-Kincaid)
      const avgWordsPerSentence = sentences.length > 0 ? wordCount / sentences.length : 0;
      let readability: 'easy' | 'medium' | 'hard' = 'medium';
      if (avgWordsPerSentence < 12) readability = 'easy';
      else if (avgWordsPerSentence > 20) readability = 'hard';

      // Generate suggestions
      const suggestions: string[] = [];

      if (wordCount < 50) {
        suggestions.push('Content is quite short. Consider adding more detail.');
      }

      if (avgWordsPerSentence > 25) {
        suggestions.push('Sentences are long. Consider breaking them up for readability.');
      }

      if (!text.includes('.') && wordCount > 20) {
        suggestions.push('Add proper punctuation for better readability.');
      }

      // Check for common issues
      const consecutiveSpaces = /\s{2,}/.test(text);
      if (consecutiveSpaces) {
        suggestions.push('Remove extra whitespace between words.');
      }

      // SEO suggestions for longer content
      let seoScore: number | undefined;
      if (wordCount > 100) {
        seoScore = 50;

        // Check for headings (if HTML/markdown)
        if (input.type === 'html' || input.type === 'markdown') {
          const hasHeadings = /<h[1-6]|^#{1,6}\s/m.test(input.content);
          if (hasHeadings) {
            seoScore += 15;
          } else {
            suggestions.push('Consider adding headings to structure your content.');
          }
        }

        // Length bonus
        if (wordCount > 300) seoScore += 10;
        if (wordCount > 600) seoScore += 10;
        if (wordCount > 1000) seoScore += 10;

        // Readability bonus
        if (readability === 'easy') seoScore += 5;
      }

      return {
        wordCount,
        readability,
        suggestions,
        seoScore,
      };
    },
  },

  suggest_content_improvements: {
    description: 'Suggest improvements for content based on field type and context',
    inputSchema: z.object({
      content: z.string().describe('Current content'),
      fieldType: z.string().describe('Field type (e.g., "text", "textarea", "wysiwyg")'),
      fieldName: z.string().optional().describe('Field name for context'),
      maxLength: z.number().optional().describe('Maximum length constraint'),
    }),
    handler: async (
      _db: DrizzleDatabase,
      input: { content: string; fieldType: string; fieldName?: string; maxLength?: number }
    ) => {
      const suggestions: string[] = [];
      const content = input.content.trim();

      // Field-specific suggestions
      switch (input.fieldType) {
        case 'text':
          if (content.length > 60 && input.fieldName?.toLowerCase().includes('title')) {
            suggestions.push('Title is long. Consider shortening to under 60 characters for SEO.');
          }
          if (content.length < 3) {
            suggestions.push('Content seems very short. Add more descriptive text.');
          }
          break;

        case 'textarea':
        case 'wysiwyg':
        case 'markdown':
          if (content.length < 100) {
            suggestions.push('Consider expanding the content with more detail.');
          }
          if (content.length > 5000) {
            suggestions.push('Content is quite long. Consider breaking into sections.');
          }
          break;

        case 'email':
          if (!content.includes('@') || !content.includes('.')) {
            suggestions.push('This doesn\'t appear to be a valid email format.');
          }
          break;

        case 'url':
          if (!content.startsWith('http://') && !content.startsWith('https://')) {
            suggestions.push('URL should start with http:// or https://');
          }
          break;
      }

      // Max length check
      if (input.maxLength && content.length > input.maxLength) {
        suggestions.push(`Content exceeds maximum length of ${input.maxLength} characters.`);
      }

      // Common improvements
      if (content !== content.trim()) {
        suggestions.push('Remove leading/trailing whitespace.');
      }

      if (/\s{2,}/.test(content)) {
        suggestions.push('Remove extra spaces between words.');
      }

      return {
        original: content,
        suggestions,
        charCount: content.length,
        withinLimit: input.maxLength ? content.length <= input.maxLength : true,
      };
    },
  },

  generate_slug: {
    description: 'Generate a URL-friendly slug from text',
    inputSchema: z.object({
      text: z.string().describe('Text to convert to slug'),
      maxLength: z.number().optional().describe('Maximum slug length'),
    }),
    handler: async (_db: DrizzleDatabase, input: { text: string; maxLength?: number }) => {
      let slug = input.text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens
        .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

      if (input.maxLength && slug.length > input.maxLength) {
        slug = slug.substring(0, input.maxLength).replace(/-$/, '');
      }

      return { slug, original: input.text };
    },
  },

  generate_excerpt: {
    description: 'Generate an excerpt from longer content',
    inputSchema: z.object({
      content: z.string().describe('Full content'),
      maxLength: z.number().optional().describe('Maximum excerpt length (default: 160)'),
      preserveWords: z.boolean().optional().describe('Preserve whole words (default: true)'),
    }),
    handler: async (
      _db: DrizzleDatabase,
      input: { content: string; maxLength?: number; preserveWords?: boolean }
    ) => {
      const text = stripHtml(input.content).trim();
      const maxLength = input.maxLength ?? 160;
      const preserveWords = input.preserveWords ?? true;

      if (text.length <= maxLength) {
        return { excerpt: text, truncated: false };
      }

      let excerpt = text.substring(0, maxLength);

      if (preserveWords) {
        const lastSpace = excerpt.lastIndexOf(' ');
        if (lastSpace > maxLength * 0.7) {
          excerpt = excerpt.substring(0, lastSpace);
        }
      }

      excerpt = excerpt.trim() + '...';

      return { excerpt, truncated: true, originalLength: text.length };
    },
  },

  count_words: {
    description: 'Count words in content',
    inputSchema: z.object({
      content: z.string().describe('Content to count'),
    }),
    handler: async (_db: DrizzleDatabase, input: { content: string }) => {
      const text = stripHtml(input.content);
      const words = text.split(/\s+/).filter(Boolean);
      const sentences = text.split(/[.!?]+/).filter(Boolean);
      const paragraphs = text.split(/\n\n+/).filter(Boolean);

      return {
        words: words.length,
        characters: text.length,
        charactersNoSpaces: text.replace(/\s/g, '').length,
        sentences: sentences.length,
        paragraphs: paragraphs.length,
        avgWordsPerSentence: sentences.length > 0 ? Math.round(words.length / sentences.length) : 0,
      };
    },
  },
};

/**
 * Strip HTML tags from content.
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
