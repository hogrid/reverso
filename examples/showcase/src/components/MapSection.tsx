import { reverso } from '@/lib/reverso';

/**
 * Geo family field type.
 * Covers: map.
 */
export async function MapSection() {
  const page = await reverso.getPage('showcase');

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="mb-6 text-2xl font-bold">Map field</h2>

      <div>
        <dt className="text-sm font-medium text-slate-500">Location (map)</dt>
        <dd
          data-reverso="showcase.map.location"
          data-reverso-type="map"
          data-reverso-label="Location"
          data-reverso-help="Latitude/longitude coordinates."
          className="mt-1 font-mono text-sm"
        >
          {page.get('showcase.map.location', '37.7749,-122.4194')}
        </dd>
      </div>
    </section>
  );
}
