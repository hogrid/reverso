/**
 * Newsletter signup section.
 * Captures email addresses for blog updates.
 */
export function Newsletter() {
  return (
    <section className="py-16 px-4 bg-slate-100">
      <div className="max-w-2xl mx-auto text-center">
        <h2
          data-reverso="home.newsletter.title"
          data-reverso-type="text"
          className="text-3xl font-bold mb-4"
        >
          Subscribe to Our Newsletter
        </h2>
        <p
          data-reverso="home.newsletter.description"
          data-reverso-type="textarea"
          className="text-slate-600 mb-8"
        >
          Get the latest articles delivered straight to your inbox. No spam, unsubscribe anytime.
        </p>

        <form className="flex flex-col sm:flex-row gap-4 justify-center">
          <input
            type="email"
            placeholder="Enter your email"
            className="px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 max-w-md"
          />
          <button
            data-reverso="home.newsletter.buttonText"
            data-reverso-type="text"
            type="submit"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Subscribe
          </button>
        </form>

        <p
          data-reverso="home.newsletter.disclaimer"
          data-reverso-type="text"
          className="text-sm text-slate-500 mt-4"
        >
          By subscribing, you agree to our Privacy Policy.
        </p>
      </div>
    </section>
  );
}
