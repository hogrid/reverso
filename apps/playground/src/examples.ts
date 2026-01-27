export interface Example {
  name: string;
  description: string;
  icon: string;
  code: string;
}

export const examples: Example[] = [
  {
    name: 'Basic Page',
    description: 'Simple hero section with title and description',
    icon: '📄',
    code: `export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <h1
          data-reverso="home.hero.title"
          data-reverso-type="text"
          data-reverso-label="Hero Title"
        >
          Welcome to Our Site
        </h1>
        <p
          data-reverso="home.hero.description"
          data-reverso-type="textarea"
          data-reverso-label="Hero Description"
        >
          Build amazing websites with Reverso CMS.
        </p>
        <a
          href="#"
          data-reverso="home.hero.ctaText"
          data-reverso-type="text"
        >
          Get Started
        </a>
      </section>
    </main>
  );
}`,
  },
  {
    name: 'Blog Post',
    description: 'Article with featured image and rich content',
    icon: '📝',
    code: `export default function BlogPost() {
  return (
    <article>
      <header>
        <img
          data-reverso="blog.post.featuredImage"
          data-reverso-type="image"
          data-reverso-label="Featured Image"
          src="/placeholder.jpg"
          alt="Featured"
        />
        <h1
          data-reverso="blog.post.title"
          data-reverso-type="text"
          data-reverso-label="Post Title"
        >
          My First Blog Post
        </h1>
        <time
          data-reverso="blog.post.publishedAt"
          data-reverso-type="date"
          data-reverso-label="Publish Date"
        >
          January 1, 2024
        </time>
        <span
          data-reverso="blog.post.author"
          data-reverso-type="text"
          data-reverso-label="Author Name"
        >
          John Doe
        </span>
      </header>
      <div
        data-reverso="blog.post.content"
        data-reverso-type="wysiwyg"
        data-reverso-label="Post Content"
      >
        <p>This is the blog post content...</p>
      </div>
    </article>
  );
}`,
  },
  {
    name: 'Features Grid',
    description: 'Repeatable feature cards with icons',
    icon: '✨',
    code: `export default function FeaturesSection() {
  const features = [
    { icon: '🚀', title: 'Fast', description: 'Lightning fast' },
    { icon: '🔒', title: 'Secure', description: 'Enterprise security' },
    { icon: '🎨', title: 'Beautiful', description: 'Stunning designs' },
  ];

  return (
    <section className="features">
      <h2
        data-reverso="home.features.heading"
        data-reverso-type="text"
        data-reverso-label="Section Heading"
      >
        Why Choose Us
      </h2>
      <div className="grid">
        {features.map((feature, index) => (
          <div key={index} className="feature-card">
            <span
              data-reverso="home.features.$.icon"
              data-reverso-type="icon"
              data-reverso-label="Feature Icon"
            >
              {feature.icon}
            </span>
            <h3
              data-reverso="home.features.$.title"
              data-reverso-type="text"
              data-reverso-label="Feature Title"
            >
              {feature.title}
            </h3>
            <p
              data-reverso="home.features.$.description"
              data-reverso-type="textarea"
              data-reverso-label="Feature Description"
            >
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}`,
  },
  {
    name: 'Team Section',
    description: 'Team members with photos and social links',
    icon: '👥',
    code: `export default function TeamSection() {
  const team = [
    { name: 'Alice', role: 'CEO', photo: '/alice.jpg' },
    { name: 'Bob', role: 'CTO', photo: '/bob.jpg' },
  ];

  return (
    <section className="team">
      <h2
        data-reverso="about.team.heading"
        data-reverso-type="text"
        data-reverso-label="Section Heading"
      >
        Meet Our Team
      </h2>
      <p
        data-reverso="about.team.description"
        data-reverso-type="textarea"
        data-reverso-label="Section Description"
      >
        The amazing people behind our success.
      </p>
      <div className="team-grid">
        {team.map((member, index) => (
          <div key={index} className="team-card">
            <img
              data-reverso="about.team.$.photo"
              data-reverso-type="image"
              data-reverso-label="Member Photo"
              src={member.photo}
              alt={member.name}
            />
            <h3
              data-reverso="about.team.$.name"
              data-reverso-type="text"
              data-reverso-label="Member Name"
            >
              {member.name}
            </h3>
            <span
              data-reverso="about.team.$.role"
              data-reverso-type="text"
              data-reverso-label="Member Role"
            >
              {member.role}
            </span>
            <p
              data-reverso="about.team.$.bio"
              data-reverso-type="textarea"
              data-reverso-label="Member Bio"
            >
              A short bio about this team member.
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}`,
  },
  {
    name: 'Gallery',
    description: 'Image gallery with captions',
    icon: '🖼️',
    code: `export default function GallerySection() {
  return (
    <section className="gallery">
      <h2
        data-reverso="portfolio.gallery.heading"
        data-reverso-type="text"
        data-reverso-label="Gallery Heading"
      >
        Our Work
      </h2>
      <div
        data-reverso="portfolio.gallery.images"
        data-reverso-type="gallery"
        data-reverso-label="Gallery Images"
        className="gallery-grid"
      >
        <img src="/work-1.jpg" alt="Project 1" />
        <img src="/work-2.jpg" alt="Project 2" />
        <img src="/work-3.jpg" alt="Project 3" />
      </div>
      <p
        data-reverso="portfolio.gallery.caption"
        data-reverso-type="textarea"
        data-reverso-label="Gallery Caption"
      >
        A selection of our recent projects.
      </p>
    </section>
  );
}`,
  },
  {
    name: 'Contact Form',
    description: 'Contact section with form and location',
    icon: '📧',
    code: `export default function ContactSection() {
  return (
    <section className="contact">
      <h2
        data-reverso="contact.info.heading"
        data-reverso-type="text"
        data-reverso-label="Contact Heading"
      >
        Get in Touch
      </h2>
      <p
        data-reverso="contact.info.description"
        data-reverso-type="textarea"
        data-reverso-label="Contact Description"
      >
        We'd love to hear from you.
      </p>
      <div className="contact-details">
        <div>
          <strong>Email:</strong>
          <a
            data-reverso="contact.info.email"
            data-reverso-type="text"
            data-reverso-label="Email Address"
            href="mailto:hello@example.com"
          >
            hello@example.com
          </a>
        </div>
        <div>
          <strong>Phone:</strong>
          <span
            data-reverso="contact.info.phone"
            data-reverso-type="text"
            data-reverso-label="Phone Number"
          >
            +1 (555) 123-4567
          </span>
        </div>
        <div>
          <strong>Address:</strong>
          <address
            data-reverso="contact.info.address"
            data-reverso-type="textarea"
            data-reverso-label="Physical Address"
          >
            123 Main Street, City, Country
          </address>
        </div>
      </div>
      <div
        data-reverso="contact.info.map"
        data-reverso-type="googlemaps"
        data-reverso-label="Location Map"
        className="map-container"
      >
        Map will appear here
      </div>
    </section>
  );
}`,
  },
  {
    name: 'Pricing Table',
    description: 'Pricing plans with features list',
    icon: '💰',
    code: `export default function PricingSection() {
  const plans = [
    { name: 'Starter', price: '$9', features: ['5 Projects', 'Basic Support'] },
    { name: 'Pro', price: '$29', features: ['Unlimited Projects', 'Priority Support'] },
  ];

  return (
    <section className="pricing">
      <h2
        data-reverso="pricing.header.title"
        data-reverso-type="text"
        data-reverso-label="Pricing Title"
      >
        Simple Pricing
      </h2>
      <p
        data-reverso="pricing.header.subtitle"
        data-reverso-type="textarea"
        data-reverso-label="Pricing Subtitle"
      >
        Choose the plan that works for you.
      </p>
      <div className="plans-grid">
        {plans.map((plan, index) => (
          <div key={index} className="plan-card">
            <h3
              data-reverso="pricing.plans.$.name"
              data-reverso-type="text"
              data-reverso-label="Plan Name"
            >
              {plan.name}
            </h3>
            <div
              data-reverso="pricing.plans.$.price"
              data-reverso-type="text"
              data-reverso-label="Plan Price"
              className="price"
            >
              {plan.price}
              <span>/month</span>
            </div>
            <ul
              data-reverso="pricing.plans.$.features"
              data-reverso-type="textarea"
              data-reverso-label="Plan Features"
            >
              {plan.features.map((feature, i) => (
                <li key={i}>{feature}</li>
              ))}
            </ul>
            <button
              data-reverso="pricing.plans.$.ctaText"
              data-reverso-type="text"
              data-reverso-label="CTA Button Text"
            >
              Get Started
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}`,
  },
  {
    name: 'Testimonials',
    description: 'Customer testimonials with ratings',
    icon: '⭐',
    code: `export default function TestimonialsSection() {
  const testimonials = [
    { author: 'Jane D.', company: 'Startup Inc', quote: 'Amazing product!' },
    { author: 'John S.', company: 'Tech Corp', quote: 'Changed how we work.' },
  ];

  return (
    <section className="testimonials">
      <h2
        data-reverso="home.testimonials.heading"
        data-reverso-type="text"
        data-reverso-label="Section Heading"
      >
        What Our Customers Say
      </h2>
      <div className="testimonials-grid">
        {testimonials.map((testimonial, index) => (
          <blockquote key={index} className="testimonial-card">
            <p
              data-reverso="home.testimonials.$.quote"
              data-reverso-type="textarea"
              data-reverso-label="Testimonial Quote"
            >
              "{testimonial.quote}"
            </p>
            <footer>
              <img
                data-reverso="home.testimonials.$.avatar"
                data-reverso-type="image"
                data-reverso-label="Customer Photo"
                src="/avatar.jpg"
                alt={testimonial.author}
              />
              <cite>
                <strong
                  data-reverso="home.testimonials.$.author"
                  data-reverso-type="text"
                  data-reverso-label="Customer Name"
                >
                  {testimonial.author}
                </strong>
                <span
                  data-reverso="home.testimonials.$.company"
                  data-reverso-type="text"
                  data-reverso-label="Company Name"
                >
                  {testimonial.company}
                </span>
              </cite>
            </footer>
          </blockquote>
        ))}
      </div>
    </section>
  );
}`,
  },
];
