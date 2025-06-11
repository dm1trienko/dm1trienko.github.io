export const defaultLocale = "ru" as const
export const locales = ["ru", "en"] as const

export type Locale = (typeof locales)[number]

export const translations = {
  ru: {
    nav: {
      home: "Главная",
      blog: "Блог",
      roadmap: "Life Roadmap",
      culttech: "CultTech Hub",
      contacts: "Контакты",
    },
    home: {
      title: "Еремей",
      subtitle: "Студент • Исследователь • Визионер",
      intro: "Добро пожаловать в мой цифровой мир, где пересекаются культура, технологии и предпринимательство.",
      cta: "Исследовать портфолио",
      announcements: "Анонсы",
      latest: "Последние записи",
    },
    blog: {
      title: "Блог",
      subtitle: "Мысли о культуре, технологиях и жизни",
      readMore: "Читать далее",
    },
    roadmap: {
      title: "Life Roadmap",
      subtitle: "Путешествие через образование и опыт",
    },
    culttech: {
      title: "CultTech Hub",
      subtitle: "Пространство для нетворкинга и обмена идеями",
      description: "Интерактивная платформа для связи единомышленников в области культуры, IT и предпринимательства.",
    },
    contacts: {
      title: "Контакты",
      subtitle: "Давайте создадим что-то великое вместе",
      email: "Email",
      social: "Социальные сети",
    },
  },
  en: {
    nav: {
      home: "Home",
      blog: "Blog",
      roadmap: "Life Roadmap",
      culttech: "CultTech Hub",
      contacts: "Contacts",
    },
    home: {
      title: "Eremeya",
      subtitle: "Student • Researcher • Visionary",
      intro: "Welcome to my digital world where culture, technology, and entrepreneurship intersect.",
      cta: "Explore Portfolio",
      announcements: "Announcements",
      latest: "Latest Posts",
    },
    blog: {
      title: "Blog",
      subtitle: "Thoughts on culture, technology, and life",
      readMore: "Read More",
    },
    roadmap: {
      title: "Life Roadmap",
      subtitle: "Journey through education and experience",
    },
    culttech: {
      title: "CultTech Hub",
      subtitle: "Space for networking and idea exchange",
      description: "Interactive platform for connecting like-minded individuals in culture, IT, and entrepreneurship.",
    },
    contacts: {
      title: "Contacts",
      subtitle: "Let's create something great together",
      email: "Email",
      social: "Social Media",
    },
  },
}

export function getTranslations(locale: Locale) {
  return translations[locale] || translations[defaultLocale]
}
