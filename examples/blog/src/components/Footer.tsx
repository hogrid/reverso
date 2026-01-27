/**
 * Site footer with links and copyright.
 */
export function Footer() {
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
              TechBlog
            </span>
            <p
              data-reverso="site.footer.description"
              data-reverso-type="textarea"
              className="text-slate-400 mb-4"
            >
              Your source for the latest in technology, web development, and digital innovation. We share insights, tutorials, and stories that matter.
            </p>
            {/* Social Links */}
            <div
              data-reverso="site.footer.socialLinks"
              data-reverso-type="repeater"
              data-reverso-max="5"
              className="flex gap-4"
            >
              <a
                data-reverso="site.footer.socialLinks.$.url"
                data-reverso-type="url"
                href="#"
                className="text-slate-400 hover:text-white transition-colors"
              >
                <span
                  data-reverso="site.footer.socialLinks.$.icon"
                  data-reverso-type="text"
                >
                  Twitter
                </span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3
              data-reverso="site.footer.quickLinksTitle"
              data-reverso-type="text"
              className="font-semibold mb-4"
            >
              Quick Links
            </h3>
            <div
              data-reverso="site.footer.quickLinks"
              data-reverso-type="repeater"
              data-reverso-max="6"
              className="space-y-2"
            >
              <a
                data-reverso="site.footer.quickLinks.$.label"
                data-reverso-type="text"
                href="#"
                className="text-slate-400 hover:text-white transition-colors block"
              >
                About Us
              </a>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3
              data-reverso="site.footer.categoriesTitle"
              data-reverso-type="text"
              className="font-semibold mb-4"
            >
              Categories
            </h3>
            <div
              data-reverso="site.footer.categories"
              data-reverso-type="repeater"
              data-reverso-max="6"
              className="space-y-2"
            >
              <a
                data-reverso="site.footer.categories.$.label"
                data-reverso-type="text"
                href="#"
                className="text-slate-400 hover:text-white transition-colors block"
              >
                Technology
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-slate-800 pt-8 text-center text-slate-400">
          <p
            data-reverso="site.footer.copyright"
            data-reverso-type="text"
          >
            2026 TechBlog. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
