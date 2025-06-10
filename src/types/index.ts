
export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  slug: string;
  tags: string[];
}

export interface RoadmapItem {
  id: string;
  year: string;
  title: string;
  description: string;
  type: 'education' | 'work' | 'achievement' | 'personal';
  location?: string;
}

export interface CultTechContact {
  id: string;
  name: string;
  field: string;
  description: string;
  tags: string[];
  contact: string;
  avatar?: string;
}

export interface ContactForm {
  name: string;
  email: string;
  message: string;
}

export interface CultTechForm {
  name: string;
  field: string;
  description: string;
  contact: string;
  tags: string[];
}

export type Language = 'ru' | 'en';
