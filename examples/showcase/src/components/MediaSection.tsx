import { reverso } from '@/lib/reverso';

/**
 * Media family field types.
 * Covers: image, gallery, file, video, color.
 */
export async function MediaSection() {
  const page = await reverso.getPage('showcase');
  const brandColor = page.get('showcase.media.brandColor', '#2563eb');

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
            src={page.get('showcase.media.cover', '/placeholder.jpg')}
            alt="Cover"
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
            <img src="/placeholder.jpg" alt="Gallery item 1" className="h-24 w-full rounded object-cover" />
            <img src="/placeholder.jpg" alt="Gallery item 2" className="h-24 w-full rounded object-cover" />
            <img src="/placeholder.jpg" alt="Gallery item 3" className="h-24 w-full rounded object-cover" />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-medium text-slate-500">Attachment (file)</h3>
            <a
              data-reverso="showcase.media.attachment"
              data-reverso-type="file"
              data-reverso-label="Attachment"
              href={page.get('showcase.media.attachment', '/placeholder.pdf')}
              className="text-blue-600 hover:underline"
            >
              Download attachment
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
          <video
            data-reverso="showcase.media.promo"
            data-reverso-type="video"
            data-reverso-label="Promo video"
            src={page.get('showcase.media.promo', '/placeholder.mp4')}
            controls
            className="w-full rounded-lg bg-slate-900"
          />
        </div>
      </div>
    </section>
  );
}
