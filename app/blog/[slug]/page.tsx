"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Calendar, Clock, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import Header from "@/components/layout/header"
import { getTranslations, defaultLocale } from "@/lib/i18n"

export default function BlogPostPage() {
  const params = useParams()
  const translations = getTranslations(defaultLocale)
  const slug = params.slug as string

  // Заглушки для постов
  const posts = {
    "text-1": {
      title: "Размышления о культуре в цифровую эпоху",
      date: "2024-01-15",
      readTime: "5 мин",
      tags: ["Культура", "Технологии", "Искусство"],
      content: `
        <p>В эпоху цифровых технологий культура претерпевает кардинальные изменения. Мы наблюдаем, как традиционные формы искусства адаптируются к новым реалиям, а цифровые платформы становятся новыми музеями и галереями.</p>
        
        <h2>Цифровая трансформация культуры</h2>
        <p>Виртуальные выставки, NFT-искусство, интерактивные инсталляции — все это меняет наше понимание того, что такое культурное пространство. Границы между физическим и цифровым миром стираются.</p>
        
        <h2>Новые возможности для творчества</h2>
        <p>Технологии открывают невиданные ранее возможности для художников и культурных деятелей. Искусственный интеллект, виртуальная реальность, блокчейн — все это становится инструментами современного искусства.</p>
        
        <p>Важно помнить, что технологии должны служить культуре, а не заменять ее. Наша задача — найти баланс между инновациями и сохранением культурного наследия.</p>
      `,
    },
    "text-2": {
      title: "Предпринимательство и социальная ответственность",
      date: "2024-01-10",
      readTime: "7 мин",
      tags: ["Предпринимательство", "ESG", "Социум"],
      content: `
        <p>Современное предпринимательство не может существовать в отрыве от социальной ответственности. Молодые предприниматели все чаще задаются вопросом: как создать успешный бизнес, который приносит пользу обществу?</p>
        
        <h2>ESG как новый стандарт</h2>
        <p>Environmental, Social, and Governance (ESG) критерии становятся неотъемлемой частью современного бизнеса. Инвесторы все чаще обращают внимание не только на финансовые показатели, но и на социальное воздействие компаний.</p>
        
        <h2>Социальное предпринимательство</h2>
        <p>Растет число стартапов, которые изначально создаются для решения социальных проблем. Это не просто благотворительность — это устойчивые бизнес-модели, которые генерируют прибыль через создание социальной ценности.</p>
        
        <p>Будущее за теми предпринимателями, которые смогут совместить коммерческий успех с положительным воздействием на общество и окружающую среду.</p>
      `,
    },
    "text-3": {
      title: "IT-образование: вызовы и возможности",
      date: "2024-01-05",
      readTime: "6 мин",
      tags: ["Образование", "IT", "Карьера"],
      content: `
        <p>IT-образование переживает период кардинальных изменений. Традиционные университетские программы не всегда успевают за быстро развивающимися технологиями, а онлайн-курсы и буткемпы предлагают альтернативные пути в профессию.</p>
        
        <h2>Личный опыт обучения</h2>
        <p>За время изучения программирования я попробовал различные подходы: от классического университетского образования до самостоятельного изучения и участия в интенсивных курсах. Каждый подход имеет свои преимущества.</p>
        
        <h2>Важность практики</h2>
        <p>Теоретические знания важны, но без практического применения они остаются мертвым грузом. Участие в реальных проектах, open source разработке, создание собственных приложений — вот что действительно формирует профессионала.</p>
        
        <h2>Soft skills в IT</h2>
        <p>Техническими навыками дело не ограничивается. Умение работать в команде, коммуницировать с заказчиками, презентовать свои идеи — эти навыки становятся все более важными в IT-индустрии.</p>
        
        <p>Совет начинающим: не бойтесь экспериментировать, участвуйте в сообществах, делитесь своими знаниями. IT — это не только код, это целая экосистема людей и идей.</p>
      `,
    },
  }

  const post = posts[slug as keyof typeof posts]

  if (!post) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Header locale={defaultLocale} translations={translations} />
        <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Статья не найдена</h1>
            <Button asChild>
              <Link href="/blog">Вернуться к блогу</Link>
            </Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header locale={defaultLocale} translations={translations} />

      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Button variant="ghost" asChild className="mb-8">
            <Link href="/blog" className="inline-flex items-center">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад к блогу
            </Link>
          </Button>

          {/* Article Header */}
          <header className="mb-12">
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4 space-x-4">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                {post.date}
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                {post.readTime}
              </div>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              {post.title}
            </h1>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm rounded-full"
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          </header>

          {/* Article Content */}
          <article className="prose prose-lg dark:prose-invert max-w-none">
            <div
              dangerouslySetInnerHTML={{ __html: post.content }}
              className="text-gray-700 dark:text-gray-300 leading-relaxed"
            />
          </article>

          {/* Article Footer */}
          <footer className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <Button variant="outline" asChild>
                <Link href="/blog">← Все статьи</Link>
              </Button>
              <Button asChild>
                <Link href="/contacts">Обсудить статью</Link>
              </Button>
            </div>
          </footer>
        </div>
      </main>
    </div>
  )
}
