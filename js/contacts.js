// Contacts Page JavaScript

class ContactsPage {
  constructor() {
    this.form = document.getElementById("contactForm")
    this.submitBtn = document.getElementById("submitBtn")
    this.successMessage = document.getElementById("formSuccess")
    this.charCount = document.getElementById("charCount")
    this.messageField = document.getElementById("message")

    this.init()
  }

  init() {
    this.setupFormValidation()
    this.setupCharacterCounter()
    this.setupFAQ()
    this.setupFormSubmission()
    this.setupAccessibility()
  }

  setupFormValidation() {
    const inputs = this.form.querySelectorAll("input, select, textarea")

    inputs.forEach((input) => {
      input.addEventListener("blur", () => this.validateField(input))
      input.addEventListener("input", () => this.clearError(input))
    })
  }

  validateField(field) {
    const value = field.value.trim()
    const fieldName = field.name
    let isValid = true
    let errorMessage = ""

    // Clear previous error
    this.clearError(field)

    // Required field validation
    if (field.hasAttribute("required") && !value) {
      isValid = false
      errorMessage = this.getErrorMessage("required", fieldName)
    }

    // Email validation
    if (fieldName === "email" && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        isValid = false
        errorMessage = this.getErrorMessage("email")
      }
    }

    // Name validation
    if (fieldName === "name" && value) {
      if (value.length < 2) {
        isValid = false
        errorMessage = this.getErrorMessage("minLength", fieldName, 2)
      }
    }

    // Message validation
    if (fieldName === "message" && value) {
      if (value.length < 10) {
        isValid = false
        errorMessage = this.getErrorMessage("minLength", fieldName, 10)
      }
      if (value.length > 1000) {
        isValid = false
        errorMessage = this.getErrorMessage("maxLength", fieldName, 1000)
      }
    }

    if (!isValid) {
      this.showError(field, errorMessage)
    }

    return isValid
  }

  clearError(field) {
    field.classList.remove("error")
    const errorElement = document.getElementById(`${field.name}-error`)
    if (errorElement) {
      errorElement.textContent = ""
    }
  }

  showError(field, message) {
    field.classList.add("error")
    const errorElement = document.getElementById(`${field.name}-error`)
    if (errorElement) {
      errorElement.textContent = message
    }
  }

  getErrorMessage(type, fieldName = "", value = "") {
    const isEnglish = document.documentElement.lang === "en"

    const messages = {
      required: {
        ru: "Это поле обязательно для заполнения",
        en: "This field is required",
      },
      email: {
        ru: "Введите корректный email адрес",
        en: "Please enter a valid email address",
      },
      minLength: {
        ru: `Минимальная длина: ${value} символов`,
        en: `Minimum length: ${value} characters`,
      },
      maxLength: {
        ru: `Максимальная длина: ${value} символов`,
        en: `Maximum length: ${value} characters`,
      },
    }

    return messages[type] ? messages[type][isEnglish ? "en" : "ru"] : ""
  }

  setupCharacterCounter() {
    if (this.messageField && this.charCount) {
      this.messageField.addEventListener("input", () => {
        const length = this.messageField.value.length
        this.charCount.textContent = length

        // Change color based on length
        if (length > 900) {
          this.charCount.style.color = "var(--color-red-500)"
        } else if (length > 800) {
          this.charCount.style.color = "var(--color-amber-500)"
        } else {
          this.charCount.style.color = "var(--color-stone-500)"
        }
      })
    }
  }

  setupFAQ() {
    const faqQuestions = document.querySelectorAll(".faq-question")

    faqQuestions.forEach((question) => {
      question.addEventListener("click", () => {
        const isExpanded = question.getAttribute("aria-expanded") === "true"
        const answer = question.nextElementSibling

        // Close all other FAQ items
        faqQuestions.forEach((otherQuestion) => {
          if (otherQuestion !== question) {
            otherQuestion.setAttribute("aria-expanded", "false")
            const otherAnswer = otherQuestion.nextElementSibling
            otherAnswer.style.maxHeight = "0"
          }
        })

        // Toggle current FAQ item
        question.setAttribute("aria-expanded", !isExpanded)

        if (!isExpanded) {
          answer.style.maxHeight = answer.scrollHeight + "px"
        } else {
          answer.style.maxHeight = "0"
        }
      })
    })
  }

  setupFormSubmission() {
    this.form.addEventListener("submit", async (e) => {
      e.preventDefault()

      // Validate all fields
      const inputs = this.form.querySelectorAll("input, select, textarea")
      let isFormValid = true

      inputs.forEach((input) => {
        if (!this.validateField(input)) {
          isFormValid = false
        }
      })

      if (!isFormValid) {
        // Focus on first error field
        const firstError = this.form.querySelector(".error")
        if (firstError) {
          firstError.focus()
        }
        return
      }

      // Show loading state
      this.submitBtn.classList.add("loading")
      this.submitBtn.disabled = true

      try {
        // Simulate form submission
        await this.submitForm()

        // Show success message
        this.showSuccess()

        // Reset form
        this.form.reset()
        this.charCount.textContent = "0"
      } catch (error) {
        console.error("Form submission error:", error)
        this.showError(this.form, "Произошла ошибка при отправке формы. Попробуйте еще раз.")
      } finally {
        // Hide loading state
        this.submitBtn.classList.remove("loading")
        this.submitBtn.disabled = false
      }
    })
  }

  async submitForm() {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve()
      }, 2000)
    })
  }

  showSuccess() {
    this.successMessage.classList.add("show")
    this.successMessage.scrollIntoView({ behavior: "smooth", block: "center" })

    // Hide success message after 10 seconds
    setTimeout(() => {
      this.successMessage.classList.remove("show")
    }, 10000)
  }

  setupAccessibility() {
    // Keyboard navigation for method cards
    const methodCards = document.querySelectorAll(".method-card")

    methodCards.forEach((card) => {
      card.setAttribute("tabindex", "0")

      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          const link = card.querySelector(".method-link")
          if (link) {
            link.click()
          }
        }
      })
    })

    // Enhanced focus management for FAQ
    const faqQuestions = document.querySelectorAll(".faq-question")

    faqQuestions.forEach((question, index) => {
      question.addEventListener("keydown", (e) => {
        switch (e.key) {
          case "ArrowDown":
            e.preventDefault()
            const nextQuestion = faqQuestions[index + 1]
            if (nextQuestion) {
              nextQuestion.focus()
            }
            break
          case "ArrowUp":
            e.preventDefault()
            const prevQuestion = faqQuestions[index - 1]
            if (prevQuestion) {
              prevQuestion.focus()
            }
            break
          case "Home":
            e.preventDefault()
            faqQuestions[0].focus()
            break
          case "End":
            e.preventDefault()
            faqQuestions[faqQuestions.length - 1].focus()
            break
        }
      })
    })
  }
}

