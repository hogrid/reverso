import { reverso } from '@/lib/reverso';

const FALLBACK_SKILLS = [
  {
    icon: 'UI',
    title: 'UI Design',
    description:
      'Creating visually stunning interfaces that are intuitive and delightful to use.',
  },
];

/**
 * Skills section showcasing expertise areas.
 * The skill cards come from the `home.skillItems` repeater.
 */
export async function SkillsSection() {
  const home = await reverso.getPage('home');
  const skills = home.items('home.skillItems', FALLBACK_SKILLS);

  return (
    <section className="py-20 px-4 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <h2
          data-reverso="home.skills.title"
          data-reverso-type="text"
          className="text-3xl font-bold text-center mb-4"
        >
          {home.get('home.skills.title', 'What I Do')}
        </h2>
        <p
          data-reverso="home.skills.subtitle"
          data-reverso-type="textarea"
          className="text-slate-600 text-center mb-12 max-w-2xl mx-auto"
        >
          {home.get(
            'home.skills.subtitle',
            'I specialize in creating user-centered digital experiences that solve real problems.'
          )}
        </p>

        {/* Skills Grid - Repeater (home.skillItems) */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {skills.map((skill, index) => (
            <div
              key={`${skill.title ?? 'skill'}-${index}`}
              className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div
                data-reverso="home.skillItems.$.icon"
                data-reverso-type="text"
                className="w-14 h-14 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center text-2xl mb-6"
              >
                {String(skill.icon ?? '')}
              </div>
              <h3
                data-reverso="home.skillItems.$.title"
                data-reverso-type="text"
                className="text-xl font-bold mb-3"
              >
                {String(skill.title ?? '')}
              </h3>
              <p
                data-reverso="home.skillItems.$.description"
                data-reverso-type="textarea"
                className="text-slate-600"
              >
                {String(skill.description ?? '')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
