"use client"

import { useState } from "react"
import { Users, MessageCircle, Calendar, Code, Palette, TrendingUp, Star, ArrowRight, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Header from "@/components/layout/header"
import { getTranslations, defaultLocale } from "@/lib/i18n"

export default function CultTechPage() {
  const translations = getTranslations(defaultLocale)
  const [activeTab, setActiveTab] = useState("overview")

  const topics = [
    {
      id: "culture",
      title: "Культура",
      icon: Palette,
      description: "Искусство, литература, культурное наследие и их цифровая трансформация",
      members: 127,
      discussions: 45,
      trending: true,
      color: "from-rose-100 to-pink-100 dark:from-rose-900/20 dark:to-pink-900/20",
      iconColor: "text-rose-600 dark:text-rose-400",
    },
    {
      id: "tech",
      title: "Технологии",
      icon: Code,
      description: "IT, разработка, инновации и их применение в культурной сфере",
      members: 203,
      discussions: 78,
      trending: true,
      color: "from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      id: "business",
      title: "Предпринимательство",
      icon: TrendingUp,
      description: "Стартапы, бизнес-идеи, инвестиции в культурные и технологические проекты",
      members: 156,
      discussions: 62,
      trending: false,
      color: "from-emerald-100 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/20",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
  ]

  const upcomingEvents = [
    {
      title: "Воркшоп: AI в искусстве",
      description: "Практическое применение искусственного интеллекта в создании цифрового искусства",
      date: "15 февраля 2024",
      time: "19:00",
      participants: 24,
      maxParticipants: 30,
      type: "Воркшоп",
      location: "Онлайн",
    },
    {
      title: "Нетворкинг: Tech & Culture",
      description: "Встреча профессионалов из сферы технологий и культуры для обмена опытом",
      date: "20 февраля 2024",
      time: "18:30",
      participants: 31,
      maxParticipants: 50,
      type: "Нетворкинг",
      location: "Москва",
    },
    {
      title: "Питч-сессия стартапов",
      description: "Презентация инновационных проектов на стыке культуры и технологий",
      date: "25 февраля 2024",
      time: "17:00",
      participants: 18,
      maxParticipants: 25,
      type: "Питч",
      location: "Сколково",
    },
  ]

  const recentDiscussions = [
    {
      title: "Как NFT меняют арт-рынок?",
      author: "Анна К.",
      replies: 12,
      topic: "culture",
      lastActivity: "2 часа назад",
      excerpt: "Обсуждение влияния блокчейн-технологий на традиционный арт-рынок...",
    },
    {
      title: "Лучшие фреймворки для MVP культурных проектов",
      author: "Дмитрий М.",
      replies: 8,
      topic: "tech",
      lastActivity: "4 часа назад",
      excerpt: "Сравнение технологических решений для быстрого прототипирования...",
    },
    {
      title: "Поиск co-founder для EdTech проекта",
      author: "Елена С.",
      replies: 15,
      topic: "business",
      lastActivity: "6 часов назад",
      excerpt: "Ищу технического соучредителя для образовательной платформы...",
    },
  ]

  const stats = [
    { label: "Участники", value: "486", change: "+23 за неделю", icon: Users, color: "text-blue-600" },
    { label: "Обсуждения", value: "185", change: "+12 за неделю", icon: MessageCircle, color: "text-emerald-600" },
    { label: "События", value: "12", change: "в этом месяце", icon: Calendar, color: "text-amber-600" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-ivory-50 via-sage-50 to-ivory-100 dark:from-forest-900 dark:via-navy-900 dark:to-forest-800">
      <Header locale={defaultLocale} translations={translations} />

      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-sm font-medium rounded-full mb-6">
              Сообщество единомышленников
            </span>
            <h1 className="font-serif text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              {translations.culttech.title}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto mb-8 leading-relaxed">
              {translations.culttech.description}
            </p>
            <Button size="lg" className="bg-forest-700 hover:bg-forest-800 text-white px-8 py-4 text-lg font-medium">
              <Plus className="w-5 h-5 mr-2" />
              Присоединиться к сообществу
            </Button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex justify-center mb-12">
            <div className="flex space-x-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-1 shadow-lg">
              {[
                { id: "overview", label: "Обзор" },
                { id: "topics", label: "Темы" },
                { id: "events", label: "События" },
                { id: "discussions", label: "Обсуждения" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-forest-700 text-white shadow-md"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content based on active tab */}
          {activeTab === "overview" && (
            <div className="space-y-12">
              {/* Stats */}
              <div className="grid md:grid-cols-3 gap-6">
                {stats.map((stat, index) => {
                  const IconComponent = stat.icon
                  return (
                    <Card
                      key={index}
                      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <IconComponent className={`w-8 h-8 ${stat.color}`} />
                          <div className="text-right">
                            <div className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{stat.change}</p>
                          </div>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{stat.label}</h3>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Quick Join */}
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-white mb-6">Популярные темы</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    {topics.slice(0, 2).map((topic) => {
                      const IconComponent = topic.icon
                      return (
                        <Card
                          key={topic.id}
                          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group"
                        >
                          <CardContent className="p-6">
                            <div
                              className={`w-full h-24 bg-gradient-to-r ${topic.color} rounded-lg mb-4 flex items-center justify-center`}
                            >
                              <IconComponent className={`w-8 h-8 ${topic.iconColor}`} />
                            </div>
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-serif text-xl font-semibold text-gray-900 dark:text-white">
                                {topic.title}
                              </h3>
                              {topic.trending && (
                                <span className="flex items-center text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-2 py-1 rounded-full">
                                  <Star className="w-3 h-3 mr-1" />
                                  Популярно
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">{topic.description}</p>
                            <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                              <span>{topic.members} участников</span>
                              <span>{topic.discussions} обсуждений</span>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>

                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="font-serif text-xl">Быстрое подключение</CardTitle>
                    <CardDescription>Присоединяйтесь к обсуждениям и событиям</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input placeholder="Ваше имя" className="bg-white/50 dark:bg-gray-700/50" />
                    <Input placeholder="Email" type="email" className="bg-white/50 dark:bg-gray-700/50" />
                    <Textarea
                      placeholder="Расскажите о ваших интересах"
                      rows={3}
                      className="bg-white/50 dark:bg-gray-700/50"
                    />
                    <Button className="w-full bg-forest-700 hover:bg-forest-800">Присоединиться</Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "topics" && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topics.map((topic) => {
                const IconComponent = topic.icon
                return (
                  <Card
                    key={topic.id}
                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group"
                  >
                    <CardContent className="p-6">
                      <div
                        className={`w-full h-32 bg-gradient-to-r ${topic.color} rounded-lg mb-6 flex items-center justify-center`}
                      >
                        <IconComponent className={`w-12 h-12 ${topic.iconColor}`} />
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-serif text-xl font-semibold text-gray-900 dark:text-white">
                          {topic.title}
                        </h3>
                        {topic.trending && (
                          <span className="flex items-center text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-2 py-1 rounded-full">
                            <Star className="w-3 h-3 mr-1" />
                            Популярно
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 mb-6">{topic.description}</p>
                      <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                        <span>{topic.members} участников</span>
                        <span>{topic.discussions} обсуждений</span>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full group-hover:bg-forest-700 group-hover:text-white group-hover:border-forest-700 transition-all duration-200"
                      >
                        Присоединиться
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {activeTab === "events" && (
            <div className="space-y-6">
              {upcomingEvents.map((event, index) => (
                <Card
                  key={index}
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <CardContent className="p-8">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex-1 mb-6 lg:mb-0 lg:mr-8">
                        <div className="flex items-center space-x-3 mb-4">
                          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm font-medium rounded-full">
                            {event.type}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">{event.location}</span>
                        </div>
                        <h3 className="font-serif text-2xl font-bold text-gray-900 dark:text-white mb-3">
                          {event.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">{event.description}</p>
                        <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            {event.date} в {event.time}
                          </div>
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-2" />
                            {event.participants}/{event.maxParticipants} участников
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-3">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">{event.participants}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">из {event.maxParticipants}</div>
                        </div>
                        <Button className="bg-forest-700 hover:bg-forest-800 px-6">Участвовать</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {activeTab === "discussions" && (
            <div className="space-y-6">
              {recentDiscussions.map((discussion, index) => (
                <Card
                  key={index}
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <span
                            className={`px-3 py-1 text-xs rounded-full font-medium ${
                              discussion.topic === "culture"
                                ? "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300"
                                : discussion.topic === "tech"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                            }`}
                          >
                            {topics.find((t) => t.id === discussion.topic)?.title}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">{discussion.lastActivity}</span>
                        </div>
                        <h3 className="font-serif text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-forest-700 dark:group-hover:text-forest-400 transition-colors">
                          {discussion.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-3">{discussion.excerpt}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                          <span>Автор: {discussion.author}</span>
                          <span>•</span>
                          <span>{discussion.replies} ответов</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
