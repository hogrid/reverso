/**
 * Site navigation header.
 */
export function Navigation() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <nav className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <a
          data-reverso="site.nav.logo"
          data-reverso-type="text"
          href="/"
          className="text-xl font-bold"
        >
          JD
        </a>

        <div
          data-reverso="site.nav.links"
          data-reverso-type="repeater"
          data-reverso-max="5"
          className="hidden md:flex items-center gap-8"
        >
          <a
            data-reverso="site.nav.links.$.label"
            data-reverso-type="text"
            href="#"
            className="text-slate-600 hover:text-slate-900 transition-colors"
          >
            About
          </a>
        </div>

        <a
          data-reverso="site.nav.ctaText"
          data-reverso-type="text"
          href="#contact"
          className="px-6 py-2 bg-violet-600 text-white rounded-full font-medium hover:bg-violet-700 transition-colors"
        >
          Hire Me
        </a>
      </nav>
    </header>
  );
}
