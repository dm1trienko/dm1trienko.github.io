
import { BlogPost, RoadmapItem, CultTechContact } from '../types';

export const blogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'Text-1',
    excerpt: 'Первая запись блога - скоро здесь будет интересный контент о пересечении культуры и технологий.',
    date: '2024-06-01',
    slug: 'text-1',
    tags: ['Culture', 'Technology']
  },
  {
    id: '2',
    title: 'Text-2',
    excerpt: 'Вторая запись - размышления о современном предпринимательстве и его влиянии на общество.',
    date: '2024-06-05',
    slug: 'text-2',
    tags: ['Entrepreneurship', 'Society']
  },
  {
    id: '3',
    title: 'Text-3',
    excerpt: 'Третья запись - анализ трендов в IT-сфере и их связь с культурными процессами.',
    date: '2024-06-10',
    slug: 'text-3',
    tags: ['IT', 'Culture', 'Trends']
  }
];

export const roadmapItems: RoadmapItem[] = [
  {
    id: '1',
    year: '2023',
    title: 'Поступление в университет',
    description: 'Начало обучения по специальности "Информационные технологии"',
    type: 'education',
    location: 'Москва'
  },
  {
    id: '2',
    year: '2023',
    title: 'Первые проекты',
    description: 'Создание первых веб-приложений и изучение современных технологий',
    type: 'work'
  },
  {
    id: '3',
    year: '2024',
    title: 'CultTech Hub',
    description: 'Запуск платформы для нетворкинга в области культуры и технологий',
    type: 'achievement'
  },
  {
    id: '4',
    year: '2024',
    title: 'Изучение предпринимательства',
    description: 'Углубленное изучение основ бизнеса и стартап-экосистемы',
    type: 'education'
  }
];

export const cultTechContacts: CultTechContact[] = [
  {
    id: '1',
    name: 'Анна Смирнова',
    field: 'Digital Art',
    description: 'Цифровой художник, работающий на стыке искусства и технологий',
    tags: ['Culture', 'IT'],
    contact: '@anna_digital_art'
  },
  {
    id: '2',
    name: 'Михаил Петров',
    field: 'Tech Startup',
    description: 'Основатель EdTech стартапа, инвестор в культурные проекты',
    tags: ['IT', 'Entrepreneurship'],
    contact: '@mikhail_edtech'
  },
  {
    id: '3',
    name: 'Елена Волкова',
    field: 'Cultural Management',
    description: 'Менеджер культурных проектов с опытом в IT-интеграции',
    tags: ['Culture', 'Entrepreneurship'],
    contact: '@elena_culture_tech'
  },
  {
    id: '4',
    name: 'Дмитрий Козлов',
    field: 'AI Research',
    description: 'Исследователь ИИ, интересуется применением в креативных индустриях',
    tags: ['IT'],
    contact: '@dmitry_ai_researcher'
  },
  {
    id: '5',
    name: 'София Лебедева',
    field: 'Creative Industries',
    description: 'Предприниматель в сфере креативных индустрий и новых медиа',
    tags: ['Culture', 'Entrepreneurship'],
    contact: '@sofia_creative'
  },
  {
    id: '6',
    name: 'Алексей Морозов',
    field: 'Blockchain',
    description: 'Blockchain-разработчик, создающий платформы для культурного сектора',
    tags: ['IT', 'Culture'],
    contact: '@alexey_blockchain'
  }
];
