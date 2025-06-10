
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { roadmapItems } from '../data/mockData';
import { RoadmapItem as RoadmapItemType } from '../types';
import { GraduationCap, Briefcase, Trophy, User } from 'lucide-react';

const getTypeIcon = (type: RoadmapItemType['type']) => {
  switch (type) {
    case 'education':
      return <GraduationCap className="w-5 h-5" />;
    case 'work':
      return <Briefcase className="w-5 h-5" />;
    case 'achievement':
      return <Trophy className="w-5 h-5" />;
    case 'personal':
      return <User className="w-5 h-5" />;
    default:
      return <User className="w-5 h-5" />;
  }
};

const getTypeColor = (type: RoadmapItemType['type']) => {
  switch (type) {
    case 'education':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'work':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'achievement':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'personal':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const RoadmapItem: React.FC<{ item: RoadmapItemType; isLast: boolean }> = ({ item, isLast }) => {
  const { t } = useLanguage();
  
  return (
    <div className="relative pl-8 pb-8">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-4 top-8 w-0.5 h-full bg-border"></div>
      )}
      
      {/* Timeline dot */}
      <div className="absolute left-2 top-2 w-4 h-4 bg-primary rounded-full border-2 border-background shadow-sm"></div>
      
      {/* Content */}
      <div className="bg-card rounded-lg border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(item.type)}`}>
              {getTypeIcon(item.type)}
              {t.roadmap[item.type]}
            </span>
            <span className="text-sm font-medium text-primary">{item.year}</span>
          </div>
        </div>
        
        <h3 className="font-semibold text-lg mb-2 text-foreground">{item.title}</h3>
        <p className="text-muted-foreground mb-3">{item.description}</p>
        
        {item.location && (
          <p className="text-sm text-muted-foreground">📍 {item.location}</p>
        )}
      </div>
    </div>
  );
};

const Roadmap: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="font-playfair text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            {t.roadmap.title}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t.roadmap.subtitle}
          </p>
        </div>

        {/* Timeline */}
        <div className="max-w-4xl mx-auto">
          {roadmapItems.map((item, index) => (
            <RoadmapItem 
              key={item.id} 
              item={item} 
              isLast={index === roadmapItems.length - 1} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Roadmap;
