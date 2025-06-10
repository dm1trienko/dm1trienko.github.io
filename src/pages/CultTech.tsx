
import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { cultTechContacts } from '../data/mockData';
import { CultTechContact } from '../types';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Plus, ExternalLink } from 'lucide-react';
import CultTechModal from '../components/CultTech/CultTechModal';

const CultTech: React.FC = () => {
  const { t } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filters = [
    { key: 'all', label: t.culttech.filterAll },
    { key: 'Culture', label: t.culttech.filterCulture },
    { key: 'IT', label: t.culttech.filterIT },
    { key: 'Entrepreneurship', label: t.culttech.filterEntrepreneurship },
  ];

  const filteredContacts = activeFilter === 'all' 
    ? cultTechContacts
    : cultTechContacts.filter(contact => contact.tags.includes(activeFilter));

  const handleContactClick = (contact: string) => {
    if (contact.startsWith('@')) {
      // Telegram
      window.open(`https://t.me/${contact.slice(1)}`, '_blank');
    } else {
      // LinkedIn or other
      window.open(contact, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="font-playfair text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            {t.culttech.title}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            {t.culttech.subtitle}
          </p>
          
          {/* Suggest Contact Button */}
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="mb-8"
            size="lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t.culttech.suggest}
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {filters.map((filter) => (
            <Button
              key={filter.key}
              variant={activeFilter === filter.key ? "default" : "outline"}
              onClick={() => setActiveFilter(filter.key)}
              className="transition-all"
            >
              {filter.label}
            </Button>
          ))}
        </div>

        {/* Contacts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {filteredContacts.map((contact) => (
            <Card key={contact.id} className="hover:shadow-lg transition-shadow group">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg mb-1">{contact.name}</CardTitle>
                    <CardDescription className="font-medium text-primary">
                      {contact.field}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleContactClick(contact.contact)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-muted-foreground mb-4 text-sm">
                  {contact.description}
                </p>
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {contact.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleContactClick(contact.contact)}
                  className="w-full"
                >
                  {contact.contact}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredContacts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Контакты по выбранному фильтру не найдены
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      <CultTechModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
};

export default CultTech;
