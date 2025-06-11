// Blog-specific JavaScript functionality
class BlogManager {
  constructor() {
    this.init()
  }

  init() {
    this.loadMarkdownPosts()
    this.setupReadingProgress()
    this.setupPostNavigation()
    this.setupSearchFunctionality()
    this.setupSocialSharing()
    this.initializeReadingTime()
  }

  setupReadingProgress() {
    // Create reading progress bar
    const progressBar = document.createElement("div")
    progressBar.className = "reading-progress"
    progressBar.innerHTML = '<div class="reading-progress-fill"></div>'
    document.body.appendChild(progressBar)

    // Update progress on scroll
    window.addEventListener(
      "scroll",
      this.throttle(() => {
        this.updateReadingProgress()
      }, 16),
    )
  }

  updateReadingProgress() {
    const progressFill = document.querySelector(".reading-progress-fill")
    if (!progressFill) return

    const windowHeight = window.innerHeight
    const documentHeight = document.documentElement.scrollHeight - windowHeight
    const scrollTop = window.pageYOffset
    const progress = (scrollTop / documentHeight) * 100

    progressFill.style.width = Math.min(progress, 100) + "%"
  }

  loadMarkdownPosts() {
    const posts = document.querySelectorAll(".post-content[data-src]")
    if (!posts.length) return

    const loadPromises = []

    posts.forEach((container) => {
      const src = container.dataset.src
      if (!src) return

      const p = fetch(src)
        .then((r) => r.text())
        .then((md) => {
          if (window.marked) {
            container.innerHTML = window.marked.parse(md)
          } else {
            container.textContent = md
          }
        })
        .catch(() => {
          container.textContent = "Не удалось загрузить статью."
        })

      loadPromises.push(p)
    })

    Promise.all(loadPromises).then(() => this.initializeReadingTime())
  }

