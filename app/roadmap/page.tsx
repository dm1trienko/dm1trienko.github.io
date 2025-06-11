"use client"

import { GraduationCap, Briefcase, Award, Code, Users, Lightbulb, Star, MapPin } from "lucide-react"
import Header from "@/components/layout/header"
import { getTranslations, defaultLocale } from "@/lib/i18n"

export default function RoadmapPage() {
  const translations = getTranslations(defaultLocale)

  const milestones = [
    {
      year: "2024",
      title: "Запуск CultTech Hub",
      description:
        "Создание интерактивной платформы для нетворкинга в области культуры и технологий. Объединение единомышленников для создания инновационных проектов на стыке искусства и IT.",
      type: "project",
      icon: Lightbulb,
      status: "current",
      location: "Москва, Россия",
      achievements: ["500+ участников", "12 успешных коллабораций", "3 стартапа"],
    },
    {
      year: "2023",
      title: "Изучение Full-Stack разработки",
      description:
        "Глубокое погружение в современные веб-технологии: React, Node.js, TypeScript, базы данных. Создание портфолио из 8 проектов различной сложности.",
      type: "education",
      icon: Code,
      status: "completed",
      location: "Онлайн / Москва",
      achievements: ["8 завершенных проектов", "Сертификация", "Ментор для 5 студентов"],
    },
    {
      year: "2023",
      title: "Участие в стартап-акселераторе",
      description:
        "Интенсивная программа развития предпринимательских навыков, работы в команде и создания MVP. Изучение основ венчурного финансирования и масштабирования бизнеса.",
      type: "experience",
      icon: Users,
      status: "completed",
      location: "Сколково, Москва",
      achievements: ["Топ-10 проектов", "50,000₽ грант", "Менторство от экспертов"],
    },
    {
      year: "2022",
      title: "Поступление в университет",
      description:
        'Начало обучения по специальности "Информационные технологии" в ведущем техническом университете. Фокус на изучении алгоритмов, структур данных и современных технологий.',
      type: "education",
      icon: GraduationCap,
      status: "completed",
      location: "Москва, Россия",
      achievements: ["Средний балл 4.8", "Староста группы", "Участие в 3 хакатонах"],
    },
    {
      year: "2022",
      title: "Первый IT-проект",
      description:
        "Разработка веб-приложения для локального культурного центра. Создание системы управления мероприятиями и онлайн-бронирования билетов с интеграцией платежных систем.",
      type: "project",
      icon: Briefcase,
      status: "completed",
      location: "Москва, Россия",
      achievements: ["1000+ пользователей", "Рост посещаемости на 40%", "Положительные отзывы"],
    },
    {
      year: "2021",
      title: "Победа в олимпиаде по программированию",
      description:
        "Региональный этап всероссийской олимпиады школьников по информатике. Решение сложных алгоритмических задач и участие в командных соревнованиях.",
      type: "achievement",
      icon: Award,
      status: "completed",
      location: "Москва, Россия",
      achievements: ["1 место в регионе", "Призер федерального этапа", "Рекомендация в вуз"],
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "current":
        return "bg-gold-500 shadow-gold-500/30"
      case "completed":
        return "bg-forest-600 shadow-forest-600/30"
      default:
        return "bg-sage-400"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "education":
        return "text-navy-600 dark:text-navy-400 bg-navy-100 dark:bg-navy-900/30"
      case "project":
        return "text-gold-700 dark:text-gold-400 bg-gold-100 dark:bg-gold-900/30"
      case "experience":
        return "text-forest-700 dark:text-forest-400 bg-forest-100 dark:bg-forest-900/30"
      case "achievement":
        return "text-sage-700 dark:text-sage-400 bg-sage-100 dark:bg-sage-900/30"
      default:
        return "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30"
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "education":
        return "Образование"
      case "project":
        return "Проект"
      case "experience":
        return "Опыт"
      case "achievement":
        return "Достижение"
      default:
        return type
    }
  }

  return (
    <div className="min-h-screen old-money-gradient">
      <Header locale={defaultLocale} translations={translations} />

      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-20">
            <span className="inline-block px-4 py-2 bg-gold-100 dark:bg-gold-900/30 text-gold-800 dark:text-gold-300 text-sm font-medium rounded-full mb-6">
              Путешествие длиною в жизнь
            </span>
            <h1 className="font-serif text-5xl sm:text-6xl font-bold old-money-text-primary mb-6">
              {translations.roadmap.title}
            </h1>
            <p className="text-xl old-money-text-secondary max-w-3xl mx-auto leading-relaxed">
              {translations.roadmap.subtitle}
            </p>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-gold-300 via-sage-300 to-forest-300 dark:from-gold-600 dark:via-sage-600 dark:to-forest-600 rounded-full opacity-60"></div>

            {/* Milestones */}
            <div className="space-y-16">
              {milestones.map((milestone, index) => {
                const IconComponent = milestone.icon
                return (
                  <div
                    key={index}
                    className="relative flex items-start animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Timeline dot */}
                    <div
                      className={`absolute left-6 w-6 h-6 rounded-full ${getStatusColor(milestone.status)} border-4 border-white dark:border-gray-900 z-10 shadow-lg`}
                    >
                      {milestone.status === "current" && (
                        <div className="absolute inset-0 rounded-full bg-gold-400 animate-ping opacity-75"></div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="ml-20 old-money-card old-money-card-hover border-0 p-8 w-full">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6">
                        <div className="flex items-center space-x-4 mb-4 lg:mb-0">
                          <div className="p-3 rounded-xl bg-gradient-to-br from-ivory-100 to-sage-100 dark:from-forest-800 dark:to-navy-800">
                            <IconComponent className="w-6 h-6 old-money-text-accent" />
                          </div>
                          <div>
                            <span
                              className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${getTypeColor(milestone.type)}`}
                            >
                              {getTypeLabel(milestone.type)}
                            </span>
                            <div className="flex items-center mt-2 text-sm old-money-text-secondary">
                              <MapPin className="w-4 h-4 mr-1" />
                              {milestone.location}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-3xl font-serif font-bold old-money-text-accent mb-2">
                            {milestone.year}
                          </div>
                          {milestone.status === "current" && (
                            <span className="inline-flex items-center px-3 py-1 bg-gold-100 dark:bg-gold-900/30 text-gold-800 dark:text-gold-300 text-xs font-medium rounded-full">
                              <Star className="w-3 h-3 mr-1" />
                              Текущий
                            </span>
                          )}
                        </div>
                      </div>

                      <h3 className="font-serif text-2xl font-bold old-money-text-primary mb-4 leading-tight">
                        {milestone.title}
                      </h3>

                      <p className="old-money-text-secondary leading-relaxed text-lg mb-6">{milestone.description}</p>

                      {/* Achievements */}
                      <div>
                        <h4 className="font-semibold old-money-text-primary mb-3">Ключевые достижения:</h4>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {milestone.achievements.map((achievement, idx) => (
                            <div
                              key={idx}
                              className="flex items-center space-x-2 p-3 bg-sage-50 dark:bg-forest-800/50 rounded-lg"
                            >
                              <div className="w-2 h-2 bg-gold-500 rounded-full flex-shrink-0"></div>
                              <span className="text-sm old-money-text-secondary font-medium">{achievement}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Future Plans */}
          <div className="mt-20 text-center">
            <div className="old-money-card border-0 p-12 max-w-4xl mx-auto">
              <div className="mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gold-100 to-sage-100 dark:from-gold-900/30 dark:to-forest-800/30 rounded-full mb-6">
                  <Lightbulb className="w-8 h-8 old-money-text-accent" />
                </div>
                <h3 className="font-serif text-3xl font-bold old-money-text-primary mb-4">Планы на будущее</h3>
              </div>

              <div className="grid md:grid-cols-3 gap-8 text-left">
                <div className="space-y-3">
                  <h4 className="font-serif text-lg font-semibold old-money-text-primary">2025-2026</h4>
                  <ul className="space-y-2 old-money-text-secondary">
                    <li>• Магистратура по AI/ML</li>
                    <li>• Международная стажировка</li>
                    <li>• Масштабирование CultTech Hub</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-serif text-lg font-semibold old-money-text-primary">2027-2028</h4>
                  <ul className="space-y-2 old-money-text-secondary">
                    <li>• Запуск технологической компании</li>
                    <li>• Участие в международных конференциях</li>
                    <li>• Менторство молодых предпринимателей</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-serif text-lg font-semibold old-money-text-primary">2029+</h4>
                  <ul className="space-y-2 old-money-text-secondary">
                    <li>• Глобальная экспансия проектов</li>
                    <li>• Создание образовательных программ</li>
                    <li>• Инвестиции в культурные инновации</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
