import { reverso } from '@/lib/reverso';

const FALLBACK_NAV_LINKS = [{ label: 'About', url: '#' }];

/**
 * Site navigation header.
 * Navigation links come from the `site.navLinks` repeater.
 */
export async function Navigation() {
  const site = await reverso.getPage('site');
  const navLinks = site.items('site.navLinks', FALLBACK_NAV_LINKS);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <nav className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <a
          data-reverso="site.nav.logo"
          data-reverso-type="text"
          href="/"
          className="text-xl font-bold"
        >
          {site.get('site.nav.logo', 'JD')}
        </a>

        {/* Navigation (site.navLinks repeater) */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link, index) => (
            <a
              key={`${link.label ?? 'nav'}-${index}`}
              data-reverso="site.navLinks.$.label"
              data-reverso-type="text"
              href={String(link.url ?? '#')}
              className="text-slate-600 hover:text-slate-900 transition-colors"
            >
              {String(link.label ?? '')}
            </a>
          ))}
          <span data-reverso="site.navLinks.$.url" data-reverso-type="url" hidden />
        </div>

        <a
          data-reverso="site.nav.ctaText"
          data-reverso-type="text"
          href="#contact"
          className="px-6 py-2 bg-violet-600 text-white rounded-full font-medium hover:bg-violet-700 transition-colors"
        >
          {site.get('site.nav.ctaText', 'Hire Me')}
        </a>
      </nav>
    </header>
  );
}
