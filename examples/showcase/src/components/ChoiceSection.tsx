import { reverso } from '@/lib/reverso';

function toList(value: string[] | string): string[] {
  if (Array.isArray(value)) return value;
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Choice family field types.
 * Covers: select, multiselect, boolean, radio, checkboxgroup.
 */
export async function ChoiceSection() {
  const page = await reverso.getPage('showcase');

  const tags = toList(page.get<string[] | string>('showcase.choice.tags', ['react', 'svelte']));
  const perks = toList(
    page.get<string[] | string>('showcase.choice.perks', ['support', 'updates'])
  );
  const featured = page.get<boolean | string>('showcase.choice.featured', true);
  const isFeatured = featured === true || featured === 'true';

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="mb-6 text-2xl font-bold">Choice fields</h2>

      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm font-medium text-slate-500">Category (select)</dt>
          <dd
            data-reverso="showcase.choice.category"
            data-reverso-type="select"
            data-reverso-label="Category"
            data-reverso-options="news,tutorial,review,opinion"
          >
            {page.get('showcase.choice.category', 'tutorial')}
          </dd>
        </div>

        <div>
          <dt className="text-sm font-medium text-slate-500">Plan (radio)</dt>
          <dd
            data-reverso="showcase.choice.plan"
            data-reverso-type="radio"
            data-reverso-label="Plan"
            data-reverso-options="free,pro,enterprise"
          >
            {page.get('showcase.choice.plan', 'pro')}
          </dd>
        </div>

        <div>
          <dt className="text-sm font-medium text-slate-500">Featured (boolean)</dt>
          <dd
            data-reverso="showcase.choice.featured"
            data-reverso-type="boolean"
            data-reverso-label="Featured"
          >
            {isFeatured ? 'Yes' : 'No'}
          </dd>
        </div>

        <div>
          <dt className="text-sm font-medium text-slate-500">Tags (multiselect)</dt>
          <dd
            data-reverso="showcase.choice.tags"
            data-reverso-type="multiselect"
            data-reverso-label="Tags"
            data-reverso-options="react,vue,svelte,angular"
            className="flex flex-wrap gap-2"
          >
            {tags.map((tag) => (
              <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-sm">
                {tag}
              </span>
            ))}
          </dd>
        </div>

        <div className="sm:col-span-2">
          <dt className="text-sm font-medium text-slate-500">Perks (checkbox group)</dt>
          <dd
            data-reverso="showcase.choice.perks"
            data-reverso-type="checkboxgroup"
            data-reverso-label="Perks"
            data-reverso-options="support,updates,training"
            className="flex flex-wrap gap-2"
          >
            {perks.map((perk) => (
              <span
                key={perk}
                className="rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-700"
              >
                {perk}
              </span>
            ))}
          </dd>
        </div>
      </dl>
    </section>
  );
}
