import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin", "cyrillic"] })

export const metadata: Metadata = {
  title: "Еремей - Персональное портфолио",
  description: "Персональный сайт-портфолио студента Еремея. Культура, технологии, предпринимательство.",
  keywords: ["портфолио", "студент", "IT", "культура", "предпринимательство", "блог"],
  authors: [{ name: "Еремей" }],
  creator: "Еремей",
  publisher: "Еремей",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://eremeya.dev",
    title: "Еремей - Персональное портфолио",
    description: "Персональный сайт-портфолио студента Еремея. Культура, технологии, предпринимательство.",
    siteName: "Еремей Portfolio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Еремей - Персональное портфолио",
    description: "Персональный сайт-портфолио студента Еремея. Культура, технологии, предпринимательство.",
    creator: "@eremeya_dev",
  },
  viewport: "width=device-width, initial-scale=1",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="color-scheme" content="light dark" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">{children}</div>
      </body>
    </html>
  )
}
