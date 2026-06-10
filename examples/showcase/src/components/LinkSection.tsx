import { reverso } from '@/lib/reverso';

/**
 * Reference family field types.
 * Covers: link, relation.
 */
export async function LinkSection() {
  const page = await reverso.getPage('showcase');

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="mb-6 text-2xl font-bold">Link &amp; relation fields</h2>

      <div className="flex flex-wrap items-center gap-6">
        <a
          data-reverso="showcase.link.cta"
          data-reverso-type="link"
          data-reverso-label="Call to action"
          href={page.get('showcase.link.cta', 'https://reverso.dev')}
          className="inline-block rounded-full bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-slate-700"
        >
          {page.get('showcase.link.cta', 'Visit Reverso')}
        </a>

        <div>
          <dt className="text-sm font-medium text-slate-500">Related entry (relation)</dt>
          <dd
            data-reverso="showcase.link.related"
            data-reverso-type="relation"
            data-reverso-label="Related entry"
            data-reverso-help="References another content entry."
          >
            {page.get('showcase.link.related', 'getting-started')}
          </dd>
        </div>
      </div>
    </section>
  );
}
