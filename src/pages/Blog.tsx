
import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { blogPosts } from '../data/mockData';

const Blog: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="font-playfair text-4xl md:text-6xl font-bold text-primary mb-6">
            {t.blog.title}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            {t.blog.subtitle}
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {blogPosts.length > 0 ? (
            <div className="space-y-8">
              {blogPosts.map((post) => (
                <article
                  key={post.id}
                  className="bg-card rounded-lg p-8 shadow-sm hover:shadow-md transition-all duration-300 border border-border"
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
                  <h2 className="font-playfair text-2xl md:text-3xl font-semibold text-primary mb-4">
                    <Link
                      to={`/blog/${post.slug}`}
                      className="hover:text-accent transition-colors"
                    >
                      {post.title}
                    </Link>
                  </h2>
                  <p className="text-muted-foreground mb-6 leading-relaxed text-lg">
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
          ) : (
            <div className="text-center py-20">
              <p className="text-lg text-muted-foreground">
                {t.blog.comingSoon}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Blog;
