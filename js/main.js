// Preserve saved language early
(function () {
  const saved = localStorage.getItem("portfolio-lang")
  if (saved === "en" || saved === "ru") {
    document.documentElement.lang = saved
  }
})()

// Main JavaScript functionality
class PortfolioApp {
  constructor() {
    this.currentLang = "ru"
    this.init()
  }

  init() {
    this.loadLanguage()
    this.setupEventListeners()
    this.setupMobileMenu()
    this.setupLanguageToggle()
    this.setupSmoothScrolling()
    this.setupAnimations()
  }

  setupEventListeners() {
    // DOM Content Loaded
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        this.onDOMReady()
      })
    } else {
      this.onDOMReady()
    }

    // Window events
    window.addEventListener("scroll", this.throttle(this.handleScroll.bind(this), 16))
    window.addEventListener("resize", this.throttle(this.handleResize.bind(this), 100))
  }

  onDOMReady() {
    // Set active navigation link
    this.setActiveNavLink()

    // Initialize components
    this.initializeComponents()

    // Add loading complete class
    document.body.classList.add("loaded")
  }

  setupMobileMenu() {
    const navToggle = document.getElementById("nav-toggle")
    const navMenu = document.getElementById("nav-menu")

    if (navToggle && navMenu) {
      navToggle.addEventListener("click", () => {
        const isActive = navMenu.classList.contains("active")

        if (isActive) {
          this.closeMobileMenu()
        } else {
          this.openMobileMenu()
        }
      })

      // Close menu when clicking on links
      const navLinks = navMenu.querySelectorAll(".nav-link")
      navLinks.forEach((link) => {
        link.addEventListener("click", () => {
          this.closeMobileMenu()
        })
      })

      // Close menu when clicking outside
      document.addEventListener("click", (e) => {
        if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
          this.closeMobileMenu()
        }
      })
    }
  }

  openMobileMenu() {
    const navToggle = document.getElementById("nav-toggle")
    const navMenu = document.getElementById("nav-menu")

    navMenu.classList.add("active")
    navMenu.setAttribute("aria-hidden", "false")
    navToggle.classList.add("active")
    navToggle.setAttribute("aria-expanded", "true")

    // Prevent body scroll
    document.body.style.overflow = "hidden"
  }

  closeMobileMenu() {
    const navToggle = document.getElementById("nav-toggle")
    const navMenu = document.getElementById("nav-menu")

    navMenu.classList.remove("active")
    navMenu.setAttribute("aria-hidden", "true")
    navToggle.classList.remove("active")
    navToggle.setAttribute("aria-expanded", "false")

    // Restore body scroll
    document.body.style.overflow = ""
  }

  setupLanguageToggle() {
    const langToggle = document.getElementById("lang-toggle")
    const langOptions = document.getElementById("lang-options")

    if (langToggle && langOptions) {
      langToggle.addEventListener("click", (e) => {
        e.stopPropagation()
        const expanded = langToggle.getAttribute("aria-expanded") === "true"
        langToggle.setAttribute("aria-expanded", expanded ? "false" : "true")
        langOptions.classList.toggle("open", !expanded)
      })

      langOptions.querySelectorAll("[data-lang]").forEach((option) => {
        option.addEventListener("click", () => {
          const lang = option.getAttribute("data-lang")
          this.currentLang = lang
          this.updateLanguage()
          this.saveLanguagePreference()
          langOptions.classList.remove("open")
          langToggle.setAttribute("aria-expanded", "false")
        })
      })

      document.addEventListener("click", (e) => {
        if (!langToggle.contains(e.target) && !langOptions.contains(e.target)) {
          langOptions.classList.remove("open")
          langToggle.setAttribute("aria-expanded", "false")
        }
      })
    }
  }

  updateLanguage() {
    const elements = document.querySelectorAll("[data-ru][data-en]")
    const langToggle = document.getElementById("lang-toggle")

    elements.forEach((element) => {
      const text = element.getAttribute(`data-${this.currentLang}`)
      if (text) {
        if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
          element.placeholder = text
        } else {
          element.textContent = text
        }
      }
    })

    // Update language toggle button
    if (langToggle) {
      const langCurrent = langToggle.querySelector(".lang-current")
      if (langCurrent) {
        langCurrent.textContent = this.currentLang.toUpperCase()
      }
    }

    const langOptions = document.getElementById("lang-options")
    if (langOptions) {
      langOptions.querySelectorAll("[data-lang]").forEach((opt) => {
        const selected = opt.getAttribute("data-lang") === this.currentLang
        opt.setAttribute("aria-selected", selected ? "true" : "false")
      })
    }

    // Update document language
    document.documentElement.lang = this.currentLang
  }

  loadLanguage() {
    const savedLang = localStorage.getItem("portfolio-lang")
    if (savedLang && (savedLang === "ru" || savedLang === "en")) {
      this.currentLang = savedLang
      this.updateLanguage()
    }
  }

  saveLanguagePreference() {
    localStorage.setItem("portfolio-lang", this.currentLang)
  }

  setupSmoothScrolling() {
    // Smooth scrolling for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]')

    anchorLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        const href = link.getAttribute("href")

        if (href === "#") return

        const target = document.querySelector(href)
        if (target) {
          e.preventDefault()
          this.scrollToElement(target)
        }
      })
    })
  }

  scrollToElement(element) {
    const headerHeight = document.querySelector(".navbar").offsetHeight
    const elementPosition = element.offsetTop - headerHeight - 20

    window.scrollTo({
      top: elementPosition,
      behavior: "smooth",
    })
  }

  setupAnimations() {
    // Intersection Observer for animations
    if ("IntersectionObserver" in window) {
      this.setupScrollAnimations()
    }
  }

  setupScrollAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-in")
        }
      })
    }, observerOptions)

    // Observe elements for animation
    const animateElements = document.querySelectorAll(".announcement-card, .blog-card, .hero-content")
    animateElements.forEach((el) => {
      el.classList.add("animate-on-scroll")
      observer.observe(el)
    })
  }

  handleScroll() {
    const header = document.querySelector(".navbar")
    const scrollY = window.scrollY

    // Add/remove scrolled class to header
    if (scrollY > 50) {
      header.classList.add("scrolled")
    } else {
      header.classList.remove("scrolled")
    }
  }

  handleResize() {
    // Close mobile menu on resize to desktop
    if (window.innerWidth > 768) {
      this.closeMobileMenu()
    }
  }

  setActiveNavLink() {
    const currentPage = window.location.pathname.split("/").pop() || "index.html"
    const navLinks = document.querySelectorAll(".nav-link")

    navLinks.forEach((link) => {
      link.classList.remove("active")
      const href = link.getAttribute("href")

      if (
        href === currentPage ||
        (currentPage === "" && href === "index.html") ||
        (currentPage === "index.html" && href === "index.html")
      ) {
        link.classList.add("active")
      }
    })
  }

  initializeComponents() {
    // Initialize any additional components here
    this.initializeCards()
    this.initializeButtons()
  }

  initializeCards() {
    const cards = document.querySelectorAll(".announcement-card, .blog-card")

    cards.forEach((card) => {
      // Add hover effects
      card.addEventListener("mouseenter", () => {
        card.style.transform = "translateY(-4px)"
      })

      card.addEventListener("mouseleave", () => {
        card.style.transform = "translateY(0)"
      })
    })
  }

  initializeButtons() {
    const buttons = document.querySelectorAll(".btn")

    buttons.forEach((button) => {
      // Add click effect
      button.addEventListener("click", (e) => {
        const ripple = document.createElement("span")
        const rect = button.getBoundingClientRect()
        const size = Math.max(rect.width, rect.height)
        const x = e.clientX - rect.left - size / 2
        const y = e.clientY - rect.top - size / 2

        ripple.style.cssText = `
                    position: absolute;
                    width: ${size}px;
                    height: ${size}px;
                    left: ${x}px;
                    top: ${y}px;
                    background: rgba(255, 255, 255, 0.3);
                    border-radius: 50%;
                    transform: scale(0);
                    animation: ripple 0.6s ease-out;
                    pointer-events: none;
                `

        button.style.position = "relative"
        button.style.overflow = "hidden"
        button.appendChild(ripple)

        setTimeout(() => {
          ripple.remove()
        }, 600)
      })
    })
  }

  // Utility functions
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

  debounce(func, wait, immediate) {
    let timeout
    return function () {
      
      const args = arguments
      const later = () => {
        timeout = null
        if (!immediate) func.apply(this, args)
      }
      const callNow = immediate && !timeout
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
      if (callNow) func.apply(this, args)
    }
  }
}

// CSS for animations
const animationStyles = `
    .animate-on-scroll {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.6s ease-out;
    }
    
    .animate-on-scroll.animate-in {
        opacity: 1;
        transform: translateY(0);
    }
    
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .navbar.scrolled {
        box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
    }
`

// Inject animation styles
const styleSheet = document.createElement("style")
styleSheet.textContent = animationStyles
document.head.appendChild(styleSheet)

// Initialize the application
const app = new PortfolioApp()

// Export for potential use in other scripts
if (typeof module !== "undefined" && module.exports) {
  module.exports = PortfolioApp
}
