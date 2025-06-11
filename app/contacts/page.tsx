"use client"

import type React from "react"

import { useState } from "react"
import { Mail, MessageCircle, Send, Github, Linkedin, Twitter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Header from "@/components/layout/header"
import { getTranslations, defaultLocale } from "@/lib/i18n"

export default function ContactsPage() {
  const translations = getTranslations(defaultLocale)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log("Form submitted:", formData)
    // Reset form
    setFormData({ name: "", email: "", subject: "", message: "" })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const socialLinks = [
    {
      name: "GitHub",
      icon: Github,
      url: "https://github.com/eremeya",
      description: "Мои проекты и код",
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      url: "https://linkedin.com/in/eremeya",
      description: "Профессиональная сеть",
    },
    {
      name: "Twitter",
      icon: Twitter,
      url: "https://twitter.com/eremeya",
      description: "Мысли и обновления",
    },
  ]

  const contactMethods = [
    {
      title: "Email",
      description: "Для деловых предложений и сотрудничества",
      icon: Mail,
      contact: "hello@eremeya.dev",
      action: "Написать письмо",
    },
    {
      title: "Telegram",
      description: "Для быстрой связи и неформального общения",
      icon: MessageCircle,
      contact: "@eremeya_dev",
      action: "Написать в Telegram",
    },
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header locale={defaultLocale} translations={translations} />

      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              {translations.contacts.title}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {translations.contacts.subtitle}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Send className="w-5 h-5 mr-2" />
                    Отправить сообщение
                  </CardTitle>
                  <CardDescription>Заполните форму, и я отвечу в течение 24 часов</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="name"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >
                          Имя
                        </label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          placeholder="Ваше имя"
                          className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 focus:border-amber-500 dark:focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >
                          Email
                        </label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          placeholder="your@email.com"
                          className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 focus:border-amber-500 dark:focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="subject"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Тема
                      </label>
                      <Input
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        placeholder="О чем хотите поговорить?"
                        className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 focus:border-amber-500 dark:focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="message"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Сообщение
                      </label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={5}
                        placeholder="Расскажите подробнее о вашей идее или предложении..."
                        className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 focus:border-amber-500 dark:focus:border-amber-400"
                      />
                    </div>

                    <Button type="submit" className="w-full bg-forest-700 hover:bg-forest-800">
                      Отправить сообщение
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Contact Methods & Social */}
            <div className="space-y-8">
              {/* Direct Contact */}
              <div>
                <h3 className="font-serif text-xl font-semibold text-gray-900 dark:text-white mb-4">Прямая связь</h3>
                <div className="space-y-4">
                  {contactMethods.map((method, index) => {
                    const IconComponent = method.icon
                    return (
                      <Card key={index} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg">
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <IconComponent className="w-5 h-5 text-gray-500 mt-1" />
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 dark:text-white">{method.title}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{method.description}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                                  {method.contact}
                                </span>
                                <Button variant="outline" size="sm" className="bg-forest-700 hover:bg-forest-800">
                                  {method.action}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>

              {/* Social Media */}
              <div>
                <h3 className="font-serif text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  {translations.contacts.social}
                </h3>
                <div className="grid gap-4">
                  {socialLinks.map((social, index) => {
                    const IconComponent = social.icon
                    return (
                      <Card
                        key={index}
                        className="hover:shadow-md transition-shadow duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <IconComponent className="w-5 h-5 text-gray-500" />
                              <div>
                                <h4 className="font-medium text-gray-900 dark:text-white">{social.name}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{social.description}</p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" asChild className="bg-forest-700 hover:bg-forest-800">
                              <a href={social.url} target="_blank" rel="noopener noreferrer">
                                Перейти
                              </a>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>

              {/* Availability */}
              <Card className="bg-gray-50 dark:bg-gray-800">
                <CardContent className="p-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Время ответа</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Обычно отвечаю в течение 24 часов. Для срочных вопросов используйте Telegram.
                  </p>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Часовой пояс: UTC+3 (Москва)</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
