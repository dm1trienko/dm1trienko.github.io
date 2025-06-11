// Main JavaScript functionality
class PortfolioSite {
  constructor() {
    this.init()
  }

  init() {
    this.setupNavigation()
    this.setupScrollEffects()
    this.setupLanguageToggle()
    this.setupAnimations()
    this.setupAccessibility()
  }

  // Navigation functionality
  setupNavigation() {
    const navToggle = document.getElementById("nav-toggle")
    const navMenu = document.getElementById("nav-menu")
    const navLinks = document.querySelectorAll(".nav-link")

    // Mobile menu toggle
    if (navToggle && navMenu) {
      navToggle.addEventListener("click", () => {
        navToggle.classList.toggle("active")
        navMenu.classList.toggle("active")

        // Update aria-expanded for accessibility
        const isExpanded = navMenu.classList.contains("active")
        navToggle.setAttribute("aria-expanded", isExpanded)
      })
    }

    // Close mobile menu when clicking on links
    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        if (navMenu.classList.contains("active")) {
          navToggle.classList.remove("active")
          navMenu.classList.remove("active")
          navToggle.setAttribute("aria-expanded", "false")
        }
      })
    })

    // Close mobile menu when clicking outside
    document.addEventListener("click", (e) => {
      if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
        navToggle.classList.remove("active")
        navMenu.classList.remove("active")
        navToggle.setAttribute("aria-expanded", "false")
      }
    })

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", function (e) {
        e.preventDefault()
        const target = document.querySelector(this.getAttribute("href"))
        if (target) {
          const headerHeight = document.querySelector(".header").offsetHeight
          const targetPosition = target.offsetTop - headerHeight

          window.scrollTo({
            top: targetPosition,
            behavior: "smooth",
          })
        }
      })
    })
  }

  // Scroll effects
  setupScrollEffects() {
    const header = document.getElementById("header")
    let lastScrollY = window.scrollY

    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // Add/remove scrolled class
      if (currentScrollY > 20) {
        header.classList.add("scrolled")
      } else {
        header.classList.remove("scrolled")
      }

      lastScrollY = currentScrollY
    }

    // Throttle scroll events for better performance
    let ticking = false
    window.addEventListener("scroll", () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll()
          ticking = false
        })
        ticking = true
      }
    })

    // Initial call
    handleScroll()
  }

  // Language toggle functionality
  setupLanguageToggle() {
    const langToggle = document.getElementById("lang-toggle")
    let currentLang = "ru"

    if (langToggle) {
      langToggle.addEventListener("click", () => {
        currentLang = currentLang === "ru" ? "en" : "ru"
        langToggle.textContent = currentLang.toUpperCase()

        // Here you would typically update the page content
        // For now, we'll just show a notification
        this.showNotification(`Язык изменен на ${currentLang === "ru" ? "русский" : "английский"}`)
      })
    }
  }

  // Animation setup
  setupAnimations() {
    // Intersection Observer for scroll animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1"
          entry.target.style.transform = "translateY(0)"
        }
      })
    }, observerOptions)

    // Observe elements for animation
    const animatedElements = document.querySelectorAll(".announcement-card, .blog-card")
    animatedElements.forEach((el, index) => {
      el.style.opacity = "0"
      el.style.transform = "translateY(30px)"
      el.style.transition = `opacity 0.6s ease-out ${index * 0.1}s, transform 0.6s ease-out ${index * 0.1}s`
      observer.observe(el)
    })

    // Parallax effect for hero section (subtle)
    const hero = document.querySelector(".hero")
    if (hero) {
      window.addEventListener("scroll", () => {
        const scrolled = window.pageYOffset
        const rate = scrolled * -0.5
        hero.style.transform = `translateY(${rate}px)`
      })
    }
  }

  // Accessibility enhancements
  setupAccessibility() {
    // Keyboard navigation for custom elements
    document.addEventListener("keydown", (e) => {
      // Escape key closes mobile menu
      if (e.key === "Escape") {
        const navToggle = document.getElementById("nav-toggle")
        const navMenu = document.getElementById("nav-menu")

        if (navMenu && navMenu.classList.contains("active")) {
          navToggle.classList.remove("active")
          navMenu.classList.remove("active")
          navToggle.setAttribute("aria-expanded", "false")
          navToggle.focus()
        }
      }
    })

    // Focus management for mobile menu
    const navMenu = document.getElementById("nav-menu")
    const navToggle = document.getElementById("nav-toggle")

    if (navMenu && navToggle) {
      navToggle.addEventListener("click", () => {
        if (navMenu.classList.contains("active")) {
          // Focus first link when menu opens
          setTimeout(() => {
            const firstLink = navMenu.querySelector(".nav-link")
            if (firstLink) firstLink.focus()
          }, 100)
        }
      })
    }

    // Announce page changes for screen readers
    this.announcePageChange()
  }

  // Utility functions
  showNotification(message) {
    // Create notification element
    const notification = document.createElement("div")
    notification.className = "notification"
    notification.textContent = message
    notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--color-warm-600);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-lg);
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease-out;
        `

    document.body.appendChild(notification)

    // Animate in
    setTimeout(() => {
      notification.style.transform = "translateX(0)"
    }, 100)

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.transform = "translateX(100%)"
      setTimeout(() => {
        document.body.removeChild(notification)
      }, 300)
    }, 3000)
  }

  announcePageChange() {
    // Create live region for screen readers
    const liveRegion = document.createElement("div")
    liveRegion.setAttribute("aria-live", "polite")
    liveRegion.setAttribute("aria-atomic", "true")
    liveRegion.className = "sr-only"
    liveRegion.style.cssText = `
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
        `
    document.body.appendChild(liveRegion)

    // Announce page load
    setTimeout(() => {
      liveRegion.textContent = "Страница загружена. Персональное портфолио Еремея."
    }, 1000)
  }

  // Performance optimization
  debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

  throttle(func, limit) {
    let inThrottle
    return function () {
      const args = arguments
      
      if (!inThrottle) {
        func.apply(this, args)
        inThrottle = true
        setTimeout(() => (inThrottle = false), limit)
      }
    }
  }
}

// Form handling utilities
class FormHandler {
  constructor() {
    this.setupForms()
  }

  setupForms() {
    const forms = document.querySelectorAll("form")
    forms.forEach((form) => {
      form.addEventListener("submit", this.handleSubmit.bind(this))
    })
  }

  handleSubmit(e) {
    e.preventDefault()
    const form = e.target
    const formData = new FormData(form)

    // Basic validation
    if (this.validateForm(form)) {
      this.submitForm(formData)
    }
  }

  validateForm(form) {
    const requiredFields = form.querySelectorAll("[required]")
    let isValid = true

    requiredFields.forEach((field) => {
      if (!field.value.trim()) {
        this.showFieldError(field, "Это поле обязательно для заполнения")
        isValid = false
      } else {
        this.clearFieldError(field)
      }
    })

    // Email validation
    const emailFields = form.querySelectorAll('input[type="email"]')
    emailFields.forEach((field) => {
      if (field.value && !this.isValidEmail(field.value)) {
        this.showFieldError(field, "Введите корректный email адрес")
        isValid = false
      }
    })

    return isValid
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  showFieldError(field, message) {
    this.clearFieldError(field)

    const errorElement = document.createElement("div")
    errorElement.className = "field-error"
    errorElement.textContent = message
    errorElement.style.cssText = `
            color: #dc2626;
            font-size: 0.875rem;
            margin-top: 0.25rem;
        `

    field.parentNode.appendChild(errorElement)
    field.setAttribute("aria-invalid", "true")
    field.setAttribute("aria-describedby", "error-" + field.name)
    errorElement.id = "error-" + field.name
  }

  clearFieldError(field) {
    const existingError = field.parentNode.querySelector(".field-error")
    if (existingError) {
      existingError.remove()
    }
    field.removeAttribute("aria-invalid")
    field.removeAttribute("aria-describedby")
  }

  async submitForm(formData) {
    try {
      // Simulate form submission
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Show success message
      const notification = new PortfolioSite()
      notification.showNotification("Сообщение отправлено успешно!")

      // Reset form
      const form = document.querySelector("form")
      if (form) form.reset()
    } catch (error) {
      console.error("Form submission error:", error)
      const notification = new PortfolioSite()
      notification.showNotification("Произошла ошибка при отправке сообщения")
    }
  }
}

// Theme management
class ThemeManager {
  constructor() {
    this.init()
  }

  init() {
    this.detectSystemTheme()
    this.setupThemeToggle()
  }

  detectSystemTheme() {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)")

    // Listen for changes in system theme
    prefersDark.addEventListener("change", (e) => {
      if (e.matches) {
        document.documentElement.setAttribute("data-theme", "dark")
      } else {
        document.documentElement.setAttribute("data-theme", "light")
      }
    })

    // Set initial theme
    if (prefersDark.matches) {
      document.documentElement.setAttribute("data-theme", "dark")
    } else {
      document.documentElement.setAttribute("data-theme", "light")
    }
  }

  setupThemeToggle() {
    // If you want to add a manual theme toggle button
    const themeToggle = document.getElementById("theme-toggle")
    if (themeToggle) {
      themeToggle.addEventListener("click", this.toggleTheme.bind(this))
    }
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme")
    const newTheme = currentTheme === "dark" ? "light" : "dark"

    document.documentElement.setAttribute("data-theme", newTheme)
    localStorage.setItem("theme", newTheme)
  }
}

// Initialize everything when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new PortfolioSite()
  new FormHandler()
  new ThemeManager()
})

// Service Worker registration for PWA functionality
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered: ", registration)
      })
      .catch((registrationError) => {
        console.log("SW registration failed: ", registrationError)
      })
  })
}

// Export for module usage if needed
if (typeof module !== "undefined" && module.exports) {
  module.exports = { PortfolioSite, FormHandler, ThemeManager }
}