// Form field enhancements
class FormEnhancements {
  constructor() {
    this.init()
  }

  init() {
    this.setupFloatingLabels()
    this.setupInputMasks()
    this.setupAutoResize()
  }

  setupFloatingLabels() {
    const formGroups = document.querySelectorAll(".form-group")

    formGroups.forEach((group) => {
      const input = group.querySelector("input, textarea, select")
      const label = group.querySelector(".form-label")

      if (input && label) {
        // Check if field has value on load
        this.toggleFloatingLabel(input, label)

        input.addEventListener("focus", () => {
          label.classList.add("floating")
        })

        input.addEventListener("blur", () => {
          this.toggleFloatingLabel(input, label)
        })

        input.addEventListener("input", () => {
          this.toggleFloatingLabel(input, label)
        })
      }
    })
  }

  toggleFloatingLabel(input, label) {
    if (input.value.trim() !== "" || input === document.activeElement) {
      label.classList.add("floating")
    } else {
      label.classList.remove("floating")
    }
  }

  setupInputMasks() {
    // Phone number formatting (if needed in future)
    const phoneInputs = document.querySelectorAll('input[type="tel"]')

    phoneInputs.forEach((input) => {
      input.addEventListener("input", (e) => {
        let value = e.target.value.replace(/\D/g, "")
        if (value.length > 0) {
          if (value.length <= 3) {
            value = `+7 (${value}`
          } else if (value.length <= 6) {
            value = `+7 (${value.slice(1, 4)}) ${value.slice(4)}`
          } else if (value.length <= 8) {
            value = `+7 (${value.slice(1, 4)}) ${value.slice(4, 7)}-${value.slice(7)}`
          } else {
            value = `+7 (${value.slice(1, 4)}) ${value.slice(4, 7)}-${value.slice(7, 9)}-${value.slice(9, 11)}`
          }
        }
        e.target.value = value
      })
    })
  }

  setupAutoResize() {
    const textareas = document.querySelectorAll("textarea")

    textareas.forEach((textarea) => {
      textarea.addEventListener("input", () => {
        textarea.style.height = "auto"
        textarea.style.height = textarea.scrollHeight + "px"
      })
    })
  }
}

// Intersection Observer for animations
class ContactAnimations {
  constructor() {
    this.init()
  }

  init() {
    this.setupScrollAnimations()
    this.setupCounterAnimations()
  }

  setupScrollAnimations() {
    const animatedElements = document.querySelectorAll(".method-card, .form-wrapper, .faq-item")

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1"
            entry.target.style.transform = "translateY(0)"
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      },
    )

    animatedElements.forEach((element) => {
      element.style.opacity = "0"
      element.style.transform = "translateY(30px)"
      element.style.transition = "opacity 0.6s ease, transform 0.6s ease"
      observer.observe(element)
    })
  }

  setupCounterAnimations() {
    // If we add counters in the future
    const counters = document.querySelectorAll("[data-counter]")

    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.animateCounter(entry.target)
          counterObserver.unobserve(entry.target)
        }
      })
    })

    counters.forEach((counter) => {
      counterObserver.observe(counter)
    })
  }

  animateCounter(element) {
    const target = Number.parseInt(element.dataset.counter)
    const duration = 2000
    const step = target / (duration / 16)
    let current = 0

    const timer = setInterval(() => {
      current += step
      if (current >= target) {
        current = target
        clearInterval(timer)
      }
      element.textContent = Math.floor(current)
    }, 16)
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new ContactsPage()
  new FormEnhancements()
  new ContactAnimations()
})

// Export for potential use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = { ContactsPage, FormEnhancements, ContactAnimations }
}