  setupPostNavigation() {
    // Add smooth scrolling to post anchors
    const postLinks = document.querySelectorAll('a[href^="#text-"]')

    postLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault()
        const targetId = link.getAttribute("href").substring(1)
        const targetElement = document.getElementById(targetId)

        if (targetElement) {
          this.scrollToPost(targetElement)
        }
      })
    })
  }

  scrollToPost(element) {
    const headerHeight = document.querySelector(".header").offsetHeight
    const elementPosition = element.offsetTop - headerHeight - 20

    window.scrollTo({
      top: elementPosition,
      behavior: "smooth",
    })

    // Highlight the post temporarily
    element.classList.add("highlighted")
    setTimeout(() => {
      element.classList.remove("highlighted")
    }, 2000)
  }

  setupSearchFunctionality() {
    // Create search widget if it doesn't exist
    this.createSearchWidget()

    const searchInput = document.getElementById("blog-search")
    if (searchInput) {
      searchInput.addEventListener(
        "input",
        this.debounce((e) => {
          this.performSearch(e.target.value)
        }, 300),
      )
    }
  }

  createSearchWidget() {
    const sidebar = document.querySelector(".blog-sidebar")
    if (!sidebar) return

    const searchWidget = document.createElement("div")
    searchWidget.className = "sidebar-widget search-widget"
    searchWidget.innerHTML = `
            <h3 class="widget-title" data-ru="Поиск" data-en="Search">Поиск</h3>
            <div class="search-container">
                <input type="text" id="blog-search" class="search-input" 
                       placeholder="Поиск по блогу..." 
                       data-ru="Поиск по блогу..." 
                       data-en="Search blog...">
                <div class="search-results" id="search-results"></div>
            </div>
        `

    sidebar.insertBefore(searchWidget, sidebar.firstChild)
  }

  performSearch(query) {
    const posts = document.querySelectorAll(".blog-post")
    const resultsContainer = document.getElementById("search-results")

    if (!query.trim()) {
      resultsContainer.innerHTML = ""
      posts.forEach((post) => (post.style.display = "block"))
      return
    }

    const results = []
    posts.forEach((post) => {
      const title = post.querySelector(".post-title").textContent.toLowerCase()
      const content = post.querySelector(".post-content").textContent.toLowerCase()
      const searchTerm = query.toLowerCase()

      if (title.includes(searchTerm) || content.includes(searchTerm)) {
        results.push(post)
        post.style.display = "block"
      } else {
        post.style.display = "none"
      }
    })

    this.displaySearchResults(results, query)
  }

  displaySearchResults(results, query) {
    const resultsContainer = document.getElementById("search-results")

    if (results.length === 0) {
      resultsContainer.innerHTML = `
                <div class="search-no-results">
                    <p data-ru="Ничего не найдено" data-en="Nothing found">Ничего не найдено</p>
                </div>
            `
    } else {
      resultsContainer.innerHTML = `
                <div class="search-results-info">
                    <p data-ru="Найдено: ${results.length}" data-en="Found: ${results.length}">
                        Найдено: ${results.length}
                    </p>
                </div>
            `
    }
  }

  setupSocialSharing() {
    // Add social sharing buttons to each post
    const posts = document.querySelectorAll(".blog-post")

    posts.forEach((post) => {
      this.addSocialButtons(post)
    })
  }

  addSocialButtons(post) {
    const postFooter = post.querySelector(".post-footer")
    if (!postFooter) return

    const socialButtons = document.createElement("div")
    socialButtons.className = "social-sharing"
    socialButtons.innerHTML = `
            <span class="share-label" data-ru="Поделиться:" data-en="Share:">Поделиться:</span>
            <button class="share-btn" data-platform="twitter" aria-label="Поделиться в Twitter">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
            </button>
            <button class="share-btn" data-platform="facebook" aria-label="Поделиться в Facebook">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
            </button>
            <button class="share-btn" data-platform="linkedin" aria-label="Поделиться в LinkedIn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
            </button>
            <button class="share-btn copy-link" aria-label="Копировать ссылку">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                </svg>
            </button>
        `

    postFooter.appendChild(socialButtons)

    // Add event listeners for sharing
    const shareButtons = socialButtons.querySelectorAll(".share-btn")
    shareButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.handleShare(e, post)
      })
    })
  }

  handleShare(event, post) {
    const platform = event.currentTarget.dataset.platform
    const postTitle = post.querySelector(".post-title").textContent
    const postUrl = window.location.href + "#" + post.id

    switch (platform) {
      case "twitter":
        this.shareToTwitter(postTitle, postUrl)
        break
      case "facebook":
        this.shareToFacebook(postUrl)
        break
      case "linkedin":
        this.shareToLinkedIn(postTitle, postUrl)
        break
      default:
        this.copyToClipboard(postUrl)
    }
  }

  shareToTwitter(title, url) {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`
    window.open(twitterUrl, "_blank", "width=600,height=400")
  }

  shareToFacebook(url) {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    window.open(facebookUrl, "_blank", "width=600,height=400")
  }

  shareToLinkedIn(title, url) {
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
    window.open(linkedinUrl, "_blank", "width=600,height=400")
  }

  copyToClipboard(text) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        this.showNotification("Ссылка скопирована!", "success")
      })
      .catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement("textarea")
        textArea.value = text
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand("copy")
        document.body.removeChild(textArea)
        this.showNotification("Ссылка скопирована!", "success")
      })
  }

  showNotification(message, type = "info") {
    const notification = document.createElement("div")
    notification.className = `notification notification-${type}`
    notification.textContent = message

    document.body.appendChild(notification)

    setTimeout(() => {
      notification.classList.add("show")
    }, 100)

    setTimeout(() => {
      notification.classList.remove("show")
      setTimeout(() => {
        document.body.removeChild(notification)
      }, 300)
    }, 3000)
  }

  initializeReadingTime() {
    // Calculate and update reading times
    const posts = document.querySelectorAll(".blog-post")

    posts.forEach((post) => {
      const content = post.querySelector(".post-content")
      const readingTimeElement = post.querySelector(".post-reading-time")

      if (content && readingTimeElement) {
        const wordCount = this.countWords(content.textContent)
        const readingTime = Math.ceil(wordCount / 200) // 200 words per minute

        const currentLang = document.documentElement.lang || "ru"
        const timeText = currentLang === "ru" ? `${readingTime} мин чтения` : `${readingTime} min read`

        readingTimeElement.textContent = timeText
      }
    })
  }

  countWords(text) {
    return text.trim().split(/\s+/).length
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

// Additional CSS for blog functionality
const blogStyles = `
    .reading-progress {
        position: fixed;
        top: var(--header-height);
        left: 0;
        width: 100%;
        height: 3px;
        background-color: rgba(139, 115, 85, 0.1);
        z-index: 999;
    }
    
    .reading-progress-fill {
        height: 100%;
        background-color: var(--color-accent);
        width: 0%;
        transition: width 0.1s ease;
    }
    
    .blog-post.highlighted {
        border-color: var(--color-accent);
        box-shadow: 0 0 0 2px rgba(139, 115, 85, 0.2);
        transition: all 0.3s ease;
    }
    
    .search-widget {
        order: -1;
    }
    
    .search-container {
        position: relative;
    }
    
    .search-input {
        width: 100%;
        padding: var(--spacing-sm) var(--spacing-md);
        border: 1px solid var(--color-border);
        border-radius: var(--border-radius);
        font-size: var(--font-size-sm);
        background-color: var(--color-background);
        color: var(--color-text-primary);
        transition: border-color var(--transition-fast);
    }
    
    .search-input:focus {
        outline: none;
        border-color: var(--color-accent);
    }
    
    .search-results {
        margin-top: var(--spacing-md);
    }
    
    .search-results-info p,
    .search-no-results p {
        font-size: var(--font-size-xs);
        color: var(--color-text-muted);
        margin: 0;
    }
    
    .social-sharing {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        margin-top: var(--spacing-md);
        padding-top: var(--spacing-md);
        border-top: 1px solid var(--color-border);
    }
    
    .share-label {
        font-size: var(--font-size-xs);
        color: var(--color-text-muted);
        font-weight: 500;
    }
    
    .share-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border: 1px solid var(--color-border);
        border-radius: var(--border-radius);
        background-color: var(--color-surface);
        color: var(--color-text-secondary);
        cursor: pointer;
        transition: all var(--transition-fast);
    }
    
    .share-btn:hover {
        background-color: var(--color-accent);
        color: white;
        border-color: var(--color-accent);
        transform: translateY(-1px);
    }
    
    .notification {
        position: fixed;
        top: calc(var(--header-height) + var(--spacing-md));
        right: var(--spacing-md);
        padding: var(--spacing-md) var(--spacing-lg);
        background-color: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow-lg);
        font-size: var(--font-size-sm);
        z-index: 1001;
        transform: translateX(100%);
        opacity: 0;
        transition: all 0.3s ease;
    }
    
    .notification.show {
        transform: translateX(0);
        opacity: 1;
    }
    
    .notification-success {
        border-left: 4px solid #10b981;
        color: #10b981;
    }
    
    @media (max-width: 768px) {
        .social-sharing {
            flex-wrap: wrap;
        }
        
        .share-btn {
            width: 28px;
            height: 28px;
        }
        
        .notification {
            right: var(--spacing-sm);
            left: var(--spacing-sm);
            transform: translateY(-100%);
        }
        
        .notification.show {
            transform: translateY(0);
        }
    }
`

// Inject blog styles
const blogStyleSheet = document.createElement("style")
blogStyleSheet.textContent = blogStyles
document.head.appendChild(blogStyleSheet)

// Initialize blog manager
const blogManager = new BlogManager()
