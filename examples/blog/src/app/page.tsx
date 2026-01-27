import { Hero } from '@/components/Hero';
import { FeaturedPosts } from '@/components/FeaturedPosts';
import { Newsletter } from '@/components/Newsletter';

/**
 * Home page for the blog.
 * Combines Hero, Featured Posts, and Newsletter sections.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedPosts />
      <Newsletter />
    </>
  );
}
