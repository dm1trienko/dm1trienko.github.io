// Roadmap Page JavaScript

document.addEventListener("DOMContentLoaded", () => {
  // Initialize roadmap functionality
  initTimelineAnimations()
  initScrollProgress()
  initStatsCounter()

  // Language toggle functionality (inherited from main.js)
  const langToggle = document.getElementById("lang-toggle")
  if (langToggle) {
    langToggle.addEventListener("click", toggleLanguage)
  }
})

// Timeline animations on scroll
function initTimelineAnimations() {
  const timelineItems = document.querySelectorAll(".timeline-item")

  // Intersection Observer for timeline items
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("animate-in")

        // Add special effects for current item
        if (entry.target.classList.contains("current")) {
          entry.target.classList.add("highlight")
        }
      }
    })
  }, observerOptions)

  timelineItems.forEach((item) => {
    observer.observe(item)
  })
}

// Scroll progress indicator
function initScrollProgress() {
  const progressBar = createProgressBar()

  window.addEventListener("scroll", () => {
    const scrollTop = window.pageYOffset
    const docHeight = document.body.scrollHeight - window.innerHeight
    const scrollPercent = (scrollTop / docHeight) * 100

    progressBar.style.width = scrollPercent + "%"
  })
}

function createProgressBar() {
  const progressContainer = document.createElement("div")
  progressContainer.className = "scroll-progress"
  progressContainer.innerHTML = '<div class="scroll-progress-bar"></div>'

  // Add CSS for progress bar
  const style = document.createElement("style")
  style.textContent = `
        .scroll-progress {
            position: fixed;
            top: var(--header-height);
            left: 0;
            width: 100%;
            height: 3px;
            background-color: var(--color-border);
            z-index: 999;
        }
        
        .scroll-progress-bar {
            height: 100%;
            background: linear-gradient(90deg, var(--color-accent) 0%, var(--color-primary) 100%);
            width: 0%;
            transition: width 0.1s ease;
        }
        
        @media (prefers-color-scheme: dark) {
            .scroll-progress-bar {
                background: linear-gradient(90deg, var(--color-accent) 0%, var(--color-secondary) 100%);
            }
        }
    `

  document.head.appendChild(style)
  document.body.appendChild(progressContainer)

  return progressContainer.querySelector(".scroll-progress-bar")
}

// Animated stats counter
function initStatsCounter() {
  const statNumbers = document.querySelectorAll(".stat-number")

  const observerOptions = {
    threshold: 0.5,
    rootMargin: "0px",
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateNumber(entry.target)
        observer.unobserve(entry.target)
      }
    })
  }, observerOptions)

  statNumbers.forEach((stat) => {
    observer.observe(stat)
  })
}

function animateNumber(element) {
  const finalNumber = Number.parseInt(element.textContent)
  const duration = 2000 // 2 seconds
  const steps = 60
  const increment = finalNumber / steps
  const stepDuration = duration / steps

  let currentNumber = 0
  element.textContent = "0"

  const timer = setInterval(() => {
    currentNumber += increment

    if (currentNumber >= finalNumber) {
      element.textContent = finalNumber
      clearInterval(timer)
    } else {
      element.textContent = Math.floor(currentNumber)
    }
  }, stepDuration)
}

// Timeline item hover effects
document.addEventListener("DOMContentLoaded", () => {
  const timelineItems = document.querySelectorAll(".timeline-item")

  timelineItems.forEach((item) => {
    const dot = item.querySelector(".timeline-dot")
    const content = item.querySelector(".timeline-content")

    item.addEventListener("mouseenter", () => {
      if (!item.classList.contains("current")) {
        dot.style.transform = "scale(1.1)"
        dot.style.borderWidth = "4px"
      }
    })

    item.addEventListener("mouseleave", () => {
      if (!item.classList.contains("current")) {
        dot.style.transform = "scale(1)"
        dot.style.borderWidth = "3px"
      }
    })
  })
})

// Keyboard navigation for timeline
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    const timelineItems = document.querySelectorAll(".timeline-item")
    const currentFocused = document.activeElement

    let currentIndex = -1
    timelineItems.forEach((item, index) => {
      if (item.contains(currentFocused) || item === currentFocused) {
        currentIndex = index
      }
    })

    if (currentIndex !== -1) {
      e.preventDefault()

      let nextIndex
      if (e.key === "ArrowDown") {
        nextIndex = (currentIndex + 1) % timelineItems.length
      } else {
        nextIndex = currentIndex === 0 ? timelineItems.length - 1 : currentIndex - 1
      }

      timelineItems[nextIndex].focus()
      timelineItems[nextIndex].scrollIntoView({
        behavior: "smooth",
        block: "center",
      })
    }
  }
})

// Add tabindex to timeline items for keyboard navigation
document.addEventListener("DOMContentLoaded", () => {
  const timelineItems = document.querySelectorAll(".timeline-item")
  timelineItems.forEach((item, index) => {
    item.setAttribute("tabindex", "0")
    item.setAttribute("role", "article")
    item.setAttribute("aria-label", `Timeline event ${index + 1}`)
  })
})

// Language toggle function (if not already defined in main.js)
function toggleLanguage() {
  const currentLang = document.documentElement.lang
  const newLang = currentLang === "ru" ? "en" : "ru"

  document.documentElement.lang = newLang

  // Update language toggle button
  const langToggle = document.getElementById("lang-toggle")
  const langCurrent = langToggle.querySelector(".lang-current")
  langCurrent.textContent = newLang.toUpperCase()

  // Update all translatable elements
  const translatableElements = document.querySelectorAll("[data-en]")
  translatableElements.forEach((element) => {
    if (newLang === "en") {
      element.textContent = element.getAttribute("data-en")
    } else {
      // Store original Russian text if not already stored
      if (!element.hasAttribute("data-ru")) {
        element.setAttribute("data-ru", element.textContent)
      }
      element.textContent = element.getAttribute("data-ru")
    }
  })

  // Save language preference
  localStorage.setItem("preferred-language", newLang)
}

// Load saved language preference
document.addEventListener("DOMContentLoaded", () => {
  const savedLang = localStorage.getItem("preferred-language")
  if (savedLang && savedLang !== document.documentElement.lang) {
    toggleLanguage()
  }
})
