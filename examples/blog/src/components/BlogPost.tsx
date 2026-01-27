/**
 * Blog post detail component.
 * Shows full article content with author info and metadata.
 */
export function BlogPost() {
  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      {/* Header */}
      <header className="mb-8">
        <span
          data-reverso="post.header.category"
          data-reverso-type="text"
          className="text-blue-600 font-medium"
        >
          Technology
        </span>
        <h1
          data-reverso="post.header.title"
          data-reverso-type="text"
          className="text-4xl md:text-5xl font-bold mt-2 mb-4"
        >
          The Complete Guide to Modern Web Development
        </h1>
        <p
          data-reverso="post.header.excerpt"
          data-reverso-type="textarea"
          className="text-xl text-slate-600 mb-6"
        >
          Everything you need to know to start building amazing web applications with the latest technologies.
        </p>

        {/* Author Info */}
        <div className="flex items-center gap-4">
          <img
            data-reverso="post.author.avatar"
            data-reverso-type="image"
            src="/placeholder-avatar.jpg"
            alt="Author avatar"
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <p
              data-reverso="post.author.name"
              data-reverso-type="text"
              className="font-semibold"
            >
              John Doe
            </p>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span
                data-reverso="post.header.date"
                data-reverso-type="date"
              >
                January 15, 2026
              </span>
              <span>·</span>
              <span
                data-reverso="post.header.readTime"
                data-reverso-type="text"
              >
                5 min read
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Featured Image */}
      <img
        data-reverso="post.featuredImage"
        data-reverso-type="image"
        src="/placeholder-featured.jpg"
        alt="Featured image"
        className="w-full h-[400px] object-cover rounded-lg mb-8"
      />

      {/* Content - WYSIWYG */}
      <div
        data-reverso="post.content"
        data-reverso-type="wysiwyg"
        className="prose prose-lg max-w-none"
      >
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
        </p>
        <h2>Getting Started</h2>
        <p>
          Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.
        </p>
      </div>

      {/* Tags */}
      <div className="mt-8 pt-8 border-t">
        <span className="text-sm text-slate-500 mr-2">Tags:</span>
        <div
          data-reverso="post.tags"
          data-reverso-type="multiselect"
          data-reverso-options="web-development,javascript,react,typescript,css,html"
          className="inline-flex gap-2 flex-wrap"
        >
          <span className="px-3 py-1 bg-slate-100 rounded-full text-sm">Web Development</span>
          <span className="px-3 py-1 bg-slate-100 rounded-full text-sm">JavaScript</span>
        </div>
      </div>
    </article>
  );
}
