import { reverso } from '@/lib/reverso';

const FALLBACK_POSTS = [
  {
    image: '/placeholder-post.jpg',
    category: 'Technology',
    title: 'Getting Started with Modern Web Development',
    excerpt:
      'Learn the fundamentals of modern web development and start building amazing applications today.',
    author: 'John Doe',
    date: 'Jan 15, 2026',
  },
];

/**
 * Featured posts section showing highlighted articles.
 * The post cards come from the `home.posts` repeater in the Reverso admin.
 */
export async function FeaturedPosts() {
  const home = await reverso.getPage('home');
  const posts = home.items('home.posts', FALLBACK_POSTS);

  return (
    <section id="featured" className="py-16 px-4 max-w-6xl mx-auto">
      <h2
        data-reverso="home.featured.title"
        data-reverso-type="text"
        className="text-3xl font-bold text-center mb-4"
      >
        {home.get('home.featured.title', 'Featured Articles')}
      </h2>
      <p
        data-reverso="home.featured.description"
        data-reverso-type="textarea"
        className="text-slate-600 text-center mb-12 max-w-2xl mx-auto"
      >
        {home.get(
          'home.featured.description',
          'Hand-picked stories from our editors that you should not miss.'
        )}
      </p>

      {/* Featured Posts Grid - Repeater (home.posts) */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post, index) => (
          <article
            key={`${post.title ?? 'post'}-${index}`}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <img
              data-reverso="home.posts.$.image"
              data-reverso-type="image"
              src={String(post.image ?? '/placeholder-post.jpg')}
              alt="Post thumbnail"
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <span
                data-reverso="home.posts.$.category"
                data-reverso-type="text"
                className="text-sm text-blue-600 font-medium"
              >
                {String(post.category ?? 'Technology')}
              </span>
              <h3
                data-reverso="home.posts.$.title"
                data-reverso-type="text"
                className="text-xl font-bold mt-2 mb-3 line-clamp-2"
              >
                {String(post.title ?? 'Untitled post')}
              </h3>
              <p
                data-reverso="home.posts.$.excerpt"
                data-reverso-type="textarea"
                className="text-slate-600 line-clamp-3 mb-4"
              >
                {String(post.excerpt ?? '')}
              </p>
              <div className="flex items-center justify-between">
                <span
                  data-reverso="home.posts.$.author"
                  data-reverso-type="text"
                  className="text-sm text-slate-500"
                >
                  {String(post.author ?? '')}
                </span>
                <span
                  data-reverso="home.posts.$.date"
                  data-reverso-type="date"
                  className="text-sm text-slate-500"
                >
                  {String(post.date ?? '')}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
