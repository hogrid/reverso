import { reverso } from '@/lib/reverso';

const FALLBACK_SOCIAL = [{ icon: 'Twitter', url: '#' }];
const FALLBACK_QUICK_LINKS = [{ label: 'About Us', url: '#' }];
const FALLBACK_CATEGORIES = [{ label: 'Technology', url: '#' }];

/**
 * Site footer with links and copyright.
 * Link lists come from the `site.social`, `site.quickLinks` and
 * `site.categories` repeaters.
 */
export async function Footer() {
  const site = await reverso.getPage('site');
  const socialLinks = site.items('site.social', FALLBACK_SOCIAL);
  const quickLinks = site.items('site.quickLinks', FALLBACK_QUICK_LINKS);
  const categories = site.items('site.categories', FALLBACK_CATEGORIES);

  return (
    <footer className="bg-slate-900 text-white py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* About */}
          <div className="md:col-span-2">
            <span
              data-reverso="site.footer.siteName"
              data-reverso-type="text"
              className="text-xl font-bold mb-4 block"
            >
              {site.get('site.footer.siteName', 'TechBlog')}
            </span>
            <p
              data-reverso="site.footer.description"
              data-reverso-type="textarea"
              className="text-slate-400 mb-4"
            >
              {site.get(
                'site.footer.description',
                'Your source for the latest in technology, web development, and digital innovation. We share insights, tutorials, and stories that matter.'
              )}
            </p>
            {/* Social Links (site.social repeater) */}
            <div className="flex gap-4">
              {socialLinks.map((link, index) => (
                <a
                  key={`${link.icon ?? 'social'}-${index}`}
                  data-reverso="site.social.$.url"
                  data-reverso-type="url"
                  href={String(link.url ?? '#')}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <span data-reverso="site.social.$.icon" data-reverso-type="text">
                    {String(link.icon ?? '')}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3
              data-reverso="site.footer.quickLinksTitle"
              data-reverso-type="text"
              className="font-semibold mb-4"
            >
              {site.get('site.footer.quickLinksTitle', 'Quick Links')}
            </h3>
            <div className="space-y-2">
              {quickLinks.map((link, index) => (
                <a
                  key={`${link.label ?? 'link'}-${index}`}
                  data-reverso="site.quickLinks.$.label"
                  data-reverso-type="text"
                  href={String(link.url ?? '#')}
                  className="text-slate-400 hover:text-white transition-colors block"
                >
                  {String(link.label ?? '')}
                </a>
              ))}
              <span data-reverso="site.quickLinks.$.url" data-reverso-type="url" hidden />
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3
              data-reverso="site.footer.categoriesTitle"
              data-reverso-type="text"
              className="font-semibold mb-4"
            >
              {site.get('site.footer.categoriesTitle', 'Categories')}
            </h3>
            <div className="space-y-2">
              {categories.map((category, index) => (
                <a
                  key={`${category.label ?? 'category'}-${index}`}
                  data-reverso="site.categories.$.label"
                  data-reverso-type="text"
                  href={String(category.url ?? '#')}
                  className="text-slate-400 hover:text-white transition-colors block"
                >
                  {String(category.label ?? '')}
                </a>
              ))}
              <span data-reverso="site.categories.$.url" data-reverso-type="url" hidden />
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-slate-800 pt-8 text-center text-slate-400">
          <p data-reverso="site.footer.copyright" data-reverso-type="text">
            {site.get('site.footer.copyright', '2026 TechBlog. All rights reserved.')}
          </p>
        </div>
      </div>
    </footer>
  );
}
