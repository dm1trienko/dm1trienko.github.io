"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Menu, X, Globe, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Locale } from "@/lib/i18n"

interface HeaderProps {
  locale: Locale
  translations: any
}

export default function Header({ locale, translations }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navigation = [
    { name: translations.nav.home, href: "/" },
    { name: translations.nav.blog, href: "/blog" },
    { name: translations.nav.roadmap, href: "/roadmap" },
    { name: translations.nav.culttech, href: "/culttech" },
    { name: translations.nav.contacts, href: "/contacts" },
  ]

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? "old-money-nav shadow-lg" : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link
            href="/"
            className="font-serif text-2xl font-bold old-money-text-primary hover:old-money-text-accent transition-colors duration-300 focus-visible:focus"
          >
            Еремей
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href} className="old-money-link text-base focus-visible:focus">
                {item.name}
              </Link>
            ))}

            {/* Language Switcher */}
            <div className="flex items-center space-x-2 ml-6 pl-6 border-l border-stone-300 dark:border-stone-600">
              <Globe className="w-4 h-4 old-money-text-secondary" />
              <button
                onClick={() => {
                  // Toggle language logic here
                  console.log("Language toggle")
                }}
                className="old-money-link-subtle text-sm font-medium focus-visible:focus flex items-center"
              >
                {locale === "ru" ? "EN" : "RU"}
                <ChevronDown className="w-3 h-3 ml-1" />
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden old-money-text-primary hover:bg-stone-100 dark:hover:bg-stone-800 focus-visible:focus"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-6 border-t border-stone-200 dark:border-stone-700 old-money-nav">
            <div className="flex flex-col space-y-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="old-money-link text-lg px-2 py-2 focus-visible:focus"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="flex items-center space-x-3 px-2 py-2 mt-4 pt-4 border-t border-stone-200 dark:border-stone-700">
                <Globe className="w-4 h-4 old-money-text-secondary" />
                <button
                  onClick={() => {
                    console.log("Language toggle")
                    setIsMenuOpen(false)
                  }}
                  className="old-money-link-subtle font-medium focus-visible:focus"
                >
                  {locale === "ru" ? "English" : "Русский"}
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
