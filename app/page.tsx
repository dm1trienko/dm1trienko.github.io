"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { ArrowRight, Calendar, BookOpen, Sparkles, Users, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Header from "@/components/layout/header"
import { getTranslations, defaultLocale } from "@/lib/i18n"

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const translations = getTranslations(defaultLocale)

  useEffect(() => {
    // Enhanced hero animation
    if (heroRef.current) {
      heroRef.current.style.opacity = "0"
      heroRef.current.style.transform = "translateY(40px)"

      const timer = setTimeout(() => {
        if (heroRef.current) {
          heroRef.current.style.transition = "all 1.2s cubic-bezier(0.4, 0, 0.2, 1)"
          heroRef.current.style.opacity = "1"
          heroRef.current.style.transform = "translateY(0)"
        }
      }, 200)

      return () => clearTimeout(timer)
    }
  }, [])

  const blogPosts = [
    {
      id: "text-1",
      title: "Размышления о культуре в цифровую эпоху",
      excerpt: "Как технологии меняют наше восприятие культурного наследия и какие новые формы искусства появляются...",
      date: "15 января 2024",
      readTime: "5 мин",
      category: "Культура",
    },
    {
      id: "text-2",
      title: "Предпринимательство и социальная ответственность",
      excerpt: "Роль молодых предпринимателей в создании устойчивого будущего и социального воздействия...",
      date: "10 января 2024",
      readTime: "7 мин",
      category: "Бизнес",
    },
    {
      id: "text-3",
      title: "IT-образование: вызовы и возможности",
      excerpt: "Личный опыт изучения технологий и построения карьеры в современной IT-индустрии...",
      date: "5 января 2024",
      readTime: "6 мин",
      category: "Технологии",
    },
  ]

  const announcements = [
    {
      title: "Запуск CultTech Hub",
      description:
        "Новая интерактивная платформа для нетворкинга в области культуры и технологий готова к тестированию",
      date: "20 января 2024",
      icon: Sparkles,
      status: "Новое",
      link: "/culttech",
    },
    {
      title: "Участие в Tech Conference 2024",
      description: 'Выступление на международной конференции с докладом "Культура и технологии: синергия будущего"',
      date: "15 февраля 2024",
      icon: Users,
      status: "Скоро",
      link: "/contacts",
    },
  ]

  return (
    <div className="min-h-screen old-money-gradient">
      <Header locale={defaultLocale} translations={translations} />

      {/* Hero Section */}
      <section ref={heroRef} className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <div className="mb-8">
            <span className="inline-block px-4 py-2 bg-gold-100 dark:bg-gold-900/30 text-gold-800 dark:text-gold-300 text-sm font-medium rounded-full mb-6">
              Добро пожаловать в мой мир
            </span>
          </div>

          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold old-money-text-primary mb-8 leading-tight">
            {translations.home.title}
          </h1>

          <p className="text-2xl sm:text-3xl old-money-text-secondary mb-8 font-light leading-relaxed">
            {translations.home.subtitle}
          </p>

          <p className="text-xl old-money-text-secondary mb-12 max-w-3xl mx-auto leading-relaxed">
            {translations.home.intro}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              asChild
              size="lg"
              className="old-money-button-primary px-8 py-4 text-lg font-medium focus-visible:focus"
            >
              <Link href="/roadmap" className="inline-flex items-center">
                {translations.home.cta}
                <ArrowRight className="ml-3 w-5 h-5" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="old-money-button-secondary px-8 py-4 text-lg font-medium focus-visible:focus"
            >
              <Link href="/culttech" className="inline-flex items-center">
                <MessageCircle className="mr-3 w-5 h-5" />
                Присоединиться к сообществу
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Announcements Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl font-bold old-money-text-primary mb-6">
              {translations.home.announcements}
            </h2>
            <p className="text-xl old-money-text-secondary max-w-2xl mx-auto">
              Последние новости и предстоящие события
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {announcements.map((announcement, index) => {
              const IconComponent = announcement.icon
              return (
                <Link key={index} href={announcement.link} className="block">
                  <Card className="old-money-card old-money-card-hover border-0 h-full cursor-pointer">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gold-100 dark:bg-gold-900/30 rounded-lg">
                            <IconComponent className="w-5 h-5 old-money-text-accent" />
                          </div>
                          <span
                            className={`px-3 py-1 text-xs font-medium rounded-full ${
                              announcement.status === "Новое"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                            }`}
                          >
                            {announcement.status}
                          </span>
                        </div>
                        <div className="flex items-center text-sm old-money-text-secondary">
                          <Calendar className="w-4 h-4 mr-2" />
                          {announcement.date}
                        </div>
                      </div>
                      <CardTitle className="text-2xl font-serif old-money-text-primary hover:old-money-text-accent transition-colors">
                        {announcement.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="old-money-text-secondary text-base leading-relaxed">
                        {announcement.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Latest Blog Posts */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-stone-50/30 dark:bg-stone-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-16">
            <div>
              <h2 className="font-serif text-4xl font-bold old-money-text-primary mb-4">{translations.home.latest}</h2>
              <p className="text-xl old-money-text-secondary">Исследования на пересечении культуры и технологий</p>
            </div>
            <Button variant="outline" asChild className="old-money-button-secondary mt-6 sm:mt-0 focus-visible:focus">
              <Link href="/blog" className="inline-flex items-center">
                <BookOpen className="w-4 h-4 mr-2" />
                Все статьи
              </Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post, index) => (
              <Link key={post.id} href={`/blog/${post.id}`} className="block">
                <Card className="old-money-card old-money-card-hover border-0 group h-full cursor-pointer">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between text-sm old-money-text-secondary mb-3">
                      <span className="px-3 py-1 bg-stone-100 dark:bg-stone-800 rounded-full text-xs font-medium">
                        {post.category}
                      </span>
                      <div className="flex items-center space-x-3">
                        <span>{post.date}</span>
                        <span>•</span>
                        <span>{post.readTime}</span>
                      </div>
                    </div>
                    <CardTitle className="text-xl font-serif old-money-text-primary group-hover:old-money-text-accent transition-colors duration-300 leading-tight">
                      {post.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="old-money-text-secondary mb-6 leading-relaxed">
                      {post.excerpt}
                    </CardDescription>
                    <div className="old-money-link inline-flex items-center font-medium focus-visible:focus">
                      {translations.blog.readMore}
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-800 dark:bg-black text-cream-100 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12 mb-12">
            <div>
              <Link href="/" className="font-serif text-2xl font-bold mb-4 block hover:text-gold-400 transition-colors">
                Еремей
              </Link>
              <p className="text-stone-300 leading-relaxed">
                Исследователь на пересечении культуры, технологий и предпринимательства. Создаю мосты между традициями и
                инновациями.
              </p>
            </div>

            <div>
              <h4 className="font-serif text-lg font-semibold mb-4">Навигация</h4>
              <div className="space-y-3">
                {[
                  { name: translations.nav.blog, href: "/blog" },
                  { name: translations.nav.roadmap, href: "/roadmap" },
                  { name: translations.nav.culttech, href: "/culttech" },
                  { name: translations.nav.contacts, href: "/contacts" },
                ].map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="block text-stone-300 hover:text-gold-400 transition-colors duration-200 focus-visible:focus"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-serif text-lg font-semibold mb-4">Связь</h4>
              <div className="space-y-3">
                <a
                  href="mailto:hello@eremeya.dev"
                  className="block text-stone-300 hover:text-gold-400 transition-colors duration-200"
                >
                  hello@eremeya.dev
                </a>
                <a
                  href="https://t.me/eremeya_dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-stone-300 hover:text-gold-400 transition-colors duration-200"
                >
                  @eremeya_dev
                </a>
                <p className="text-stone-300">Москва, Россия</p>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-stone-700 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-stone-400 text-sm">© 2024 Еремей. Все права защищены.</p>
            <div className="flex space-x-6 mt-4 sm:mt-0">
              <button
                onClick={() => console.log("Privacy policy")}
                className="text-stone-400 hover:text-gold-400 text-sm transition-colors focus-visible:focus"
              >
                Конфиденциальность
              </button>
              <button
                onClick={() => console.log("Terms of service")}
                className="text-stone-400 hover:text-gold-400 text-sm transition-colors focus-visible:focus"
              >
                Условия использования
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
