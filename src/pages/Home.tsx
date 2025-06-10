
import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { blogPosts } from '../data/mockData';
import { ArrowDown } from 'lucide-react';

const Home: React.FC = () => {
  const { t } = useLanguage();
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simple fade-in animation
    if (heroRef.current) {
      heroRef.current.style.opacity = '0';
      heroRef.current.style.transform = 'translateY(20px)';
      
      const timer = setTimeout(() => {
        if (heroRef.current) {
          heroRef.current.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
          heroRef.current.style.opacity = '1';
          heroRef.current.style.transform = 'translateY(0)';
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center relative bg-gradient-to-br from-background via-background to-secondary/30">
        <div ref={heroRef} className="container mx-auto px-4 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-playfair text-6xl md:text-8xl font-bold text-primary mb-6">
              {t.home.title}
            </h1>
            <h2 className="font-playfair text-xl md:text-2xl text-accent mb-8 font-medium">
              {t.home.subtitle}
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground mb-12 leading-relaxed max-w-2xl mx-auto">
              {t.home.description}
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center px-8 py-4 bg-accent text-background font-medium rounded-full hover:bg-accent/90 transition-all duration-300 hover:shadow-lg hover:scale-105"
            >
              {t.home.cta}
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ArrowDown className="w-6 h-6 text-muted-foreground" />
        </div>
      </section>

      {/* Latest Blog Posts */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-playfair text-4xl md:text-5xl font-bold text-primary mb-4">
              {t.home.latest}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {blogPosts.map((post) => (
              <article
                key={post.id}
                className="bg-background rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 border border-border"
              >
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-3 py-1 bg-secondary text-secondary-foreground rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <h3 className="font-playfair text-xl font-semibold text-primary mb-3">
                  {post.title}
                </h3>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <time className="text-sm text-muted-foreground">
                    {new Date(post.date).toLocaleDateString('ru-RU')}
                  </time>
                  <Link
                    to={`/blog/${post.slug}`}
                    className="text-accent hover:text-accent/80 transition-colors font-medium"
                  >
                    {t.home.readMore}
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/blog"
              className="inline-flex items-center px-6 py-3 border border-accent text-accent hover:bg-accent hover:text-background transition-all duration-300 rounded-full"
            >
              {t.nav.blog}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
