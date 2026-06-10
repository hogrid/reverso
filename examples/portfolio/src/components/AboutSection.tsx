import { reverso } from '@/lib/reverso';
import { sanitizeCmsHtml } from '@/lib/sanitize';

const FALLBACK_ABOUT_CONTENT = `
  <p>I'm a passionate designer with over 5 years of experience creating digital products that users love. My approach combines creative thinking with data-driven decisions.</p>
  <p>When I'm not designing, you can find me exploring new coffee shops, reading design books, or hiking in nature.</p>
`;

const FALLBACK_STATS = [{ value: '50+', label: 'Projects' }];

const FALLBACK_EXPERIENCE = [
  { period: '2022 - Present', role: 'Senior UI Designer', company: 'Tech Startup Inc.' },
];

/**
 * About section with experience and education.
 * Stats come from the `home.stats` repeater and experience entries
 * from the `home.experience` repeater.
 */
export async function AboutSection() {
  const home = await reverso.getPage('home');
  const stats = home.items('home.stats', FALLBACK_STATS);
  const experience = home.items('home.experience', FALLBACK_EXPERIENCE);

  return (
    <section className="py-20 px-4 bg-slate-900 text-white">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16">
          {/* About Text */}
          <div>
            <h2
              data-reverso="home.about.title"
              data-reverso-type="text"
              className="text-3xl font-bold mb-6"
            >
              {home.get('home.about.title', 'About Me')}
            </h2>
            <div
              data-reverso="home.about.content"
              data-reverso-type="wysiwyg"
              className="prose prose-invert prose-lg"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: WYSIWYG content from the CMS
              dangerouslySetInnerHTML={{
          __html: sanitizeCmsHtml(home.get('home.about.content', FALLBACK_ABOUT_CONTENT)),
        }}
            />

            {/* Stats (home.stats repeater) */}
            <div className="grid grid-cols-3 gap-8 mt-8">
              {stats.map((stat, index) => (
                <div key={`${stat.label ?? 'stat'}-${index}`}>
                  <span
                    data-reverso="home.stats.$.value"
                    data-reverso-type="text"
                    className="text-4xl font-bold text-violet-400"
                  >
                    {String(stat.value ?? '')}
                  </span>
                  <span
                    data-reverso="home.stats.$.label"
                    data-reverso-type="text"
                    className="block text-slate-400 mt-1"
                  >
                    {String(stat.label ?? '')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Experience */}
          <div>
            <h3
              data-reverso="home.about.experienceTitle"
              data-reverso-type="text"
              className="text-xl font-bold mb-6"
            >
              {home.get('home.about.experienceTitle', 'Experience')}
            </h3>
            {/* Experience entries (home.experience repeater) */}
            <div className="space-y-6">
              {experience.map((entry, index) => (
                <div
                  key={`${entry.role ?? 'experience'}-${index}`}
                  className="border-l-2 border-violet-500 pl-4"
                >
                  <span
                    data-reverso="home.experience.$.period"
                    data-reverso-type="text"
                    className="text-sm text-slate-400"
                  >
                    {String(entry.period ?? '')}
                  </span>
                  <h4
                    data-reverso="home.experience.$.role"
                    data-reverso-type="text"
                    className="font-bold mt-1"
                  >
                    {String(entry.role ?? '')}
                  </h4>
                  <span
                    data-reverso="home.experience.$.company"
                    data-reverso-type="text"
                    className="text-slate-400"
                  >
                    {String(entry.company ?? '')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
