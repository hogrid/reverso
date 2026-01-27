/**
 * Skills section showcasing expertise areas.
 */
export function SkillsSection() {
  return (
    <section className="py-20 px-4 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <h2
          data-reverso="home.skills.title"
          data-reverso-type="text"
          className="text-3xl font-bold text-center mb-4"
        >
          What I Do
        </h2>
        <p
          data-reverso="home.skills.subtitle"
          data-reverso-type="textarea"
          className="text-slate-600 text-center mb-12 max-w-2xl mx-auto"
        >
          I specialize in creating user-centered digital experiences that solve real problems.
        </p>

        {/* Skills Grid - Repeater */}
        <div
          data-reverso="home.skills.items"
          data-reverso-type="repeater"
          data-reverso-min="3"
          data-reverso-max="6"
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div
              data-reverso="home.skills.items.$.icon"
              data-reverso-type="text"
              className="w-14 h-14 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center text-2xl mb-6"
            >
              UI
            </div>
            <h3
              data-reverso="home.skills.items.$.title"
              data-reverso-type="text"
              className="text-xl font-bold mb-3"
            >
              UI Design
            </h3>
            <p
              data-reverso="home.skills.items.$.description"
              data-reverso-type="textarea"
              className="text-slate-600"
            >
              Creating visually stunning interfaces that are intuitive and delightful to use.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
