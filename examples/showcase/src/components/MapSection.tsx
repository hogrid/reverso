import { reverso } from '@/lib/reverso';

/**
 * Geo family field type.
 * Covers: map.
 */
export async function MapSection() {
  const page = await reverso.getPage('showcase');
  // Stored as { lat, lng, zoom?, address? }; page.map() returns it typed.
  const location = page.map('showcase.map.location') ?? { lat: 37.7749, lng: -122.4194 };

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
          {location.lat.toFixed(4)},{location.lng.toFixed(4)}
          {location.address ? ` (${location.address})` : ''}
        </dd>
        <a
          className="mt-2 inline-block text-sm text-blue-600 hover:underline"
          href={`https://www.openstreetmap.org/?mlat=${location.lat}&mlon=${location.lng}#map=${location.zoom ?? 13}/${location.lat}/${location.lng}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open in OpenStreetMap
        </a>
      </div>
    </section>
  );
}
