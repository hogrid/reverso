/**
 * Contact section with form.
 */
export function ContactSection() {
  return (
    <section id="contact" className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2
            data-reverso="home.contact.title"
            data-reverso-type="text"
            className="text-3xl font-bold mb-4"
          >
            Let's Work Together
          </h2>
          <p
            data-reverso="home.contact.subtitle"
            data-reverso-type="textarea"
            className="text-slate-600 max-w-xl mx-auto"
          >
            Have a project in mind? I'd love to hear about it. Drop me a message and let's create something amazing.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div>
            <h3 className="font-bold mb-6">Get in Touch</h3>
            <div className="space-y-4">
              <div>
                <span className="text-slate-500 block text-sm">Email</span>
                <a
                  data-reverso="home.contact.email"
                  data-reverso-type="email"
                  href="mailto:hello@example.com"
                  className="text-violet-600 hover:text-violet-700"
                >
                  hello@example.com
                </a>
              </div>
              <div>
                <span className="text-slate-500 block text-sm">Location</span>
                <span
                  data-reverso="home.contact.location"
                  data-reverso-type="text"
                >
                  San Francisco, CA
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-sm">Availability</span>
                <span
                  data-reverso="home.contact.availability"
                  data-reverso-type="text"
                  className="text-green-600"
                >
                  Open for freelance projects
                </span>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Message</label>
              <textarea
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                placeholder="Tell me about your project..."
              />
            </div>
            <button
              data-reverso="home.contact.submitText"
              data-reverso-type="text"
              type="submit"
              className="w-full px-8 py-3 bg-violet-600 text-white rounded-lg font-semibold hover:bg-violet-700 transition-colors"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
