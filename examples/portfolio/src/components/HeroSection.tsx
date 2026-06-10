import { reverso } from '@/lib/reverso';

const FALLBACK_SOCIAL = [{ icon: 'X', url: '#' }];

/**
 * Portfolio hero section with personal introduction.
 * Social links come from the `home.social` repeater.
 */
export async function HeroSection() {
  const home = await reverso.getPage('home');
  const socialLinks = home.items('home.social', FALLBACK_SOCIAL);

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
            {home.get('home.hero.greeting', "Hello, I'm")}
          </span>
          <h1
            data-reverso="home.hero.name"
            data-reverso-type="text"
            className="text-5xl md:text-6xl font-bold mb-4"
          >
            {home.get('home.hero.name', 'Jane Designer')}
          </h1>
          <h2
            data-reverso="home.hero.title"
            data-reverso-type="text"
            className="text-2xl md:text-3xl text-slate-600 mb-6"
          >
            {home.get('home.hero.title', 'UI/UX Designer & Creative Developer')}
          </h2>
          <p
            data-reverso="home.hero.bio"
            data-reverso-type="textarea"
            className="text-lg text-slate-600 mb-8 max-w-lg"
          >
            {home.get(
              'home.hero.bio',
              'I create beautiful digital experiences that combine aesthetics with functionality. With 5+ years of experience, I help brands tell their stories through thoughtful design.'
            )}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4">
            <a
              data-reverso="home.hero.primaryCta"
              data-reverso-type="text"
              href="#projects"
              className="px-8 py-3 bg-violet-600 text-white rounded-full font-semibold hover:bg-violet-700 transition-colors"
            >
              {home.get('home.hero.primaryCta', 'View My Work')}
            </a>
            <a
              data-reverso="home.hero.secondaryCta"
              data-reverso-type="text"
              href="#contact"
              className="px-8 py-3 border-2 border-slate-300 rounded-full font-semibold hover:border-violet-600 hover:text-violet-600 transition-colors"
            >
              {home.get('home.hero.secondaryCta', 'Get In Touch')}
            </a>
          </div>

          {/* Social Links (home.social repeater) */}
          <div className="flex gap-4 mt-8">
            {socialLinks.map((link, index) => (
              <a
                key={`${link.icon ?? 'social'}-${index}`}
                data-reverso="home.social.$.url"
                data-reverso-type="url"
                href={String(link.url ?? '#')}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-violet-100 hover:text-violet-600 transition-colors"
              >
                <span
                  data-reverso="home.social.$.icon"
                  data-reverso-type="text"
                  className="text-sm"
                >
                  {String(link.icon ?? '')}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Profile Image */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-400 to-purple-600 rounded-full blur-3xl opacity-30" />
          <img
            data-reverso="home.hero.profileImage"
            data-reverso-type="image"
            src={home.get('home.hero.profileImage', '/placeholder-profile.jpg')}
            alt="Profile photo"
            className="relative w-full max-w-md mx-auto rounded-full aspect-square object-cover shadow-2xl"
          />
        </div>
      </div>
    </section>
  );
}
