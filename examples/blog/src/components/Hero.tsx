/**
 * Hero section for the blog homepage.
 * Showcases the main heading and description with a background image.
 */
export function Hero() {
  return (
    <section className="relative h-[60vh] min-h-[400px] flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          data-reverso="home.hero.backgroundImage"
          data-reverso-type="image"
          src="/placeholder-hero.jpg"
          alt="Blog hero background"
          className="w-full h-full object-cover opacity-30"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center text-white px-4 max-w-4xl">
        <h1
          data-reverso="home.hero.title"
          data-reverso-type="text"
          className="text-5xl md:text-6xl font-bold mb-6"
        >
          Welcome to Our Blog
        </h1>
        <p
          data-reverso="home.hero.subtitle"
          data-reverso-type="textarea"
          className="text-xl md:text-2xl text-slate-200 mb-8"
        >
          Discover stories, insights, and ideas that inspire and inform.
        </p>
        <a
          href="#featured"
          data-reverso="home.hero.ctaText"
          data-reverso-type="text"
          className="inline-block bg-white text-slate-900 px-8 py-3 rounded-full font-semibold hover:bg-slate-100 transition-colors"
        >
          Read Latest Posts
        </a>
      </div>
    </section>
  );
}
