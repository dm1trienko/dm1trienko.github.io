// Blog-specific functionality
class BlogManager {
  constructor() {
    this.posts = []
    this.filteredPosts = []
    this.currentFilter = "all"
    this.searchTerm = ""
    this.init()
  }

  init() {
    this.setupFilters()
    this.setupSearch()
    this.loadPosts()
    this.setupNewsletterForm()
  }

  // Load posts data
  loadPosts() {
    // In a real application, this would fetch from an API
    this.posts = [
      {
        id: "text-1",
        title: "Размышления о культуре в цифровую эпоху",
        excerpt:
          "Как технологии меняют наше восприятие культурного наследия и какие новые формы искусства появляются в результате цифровой трансформации.",
        category: "culture",
        date: "2024-01-15",
        readTime: "5 мин",
        tags: ["Культура", "Технологии", "Искусство", "VR"],
        featured: true,
        url: "blog/text-1.html",
      },
      {
        id: "text-2",
        title: "Предпринимательство и социальная ответственность",
        excerpt:
          "Роль молодых предпринимателей в создании устойчивого будущего. Как совместить коммерческий успех с положительным социальным воздействием.",
        category: "business",
        date: "2024-01-10",
        readTime: "7 мин",
        tags: ["Предпринимательство", "ESG", "Социум", "Устойчивость"],
        featured: false,
        url: "blog/text-2.html",
      },
      {
        id: "text-3",
        title: "IT-образование: вызовы и возможности",
        excerpt:
          "Личный опыт изучения технологий и построения карьеры в IT. Советы для студентов и размышления о будущем образования.",
        category: "tech",
        date: "2024-01-05",
        readTime: "6 мин",
        tags: ["Образование", "IT", "Карьера", "AI"],
        featured: false,
        url: "blog/text-3.html",
      },
    ]

    this.filteredPosts = [...this.posts]
    this.renderPosts()
  }

