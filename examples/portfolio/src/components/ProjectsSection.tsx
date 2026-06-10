import { reverso } from '@/lib/reverso';

const FALLBACK_PROJECTS = [
  {
    image: '/placeholder-project.jpg',
    category: 'Web Design',
    title: 'E-commerce Redesign',
    description:
      'Complete redesign of an e-commerce platform focusing on conversion optimization.',
  },
];

/**
 * Projects showcase section.
 * The project cards come from the `home.projectItems` repeater.
 */
export async function ProjectsSection() {
  const home = await reverso.getPage('home');
  const projects = home.items('home.projectItems', FALLBACK_PROJECTS);

  return (
    <section id="projects" className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <h2
          data-reverso="home.projects.title"
          data-reverso-type="text"
          className="text-3xl font-bold text-center mb-4"
        >
          {home.get('home.projects.title', 'Featured Projects')}
        </h2>
        <p
          data-reverso="home.projects.subtitle"
          data-reverso-type="textarea"
          className="text-slate-600 text-center mb-12 max-w-2xl mx-auto"
        >
          {home.get(
            'home.projects.subtitle',
            'A selection of my recent work across various industries and platforms.'
          )}
        </p>

        {/* Projects Grid - Repeater (home.projectItems) */}
        <div className="grid md:grid-cols-2 gap-8">
          {projects.map((project, index) => (
            <article
              key={`${project.title ?? 'project'}-${index}`}
              className="group relative overflow-hidden rounded-2xl bg-slate-100"
            >
              <img
                data-reverso="home.projectItems.$.image"
                data-reverso-type="image"
                src={String(project.image ?? '/placeholder-project.jpg')}
                alt="Project thumbnail"
                className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <span
                    data-reverso="home.projectItems.$.category"
                    data-reverso-type="text"
                    className="text-sm text-violet-300 font-medium"
                  >
                    {String(project.category ?? '')}
                  </span>
                  <h3
                    data-reverso="home.projectItems.$.title"
                    data-reverso-type="text"
                    className="text-xl font-bold mt-1"
                  >
                    {String(project.title ?? '')}
                  </h3>
                  <p
                    data-reverso="home.projectItems.$.description"
                    data-reverso-type="textarea"
                    className="text-slate-300 mt-2 line-clamp-2"
                  >
                    {String(project.description ?? '')}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* View All Link */}
        <div className="text-center mt-12">
          <a
            data-reverso="home.projects.viewAllText"
            data-reverso-type="text"
            href="/projects"
            className="inline-flex items-center gap-2 text-violet-600 font-semibold hover:text-violet-700"
          >
            {home.get('home.projects.viewAllText', 'View All Projects')}
            <span>→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
