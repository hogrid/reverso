import { reverso } from '@/lib/reverso';

/**
 * Plain-text family field types.
 * Covers: text, textarea, email, phone, url, number, range.
 */
export async function TextSection() {
  const page = await reverso.getPage('showcase');

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="mb-6 text-2xl font-bold">Text fields</h2>

      <div className="space-y-4">
        <h3
          data-reverso="showcase.text.heading"
          data-reverso-type="text"
          data-reverso-label="Heading"
          data-reverso-required="true"
          data-reverso-placeholder="Section heading"
          className="text-3xl font-semibold"
        >
          {page.get('showcase.text.heading', 'A simple text heading')}
        </h3>

        <p
          data-reverso="showcase.text.intro"
          data-reverso-type="textarea"
          data-reverso-label="Intro paragraph"
          data-reverso-help="A short multi-line introduction."
          className="text-slate-600"
        >
          {page.get(
            'showcase.text.intro',
            'This intro is a multi-line textarea field. It can span several sentences and is edited as plain text.'
          )}
        </p>

        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-slate-500">Email</dt>
            <dd
              data-reverso="showcase.text.email"
              data-reverso-type="email"
              data-reverso-label="Contact email"
              data-reverso-placeholder="hello@example.com"
            >
              {page.get('showcase.text.email', 'hello@example.com')}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">Phone</dt>
            <dd
              data-reverso="showcase.text.phone"
              data-reverso-type="phone"
              data-reverso-label="Contact phone"
            >
              {page.get('showcase.text.phone', '+1 (555) 010-0199')}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">Website</dt>
            <dd
              data-reverso="showcase.text.website"
              data-reverso-type="url"
              data-reverso-label="Website URL"
            >
              {page.get('showcase.text.website', 'https://reverso.dev')}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">Price</dt>
            <dd
              data-reverso="showcase.text.price"
              data-reverso-type="number"
              data-reverso-label="Price"
              data-reverso-help="Numeric value only."
            >
              {page.get('showcase.text.price', '49')}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">Rating</dt>
            <dd
              data-reverso="showcase.text.rating"
              data-reverso-type="range"
              data-reverso-label="Rating"
              data-reverso-help="Slider value from 0 to 10."
            >
              {page.get('showcase.text.rating', '8')}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
