"use client"

import Link from "next/link"
import { ArrowRight, Calendar, Clock, Tag, Search } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Header from "@/components/layout/header"
import { getTranslations, defaultLocale } from "@/lib/i18n"

export default function BlogPage() {
  const translations = getTranslations(defaultLocale)

  const blogPosts = [
    {
      id: "text-1",
      title: "Размышления о культуре в цифровую эпоху",
      excerpt:
        "Как технологии меняют наше восприятие культурного наследия и какие новые формы искусства появляются в результате цифровой трансформации. Исследование влияния виртуальной реальности на музейное дело.",
      date: "15 января 2024",
      readTime: "5 мин",
      tags: ["Культура", "Технологии", "Искусство", "VR"],
      category: "Культура",
      featured: true,
    },
    {
      id: "text-2",
      title: "Предпринимательство и социальная ответственность",
      excerpt:
        "Роль молодых предпринимателей в создании устойчивого будущего. Как совместить коммерческий успех с положительным социальным воздействием и почему ESG-критерии становятся новым стандартом.",
      date: "10 января 2024",
      readTime: "7 мин",
      tags: ["Предпринимательство", "ESG", "Социум", "Устойчивость"],
      category: "Бизнес",
      featured: false,
    },
    {
      id: "text-3",
      title: "IT-образование: вызовы и возможности",
      excerpt:
        "Личный опыт изучения технологий и построения карьеры в IT. Советы для студентов и размышления о будущем образования в эпоху искусственного интеллекта и автоматизации.",
      date: "5 января 2024",
      readTime: "6 мин",
      tags: ["Образование", "IT", "Карьера", "AI"],
      category: "Технологии",
      featured: false,
    },
  ]

  const categories = ["Все", "Культура", "Технологии", "Бизнес"]

  return (
    <div className="min-h-screen old-money-gradient">
      <Header locale={defaultLocale} translations={translations} />

      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-gold-100 dark:bg-gold-900/30 text-gold-800 dark:text-gold-300 text-sm font-medium rounded-full mb-6">
              Мысли и исследования
            </span>
            <h1 className="font-serif text-5xl sm:text-6xl font-bold old-money-text-primary mb-6">
              {translations.blog.title}
            </h1>
            <p className="text-xl old-money-text-secondary max-w-3xl mx-auto leading-relaxed">
              {translations.blog.subtitle}
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mb-12">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-8">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 old-money-text-secondary" />
                <Input placeholder="Поиск по статьям..." className="old-money-input pl-10 focus-visible:focus" />
              </div>

              <div className="flex gap-2 flex-wrap">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={category === "Все" ? "default" : "outline"}
                    size="sm"
                    className={category === "Все" ? "old-money-button-primary" : "old-money-button-secondary"}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Featured Post */}
          {blogPosts
            .filter((post) => post.featured)
            .map((post) => (
              <Link key={post.id} href={`/blog/${post.id}`} className="block mb-12">
                <Card className="old-money-card old-money-card-hover border-0 overflow-hidden cursor-pointer">
                  <div className="md:flex">
                    <div className="md:w-1/3 bg-gradient-to-br from-gold-100 to-stone-100 dark:from-gold-900/20 dark:to-stone-800/20 p-8 flex items-center justify-center">
                      <div className="text-center">
                        <span className="inline-block px-3 py-1 bg-gold-200 dark:bg-gold-800 text-gold-800 dark:text-gold-200 text-xs font-medium rounded-full mb-4">
                          Рекомендуемое
                        </span>
                        <div className="old-money-text-accent font-serif text-lg font-semibold">{post.category}</div>
                      </div>
                    </div>
                    <div className="md:w-2/3 p-8">
                      <CardHeader className="p-0 mb-4">
                        <div className="flex items-center text-sm old-money-text-secondary mb-3 space-x-4">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            {post.date}
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            {post.readTime}
                          </div>
                        </div>
                        <CardTitle className="text-3xl font-serif old-money-text-primary hover:old-money-text-accent transition-colors leading-tight">
                          {post.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <CardDescription className="old-money-text-secondary mb-4 text-base leading-relaxed">
                          {post.excerpt}
                        </CardDescription>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {post.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-3 py-1 bg-stone-100 dark:bg-stone-800 old-money-text-secondary text-sm rounded-full"
                            >
                              <Tag className="w-3 h-3 mr-1" />
                              {tag}
                            </span>
                          ))}
                        </div>

                        <div className="old-money-link inline-flex items-center font-medium text-lg focus-visible:focus">
                          {translations.blog.readMore}
                          <ArrowRight className="ml-2 w-5 h-5" />
                        </div>
                      </CardContent>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}

          {/* Regular Posts */}
          <div className="grid md:grid-cols-2 gap-8">
            {blogPosts
              .filter((post) => !post.featured)
              .map((post) => (
                <Link key={post.id} href={`/blog/${post.id}`} className="block">
                  <Card className="old-money-card old-money-card-hover border-0 group h-full cursor-pointer">
                    <CardHeader>
                      <div className="flex items-center justify-between text-sm old-money-text-secondary mb-3">
                        <span className="px-3 py-1 bg-stone-100 dark:bg-stone-800 rounded-full text-xs font-medium">
                          {post.category}
                        </span>
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {post.date}
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {post.readTime}
                          </div>
                        </div>
                      </div>
                      <CardTitle className="text-2xl font-serif old-money-text-primary group-hover:old-money-text-accent transition-colors duration-300 leading-tight">
                        {post.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="old-money-text-secondary mb-6 leading-relaxed">
                        {post.excerpt}
                      </CardDescription>

                      <div className="flex flex-wrap gap-2 mb-6">
                        {post.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-1 bg-stone-100 dark:bg-stone-800 old-money-text-secondary text-xs rounded-full"
                          >
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="old-money-link inline-flex items-center font-medium focus-visible:focus">
                        {translations.blog.readMore}
                        <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </div>

          {/* Newsletter Signup */}
          <div className="mt-20 text-center">
            <Card className="old-money-card border-0 max-w-2xl mx-auto">
              <CardContent className="p-12">
                <h3 className="font-serif text-2xl font-bold old-money-text-primary mb-4">Подписаться на обновления</h3>
                <p className="old-money-text-secondary mb-8 leading-relaxed">
                  Получайте уведомления о новых статьях и исследованиях на пересечении культуры и технологий
                </p>
                <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                  <Input placeholder="Ваш email" className="old-money-input flex-1 focus-visible:focus" />
                  <Button className="old-money-button-primary focus-visible:focus">Подписаться</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
