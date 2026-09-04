import { reverso } from '@/lib/reverso';
import { sanitizeCmsHtml } from '@/lib/sanitize';

const FALLBACK_ARTICLE = `
  <p>This <strong>WYSIWYG</strong> field renders sanitized HTML. You can use headings, lists and links.</p>
  <h2>Rich content</h2>
  <p>Edited through a rich-text editor in the Reverso admin and sanitized before render.</p>
`;

const FALLBACK_DOCS = `## Markdown docs

This field stores raw **Markdown**. It is shown verbatim here, but a consumer can
render it with any Markdown engine.

- Item one
- Item two`;

const FALLBACK_SNIPPET = `export function greet(name: string) {
  return \`Hello, \${name}!\`;
}`;

/**
 * Rich content family field types.
 * Covers: wysiwyg, markdown, code.
 */
export async function RichSection() {
  const page = await reverso.getPage('showcase');

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="mb-6 text-2xl font-bold">Rich content fields</h2>

      <div className="space-y-8">
        <div>
          <h3 className="mb-2 text-sm font-medium text-slate-500">WYSIWYG (HTML)</h3>
          <div
            data-reverso="showcase.rich.article"
            data-reverso-type="wysiwyg"
            data-reverso-label="Article body"
            className="prose max-w-none"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: CMS HTML sanitized with sanitize-html
            dangerouslySetInnerHTML={{
              __html: sanitizeCmsHtml(page.get('showcase.rich.article', FALLBACK_ARTICLE)),
            }}
          />
        </div>

        <div>
          <h3 className="mb-2 text-sm font-medium text-slate-500">Markdown</h3>
          <pre
            data-reverso="showcase.rich.docs"
            data-reverso-type="markdown"
            data-reverso-label="Documentation (Markdown)"
            className="whitespace-pre-wrap rounded-lg bg-slate-100 p-4 text-sm"
          >
            {page.get('showcase.rich.docs', FALLBACK_DOCS)}
          </pre>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-medium text-slate-500">Code</h3>
          <pre
            data-reverso="showcase.rich.snippet"
            data-reverso-type="code"
            data-reverso-label="Code snippet"
            className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-100"
          >
            {/* Stored as { code, language }; page.get() with a string fallback returns the source. */}
            <code>{page.get('showcase.rich.snippet', FALLBACK_SNIPPET)}</code>
          </pre>
        </div>
      </div>
    </section>
  );
}
