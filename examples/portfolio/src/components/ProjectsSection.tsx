/**
 * Projects showcase section.
 */
export function ProjectsSection() {
  return (
    <section id="projects" className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <h2
          data-reverso="home.projects.title"
          data-reverso-type="text"
          className="text-3xl font-bold text-center mb-4"
        >
          Featured Projects
        </h2>
        <p
          data-reverso="home.projects.subtitle"
          data-reverso-type="textarea"
          className="text-slate-600 text-center mb-12 max-w-2xl mx-auto"
        >
          A selection of my recent work across various industries and platforms.
        </p>

        {/* Projects Grid - Repeater */}
        <div
          data-reverso="home.projects.items"
          data-reverso-type="repeater"
          data-reverso-min="2"
          data-reverso-max="8"
          className="grid md:grid-cols-2 gap-8"
        >
          <article className="group relative overflow-hidden rounded-2xl bg-slate-100">
            <img
              data-reverso="home.projects.items.$.image"
              data-reverso-type="image"
              src="/placeholder-project.jpg"
              alt="Project thumbnail"
              className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <span
                  data-reverso="home.projects.items.$.category"
                  data-reverso-type="text"
                  className="text-sm text-violet-300 font-medium"
                >
                  Web Design
                </span>
                <h3
                  data-reverso="home.projects.items.$.title"
                  data-reverso-type="text"
                  className="text-xl font-bold mt-1"
                >
                  E-commerce Redesign
                </h3>
                <p
                  data-reverso="home.projects.items.$.description"
                  data-reverso-type="textarea"
                  className="text-slate-300 mt-2 line-clamp-2"
                >
                  Complete redesign of an e-commerce platform focusing on conversion optimization.
                </p>
              </div>
            </div>
          </article>
        </div>

        {/* View All Link */}
        <div className="text-center mt-12">
          <a
            data-reverso="home.projects.viewAllText"
            data-reverso-type="text"
            href="/projects"
            className="inline-flex items-center gap-2 text-violet-600 font-semibold hover:text-violet-700"
          >
            View All Projects
            <span>→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
