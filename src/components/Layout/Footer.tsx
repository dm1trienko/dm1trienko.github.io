
import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-center md:text-left mb-4 md:mb-0">
            <Link to="/" className="font-playfair text-xl font-semibold text-primary hover:text-accent transition-colors">
              Дмитриёнок
            </Link>
            <p className="text-sm text-muted-foreground mt-1">
              Student & Freediver • MIPT AMI'28
            </p>
          </div>

          <div className="flex items-center space-x-6">
            <Link
              to="/blog"
              className="text-sm text-muted-foreground hover:text-accent transition-colors"
            >
              {t.nav.blog}
            </Link>
            <Link
              to="/culttech"
              className="text-sm text-muted-foreground hover:text-accent transition-colors"
            >
              {t.nav.culttech}
            </Link>
            <Link
              to="/contact"
              className="text-sm text-muted-foreground hover:text-accent transition-colors"
            >
              {t.nav.contact}
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            © 2024 Еремей Дмитриенко. Made with care for ML/AI, startups & community.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
