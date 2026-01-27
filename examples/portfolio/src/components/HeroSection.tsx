/**
 * Portfolio hero section with personal introduction.
 */
export function HeroSection() {
  return (
    <section className="min-h-screen flex items-center py-20 px-4">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        {/* Text Content */}
        <div>
          <span
            data-reverso="home.hero.greeting"
            data-reverso-type="text"
            className="text-lg text-violet-600 font-medium mb-2 block"
          >
            Hello, I'm
          </span>
          <h1
            data-reverso="home.hero.name"
            data-reverso-type="text"
            className="text-5xl md:text-6xl font-bold mb-4"
          >
            Jane Designer
          </h1>
          <h2
            data-reverso="home.hero.title"
            data-reverso-type="text"
            className="text-2xl md:text-3xl text-slate-600 mb-6"
          >
            UI/UX Designer & Creative Developer
          </h2>
          <p
            data-reverso="home.hero.bio"
            data-reverso-type="textarea"
            className="text-lg text-slate-600 mb-8 max-w-lg"
          >
            I create beautiful digital experiences that combine aesthetics with functionality.
            With 5+ years of experience, I help brands tell their stories through thoughtful design.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4">
            <a
              data-reverso="home.hero.primaryCta"
              data-reverso-type="text"
              href="#projects"
              className="px-8 py-3 bg-violet-600 text-white rounded-full font-semibold hover:bg-violet-700 transition-colors"
            >
              View My Work
            </a>
            <a
              data-reverso="home.hero.secondaryCta"
              data-reverso-type="text"
              href="#contact"
              className="px-8 py-3 border-2 border-slate-300 rounded-full font-semibold hover:border-violet-600 hover:text-violet-600 transition-colors"
            >
              Get In Touch
            </a>
          </div>

          {/* Social Links */}
          <div
            data-reverso="home.hero.socialLinks"
            data-reverso-type="repeater"
            data-reverso-max="5"
            className="flex gap-4 mt-8"
          >
            <a
              data-reverso="home.hero.socialLinks.$.url"
              data-reverso-type="url"
              href="#"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-violet-100 hover:text-violet-600 transition-colors"
            >
              <span
                data-reverso="home.hero.socialLinks.$.icon"
                data-reverso-type="text"
                className="text-sm"
              >
                X
              </span>
            </a>
          </div>
        </div>

        {/* Profile Image */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-400 to-purple-600 rounded-full blur-3xl opacity-30" />
          <img
            data-reverso="home.hero.profileImage"
            data-reverso-type="image"
            src="/placeholder-profile.jpg"
            alt="Profile photo"
            className="relative w-full max-w-md mx-auto rounded-full aspect-square object-cover shadow-2xl"
          />
        </div>
      </div>
    </section>
  );
}
