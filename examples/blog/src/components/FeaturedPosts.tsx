/**
 * Featured posts section showing highlighted articles.
 * Uses a repeater for dynamic post cards.
 */
export function FeaturedPosts() {
  return (
    <section id="featured" className="py-16 px-4 max-w-6xl mx-auto">
      <h2
        data-reverso="home.featured.title"
        data-reverso-type="text"
        className="text-3xl font-bold text-center mb-4"
      >
        Featured Articles
      </h2>
      <p
        data-reverso="home.featured.description"
        data-reverso-type="textarea"
        className="text-slate-600 text-center mb-12 max-w-2xl mx-auto"
      >
        Hand-picked stories from our editors that you should not miss.
      </p>

      {/* Featured Posts Grid - Repeater */}
      <div
        data-reverso="home.featured.posts"
        data-reverso-type="repeater"
        data-reverso-min="1"
        data-reverso-max="6"
        className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        {/* Post Card Template */}
        <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
          <img
            data-reverso="home.featured.posts.$.image"
            data-reverso-type="image"
            src="/placeholder-post.jpg"
            alt="Post thumbnail"
            className="w-full h-48 object-cover"
          />
          <div className="p-6">
            <span
              data-reverso="home.featured.posts.$.category"
              data-reverso-type="text"
              className="text-sm text-blue-600 font-medium"
            >
              Technology
            </span>
            <h3
              data-reverso="home.featured.posts.$.title"
              data-reverso-type="text"
              className="text-xl font-bold mt-2 mb-3 line-clamp-2"
            >
              Getting Started with Modern Web Development
            </h3>
            <p
              data-reverso="home.featured.posts.$.excerpt"
              data-reverso-type="textarea"
              className="text-slate-600 line-clamp-3 mb-4"
            >
              Learn the fundamentals of modern web development and start building amazing applications today.
            </p>
            <div className="flex items-center justify-between">
              <span
                data-reverso="home.featured.posts.$.author"
                data-reverso-type="text"
                className="text-sm text-slate-500"
              >
                John Doe
              </span>
              <span
                data-reverso="home.featured.posts.$.date"
                data-reverso-type="date"
                className="text-sm text-slate-500"
              >
                Jan 15, 2026
              </span>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
