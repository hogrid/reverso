import { reverso } from '@/lib/reverso';
import { sanitizeCmsHtml } from '@/lib/sanitize';

const FALLBACK_CONTENT = `
  <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p>
  <h2>Getting Started</h2>
  <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.</p>
`;

const FALLBACK_TAGS = ['Web Development', 'JavaScript'];

/**
 * Blog post detail component.
 * Shows full article content with author info and metadata.
 */
export async function BlogPost() {
  const post = await reverso.getPage('post');
  const tags = post.get<string[] | string>('post.article.tags', FALLBACK_TAGS);
  const tagList = Array.isArray(tags)
    ? tags
    : String(tags)
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);

  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      {/* Header */}
      <header className="mb-8">
        <span
          data-reverso="post.header.category"
          data-reverso-type="text"
          className="text-blue-600 font-medium"
        >
          {post.get('post.header.category', 'Technology')}
        </span>
        <h1
          data-reverso="post.header.title"
          data-reverso-type="text"
          className="text-4xl md:text-5xl font-bold mt-2 mb-4"
        >
          {post.get('post.header.title', 'The Complete Guide to Modern Web Development')}
        </h1>
        <p
          data-reverso="post.header.excerpt"
          data-reverso-type="textarea"
          className="text-xl text-slate-600 mb-6"
        >
          {post.get(
            'post.header.excerpt',
            'Everything you need to know to start building amazing web applications with the latest technologies.'
          )}
        </p>

        {/* Author Info */}
        <div className="flex items-center gap-4">
          <img
            data-reverso="post.author.avatar"
            data-reverso-type="image"
            src={post.get('post.author.avatar', '/placeholder-avatar.jpg')}
            alt="Author avatar"
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <p data-reverso="post.author.name" data-reverso-type="text" className="font-semibold">
              {post.get('post.author.name', 'John Doe')}
            </p>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span data-reverso="post.header.date" data-reverso-type="date">
                {post.get('post.header.date', 'January 15, 2026')}
              </span>
              <span>·</span>
              <span data-reverso="post.header.readTime" data-reverso-type="text">
                {post.get('post.header.readTime', '5 min read')}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Featured Image */}
      <img
        data-reverso="post.article.featuredImage"
        data-reverso-type="image"
        src={post.get('post.article.featuredImage', '/placeholder-featured.jpg')}
        alt="Featured image"
        className="w-full h-[400px] object-cover rounded-lg mb-8"
      />

      {/* Content - WYSIWYG */}
      <div
        data-reverso="post.article.content"
        data-reverso-type="wysiwyg"
        className="prose prose-lg max-w-none"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: CMS HTML sanitized with sanitize-html above
        dangerouslySetInnerHTML={{
          __html: sanitizeCmsHtml(post.get('post.article.content', FALLBACK_CONTENT)),
        }}
      />

      {/* Tags */}
      <div className="mt-8 pt-8 border-t">
        <span className="text-sm text-slate-500 mr-2">Tags:</span>
        <div
          data-reverso="post.article.tags"
          data-reverso-type="multiselect"
          data-reverso-options="web-development,javascript,react,typescript,css,html"
          className="inline-flex gap-2 flex-wrap"
        >
          {tagList.map((tag) => (
            <span key={tag} className="px-3 py-1 bg-slate-100 rounded-full text-sm">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
