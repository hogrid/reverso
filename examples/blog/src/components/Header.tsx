import { reverso } from '@/lib/reverso';

const FALLBACK_NAV = [{ label: 'Home', url: '/' }];

/**
 * Site header with navigation.
 * Navigation links come from the `site.navigation` repeater.
 */
export async function Header() {
  const site = await reverso.getPage('site');
  const navigation = site.items('site.navigation', FALLBACK_NAV);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
      <nav className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <img
            data-reverso="site.header.logo"
            data-reverso-type="image"
            src={site.get('site.header.logo', '/logo.svg')}
            alt="Blog logo"
            className="h-8 w-auto"
          />
          <span
            data-reverso="site.header.siteName"
            data-reverso-type="text"
            className="text-xl font-bold"
          >
            {site.get('site.header.siteName', 'TechBlog')}
          </span>
        </a>

        {/* Navigation (site.navigation repeater) */}
        <div className="hidden md:flex items-center gap-6">
          {navigation.map((item, index) => (
            <a
              key={`${item.label ?? 'nav'}-${index}`}
              data-reverso="site.navigation.$.label"
              data-reverso-type="text"
              href={String(item.url ?? '/')}
              className="text-slate-600 hover:text-slate-900 transition-colors"
            >
              {String(item.label ?? '')}
            </a>
          ))}
          <span data-reverso="site.navigation.$.url" data-reverso-type="url" hidden />
        </div>

        {/* Search & CTA */}
        <div className="flex items-center gap-4">
          <button className="p-2 text-slate-600 hover:text-slate-900">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <a
            data-reverso="site.header.ctaText"
            data-reverso-type="text"
            href="/subscribe"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            {site.get('site.header.ctaText', 'Subscribe')}
          </a>
        </div>
      </nav>
    </header>
  );
}
