import { reverso } from '@/lib/reverso';

const FALLBACK_GALLERY = [
  { url: '/placeholder.svg', alt: 'Gallery item 1' },
  { url: '/placeholder.svg', alt: 'Gallery item 2' },
  { url: '/placeholder.svg', alt: 'Gallery item 3' },
];

/**
 * Media family field types.
 * Covers: image, gallery, file, video, color.
 *
 * Media values are stored as objects ({ url, alt, ... }). `page.image()`,
 * `page.images()` and `page.file()` return them typed; `page.get()` with a
 * string fallback returns just the URL.
 */
export async function MediaSection() {
  const page = await reverso.getPage('showcase');
  const brandColor = page.get('showcase.media.brandColor', '#2563eb');
  const cover = page.image('showcase.media.cover') ?? { url: '/placeholder.svg', alt: 'Cover' };
  const gallery = page.images('showcase.media.gallery', FALLBACK_GALLERY);
  const attachment = page.file('showcase.media.attachment') ?? { url: '#', filename: 'placeholder.pdf' };
  const promo = page.file('showcase.media.promo');

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="mb-6 text-2xl font-bold">Media fields</h2>

      <div className="space-y-8">
        <div>
          <h3 className="mb-2 text-sm font-medium text-slate-500">Cover (image)</h3>
          <img
            data-reverso="showcase.media.cover"
            data-reverso-type="image"
            data-reverso-label="Cover image"
            src={cover.url}
            alt={cover.alt ?? 'Cover'}
            className="h-48 w-full rounded-lg object-cover"
          />
        </div>

        <div>
          <h3 className="mb-2 text-sm font-medium text-slate-500">Gallery</h3>
          <div
            data-reverso="showcase.media.gallery"
            data-reverso-type="gallery"
            data-reverso-label="Image gallery"
            className="grid grid-cols-3 gap-3"
          >
            {gallery.map((image, index) => (
              <img
                key={`${image.url}-${index}`}
                src={image.url}
                alt={image.alt ?? `Gallery item ${index + 1}`}
                className="h-24 w-full rounded object-cover"
              />
            ))}
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-medium text-slate-500">Attachment (file)</h3>
            <a
              data-reverso="showcase.media.attachment"
              data-reverso-type="file"
              data-reverso-label="Attachment"
              href={attachment.url}
              className="text-blue-600 hover:underline"
            >
              Download {attachment.filename ?? 'attachment'}
            </a>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium text-slate-500">Brand color</h3>
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="inline-block h-8 w-8 rounded-full border border-slate-200"
                style={{ backgroundColor: brandColor }}
              />
              <span
                data-reverso="showcase.media.brandColor"
                data-reverso-type="color"
                data-reverso-label="Brand color"
              >
                {brandColor}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-medium text-slate-500">Promo (video)</h3>
          {/* Stored as { url, filename, ... }; page.file() returns null until a video is chosen. */}
          {promo ? (
            <video
              data-reverso="showcase.media.promo"
              data-reverso-type="video"
              data-reverso-label="Promo video"
              src={promo.url}
              controls
              className="w-full rounded-lg bg-slate-900"
            />
          ) : (
            <div
              data-reverso="showcase.media.promo"
              data-reverso-type="video"
              data-reverso-label="Promo video"
              className="flex h-40 w-full items-center justify-center rounded-lg bg-slate-900 text-sm text-slate-400"
            >
              No promo video selected yet
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
