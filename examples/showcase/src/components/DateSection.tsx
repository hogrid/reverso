import { reverso } from '@/lib/reverso';

/**
 * Date and time family field types.
 * Covers: date, datetime, time.
 */
export async function DateSection() {
  const page = await reverso.getPage('showcase');

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="mb-6 text-2xl font-bold">Date &amp; time fields</h2>

      <dl className="grid gap-4 sm:grid-cols-3">
        <div>
          <dt className="text-sm font-medium text-slate-500">Published (date)</dt>
          <dd
            data-reverso="showcase.date.publishedAt"
            data-reverso-type="date"
            data-reverso-label="Published at"
          >
            {page.get('showcase.date.publishedAt', '2026-06-10')}
          </dd>
        </div>

        <div>
          <dt className="text-sm font-medium text-slate-500">Event start (datetime)</dt>
          <dd
            data-reverso="showcase.date.eventStart"
            data-reverso-type="datetime"
            data-reverso-label="Event start"
          >
            {page.get('showcase.date.eventStart', '2026-06-10T18:30')}
          </dd>
        </div>

        <div>
          <dt className="text-sm font-medium text-slate-500">Opening time (time)</dt>
          <dd
            data-reverso="showcase.date.openingTime"
            data-reverso-type="time"
            data-reverso-label="Opening time"
          >
            {page.get('showcase.date.openingTime', '09:00')}
          </dd>
        </div>
      </dl>
    </section>
  );
}
