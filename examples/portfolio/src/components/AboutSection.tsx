/**
 * About section with experience and education.
 */
export function AboutSection() {
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
              About Me
            </h2>
            <div
              data-reverso="home.about.content"
              data-reverso-type="wysiwyg"
              className="prose prose-invert prose-lg"
            >
              <p>
                I'm a passionate designer with over 5 years of experience creating digital products
                that users love. My approach combines creative thinking with data-driven decisions.
              </p>
              <p>
                When I'm not designing, you can find me exploring new coffee shops, reading design
                books, or hiking in nature.
              </p>
            </div>

            {/* Stats */}
            <div
              data-reverso="home.about.stats"
              data-reverso-type="repeater"
              data-reverso-max="4"
              className="grid grid-cols-3 gap-8 mt-8"
            >
              <div>
                <span
                  data-reverso="home.about.stats.$.value"
                  data-reverso-type="text"
                  className="text-4xl font-bold text-violet-400"
                >
                  50+
                </span>
                <span
                  data-reverso="home.about.stats.$.label"
                  data-reverso-type="text"
                  className="block text-slate-400 mt-1"
                >
                  Projects
                </span>
              </div>
            </div>
          </div>

          {/* Experience */}
          <div>
            <h3
              data-reverso="home.about.experienceTitle"
              data-reverso-type="text"
              className="text-xl font-bold mb-6"
            >
              Experience
            </h3>
            <div
              data-reverso="home.about.experience"
              data-reverso-type="repeater"
              data-reverso-max="5"
              className="space-y-6"
            >
              <div className="border-l-2 border-violet-500 pl-4">
                <span
                  data-reverso="home.about.experience.$.period"
                  data-reverso-type="text"
                  className="text-sm text-slate-400"
                >
                  2022 - Present
                </span>
                <h4
                  data-reverso="home.about.experience.$.role"
                  data-reverso-type="text"
                  className="font-bold mt-1"
                >
                  Senior UI Designer
                </h4>
                <span
                  data-reverso="home.about.experience.$.company"
                  data-reverso-type="text"
                  className="text-slate-400"
                >
                  Tech Startup Inc.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