  // Setup category filters
  setupFilters() {
    const filterButtons = document.querySelectorAll(".filter-btn")

    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        // Remove active class from all buttons
        filterButtons.forEach((btn) => btn.classList.remove("active"))

        // Add active class to clicked button
        button.classList.add("active")

        // Update current filter
        this.currentFilter = button.dataset.category

        // Filter and render posts
        this.filterPosts()
      })
    })
  }

  // Setup search functionality
  setupSearch() {
    const searchInput = document.getElementById("search-input")

    if (searchInput) {
      // Debounce search input
      let searchTimeout
      searchInput.addEventListener("input", (e) => {
        clearTimeout(searchTimeout)
        searchTimeout = setTimeout(() => {
          this.searchTerm = e.target.value.toLowerCase().trim()
          this.filterPosts()
        }, 300)
      })
    }
  }

  // Filter posts based on category and search term
  filterPosts() {
    this.filteredPosts = this.posts.filter((post) => {
      // Skip featured posts in grid
      if (post.featured) return false

      // Category filter
      const categoryMatch = this.currentFilter === "all" || post.category === this.currentFilter

      // Search filter
      const searchMatch =
        !this.searchTerm ||
        post.title.toLowerCase().includes(this.searchTerm) ||
        post.excerpt.toLowerCase().includes(this.searchTerm) ||
        post.tags.some((tag) => tag.toLowerCase().includes(this.searchTerm))

      return categoryMatch && searchMatch
    })

    this.renderPosts()
  }

  // Render posts to the grid
  renderPosts() {
    const postsGrid = document.getElementById("posts-grid")
    if (!postsGrid) return

    // Add loading state
    postsGrid.classList.add("loading")

    setTimeout(() => {
      if (this.filteredPosts.length === 0) {
        this.renderNoResults(postsGrid)
      } else {
        this.renderPostCards(postsGrid)
      }

      postsGrid.classList.remove("loading")
    }, 300)
  }

  // Render individual post cards
  renderPostCards(container) {
    const postsHTML = this.filteredPosts.map((post) => this.createPostCard(post)).join("")

    // Keep newsletter signup at the end
    const newsletterSignup = container.querySelector(".newsletter-signup")
    container.innerHTML = postsHTML

    if (newsletterSignup) {
      container.appendChild(newsletterSignup)
    }

    // Animate cards in
    const cards = container.querySelectorAll(".post-card")
    cards.forEach((card, index) => {
      card.style.opacity = "0"
      card.style.transform = "translateY(20px)"

      setTimeout(() => {
        card.style.transition = "opacity 0.4s ease-out, transform 0.4s ease-out"
        card.style.opacity = "1"
        card.style.transform = "translateY(0)"
      }, index * 100)
    })
  }

  // Create HTML for a post card
  createPostCard(post) {
    const categoryNames = {
      culture: "Культура",
      tech: "Технологии",
      business: "Бизнес",
    }

    const tagsHTML = post.tags
      .slice(0, 3)
      .map((tag) => `<span class="tag">${tag}</span>`)
      .join("")

    return `
            <a href="${post.url}" class="post-card" data-category="${post.category}">
                <div class="post-header">
                    <span class="post-category">${categoryNames[post.category] || post.category}</span>
                    <div class="post-meta">
                        <div class="meta-item">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                            ${this.formatDate(post.date)}
                        </div>
                        <div class="meta-item">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12,6 12,12 16,14"/>
                            </svg>
                            ${post.readTime}
                        </div>
                    </div>
                </div>
                <h3 class="post-title">${post.title}</h3>
                <p class="post-excerpt">${post.excerpt}</p>
                <div class="post-tags">${tagsHTML}</div>
                <div class="post-read-more">
                    Читать далее
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="5" y1="12" x2="19" y2="12"/>
                        <polyline points="12,5 19,12 12,19"/>
                    </svg>
                </div>
            </a>
        `
  }

  // Render no results message
  renderNoResults(container) {
    const newsletterSignup = container.querySelector(".newsletter-signup")

    container.innerHTML = `
            <div class="no-results">
                <h3>Статьи не найдены</h3>
                <p>Попробуйте изменить критерии поиска или выберите другую категорию.</p>
            </div>
        `

    if (newsletterSignup) {
      container.appendChild(newsletterSignup)
    }
  }

  // Format date for display
  formatDate(dateString) {
    const date = new Date(dateString)
    const months = [
      "января",
      "февраля",
      "марта",
      "апреля",
      "мая",
      "июня",
      "июля",
      "августа",
      "сентября",
      "октября",
      "ноября",
      "декабря",
    ]

    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
  }

  // Setup newsletter form
  setupNewsletterForm() {
    const form = document.getElementById("newsletter-form")

    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault()

        const email = form.querySelector('input[type="email"]').value

        if (this.isValidEmail(email)) {
          this.subscribeToNewsletter(email)
        } else {
          this.showMessage("Пожалуйста, введите корректный email адрес", "error")
        }
      })
    }
  }

  // Validate email
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Subscribe to newsletter
  async subscribeToNewsletter(email) {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      this.showMessage("Спасибо за подписку! Вы будете получать уведомления о новых статьях.", "success")

      // Reset form
      const form = document.getElementById("newsletter-form")
      if (form) form.reset()
    } catch (error) {
      console.error("Newsletter subscription error:", error)
      this.showMessage("Произошла ошибка при подписке. Попробуйте позже.", "error")
    }
  }

  // Show message to user
  showMessage(message, type = "info") {
    const messageEl = document.createElement("div")
    messageEl.className = `message message-${type}`
    messageEl.textContent = message

    const styles = {
      position: "fixed",
      top: "20px",
      right: "20px",
      padding: "1rem 1.5rem",
      borderRadius: "var(--radius-md)",
      boxShadow: "var(--shadow-lg)",
      zIndex: "10000",
      transform: "translateX(100%)",
      transition: "transform 0.3s ease-out",
      maxWidth: "400px",
      fontSize: "0.875rem",
      fontWeight: "500",
    }

    // Apply base styles
    Object.assign(messageEl.style, styles)

    // Apply type-specific styles
    if (type === "success") {
      messageEl.style.background = "#10b981"
      messageEl.style.color = "white"
    } else if (type === "error") {
      messageEl.style.background = "#ef4444"
      messageEl.style.color = "white"
    } else {
      messageEl.style.background = "var(--color-warm-600)"
      messageEl.style.color = "white"
    }

    document.body.appendChild(messageEl)

    // Animate in
    setTimeout(() => {
      messageEl.style.transform = "translateX(0)"
    }, 100)

    // Remove after 4 seconds
    setTimeout(() => {
      messageEl.style.transform = "translateX(100%)"
      setTimeout(() => {
        if (document.body.contains(messageEl)) {
          document.body.removeChild(messageEl)
        }
      }, 300)
    }, 4000)
  }

  // Analytics tracking (placeholder)
  trackEvent(eventName, properties = {}) {
    // In a real application, this would send data to analytics service
    console.log("Analytics Event:", eventName, properties)
  }
}

// Initialize blog functionality when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new BlogManager()
})

// Export for module usage if needed
if (typeof module !== "undefined" && module.exports) {
  module.exports = { BlogManager }
}
