// CultTech Hub JavaScript

document.addEventListener('DOMContentLoaded', () => {
  // Initialize all functionality
  initVennDiagram()
  initProjectFilters()
  initCommunityMap()
  initJoinForm()
  initEvents()
  initScrollAnimations()
})

// Venn Diagram Interactions
function initVennDiagram() {
  const vennCircles = document.querySelectorAll('.venn-circle')
  const projectCards = document.querySelectorAll('.project-card')

  vennCircles.forEach((circle) => {
    circle.addEventListener('click', function () {
      const category = this.dataset.category
      highlightProjects(category)
    })

    circle.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        const category = this.dataset.category
        highlightProjects(category)
      }
    })

    // Make focusable
    circle.setAttribute('tabindex', '0')
    circle.setAttribute('role', 'button')
    circle.setAttribute(
      'aria-label',
      `Показать проекты категории ${circle.querySelector('.venn-label').textContent}`,
    )
  })
}

function highlightProjects(category) {
  const projectCards = document.querySelectorAll('.project-card')
  const filterBtns = document.querySelectorAll('.filter-btn')

  // Remove active states
  filterBtns.forEach((btn) => btn.classList.remove('filter-btn--active'))

  // Show relevant projects
  projectCards.forEach((card) => {
    const cardCategories = card.dataset.category
    if (category === 'all' || cardCategories.includes(category)) {
      card.classList.remove('hidden')
      card.style.display = 'block'
    } else {
      card.classList.add('hidden')
      setTimeout(() => {
        if (card.classList.contains('hidden')) {
          card.style.display = 'none'
        }
      }, 300)
    }
  })

  // Scroll to projects section
  document.querySelector('.projects').scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}

// Project Filters
function initProjectFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn')
  const projectCards = document.querySelectorAll('.project-card')

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', function () {
      const filter = this.dataset.filter

      // Update active button
      filterBtns.forEach((b) => b.classList.remove('filter-btn--active'))
      this.classList.add('filter-btn--active')

      // Filter projects
      filterProjects(filter)
    })
  })
}

function filterProjects(filter) {
  const projectCards = document.querySelectorAll('.project-card')

  projectCards.forEach((card) => {
    const category = card.dataset.category

    if (filter === 'all' || category === filter) {
      card.classList.remove('hidden')
      card.style.display = 'block'

      // Animate in
      setTimeout(() => {
        card.style.opacity = '1'
        card.style.transform = 'translateY(0)'
      }, 50)
    } else {
      card.classList.add('hidden')
      card.style.opacity = '0'
      card.style.transform = 'translateY(20px)'

      setTimeout(() => {
        if (card.classList.contains('hidden')) {
          card.style.display = 'none'
        }
      }, 300)
    }
  })
}

// Community Map
function initCommunityMap() {
  const mapPoints = document.querySelectorAll('.map-point')

  mapPoints.forEach((point) => {
    point.addEventListener('click', function () {
      const city = this.dataset.city
      showCityInfo(city)
    })

    point.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        const city = this.dataset.city
        showCityInfo(city)
      }
    })

    // Make focusable
    point.setAttribute('tabindex', '0')
    point.setAttribute('role', 'button')

    // Add ARIA label
    const tooltip = point.querySelector('.map-tooltip h4')
    if (tooltip) {
      point.setAttribute(
        'aria-label',
        `Показать информацию о ${tooltip.textContent}`,
      )
    }
  })
}

function showCityInfo(city) {
  const cityData = {
    moscow: {
      name: 'Москва',
      members: 12,
      description: 'Активное сообщество разработчиков и культурных деятелей',
      nextEvent: 'AI в креативных индустриях - 15 декабря',
    },
    spb: {
      name: 'Санкт-Петербург',
      members: 8,
      description: 'Центр культурных инноваций и стартапов',
      nextEvent: 'Стартап-питч культурных проектов - 22 декабря',
    },
    london: {
      name: 'Лондон',
      members: 15,
      description: 'Международный хаб финтеха и креативных технологий',
      nextEvent: 'Воркшоп по NFT в искусстве - 10 января',
    },
    ny: {
      name: 'Нью-Йорк',
      members: 23,
      description:
        'Крупнейшее сообщество на пересечении искусства и технологий',
      nextEvent: 'Tech Art Exhibition - 18 января',
    },
    berlin: {
      name: 'Берлин',
      members: 11,
      description: 'Европейский центр цифрового искусства',
      nextEvent: 'Digital Culture Meetup - 25 января',
    },
  }

  const data = cityData[city]
  if (data) {
    // Create modal or show info (simplified version)
    alert(
      `${data.name}\n${data.members} участников\n\n${data.description}\n\nСледующее мероприятие: ${data.nextEvent}`,
    )
  }
}

// Join Form
function initJoinForm() {
  const form = document.getElementById('join-form')

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault()
      handleJoinSubmit(this)
    })

    // Real-time validation
    const inputs = form.querySelectorAll('input[required]')
    inputs.forEach((input) => {
      input.addEventListener('blur', function () {
        validateField(this)
      })

      input.addEventListener('input', function () {
        if (this.classList.contains('error')) {
          validateField(this)
        }
      })
    })
  }
}

function validateField(field) {
  const value = field.value.trim()
  let isValid = true
  let errorMessage = ''

  if (field.hasAttribute('required') && !value) {
    isValid = false
    errorMessage = 'Это поле обязательно для заполнения'
  } else if (field.type === 'email' && value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      isValid = false
      errorMessage = 'Введите корректный email адрес'
    }
  }

  // Remove existing error
  const existingError = field.parentNode.querySelector('.field-error')
  if (existingError) {
    existingError.remove()
  }

  if (isValid) {
    field.classList.remove('error')
  } else {
    field.classList.add('error')
    const errorDiv = document.createElement('div')
    errorDiv.className = 'field-error'
    errorDiv.textContent = errorMessage
    field.parentNode.appendChild(errorDiv)
  }

  return isValid
}

function handleJoinSubmit(form) {
  const formData = new FormData(form)
  const data = {}

  // Collect form data
  for (const [key, value] of formData.entries()) {
    if (key === 'interests') {
      if (!data.interests) data.interests = []
      data.interests.push(value)
    } else {
      data[key] = value
    }
  }

  // Validate required fields
  const requiredFields = form.querySelectorAll('input[required]')
  let isValid = true

  requiredFields.forEach((field) => {
    if (!validateField(field)) {
      isValid = false
    }
  })

  if (!isValid) {
    return
  }

  // Show loading state
  const submitBtn = form.querySelector('button[type="submit"]')
  const originalText = submitBtn.textContent
  submitBtn.textContent = 'Отправка...'
  submitBtn.disabled = true

  // Simulate API call
  setTimeout(() => {
    // Reset form
    form.reset()

    // Show success message
    showSuccessMessage('Спасибо! Мы свяжемся с вами в ближайшее время.')

    // Reset button
    submitBtn.textContent = originalText
    submitBtn.disabled = false
  }, 2000)
}

function showSuccessMessage(message) {
  const successDiv = document.createElement('div')
  successDiv.className = 'success-message'
  successDiv.innerHTML = `
        <div class="success-content">
            <div class="success-icon">✓</div>
            <p>${message}</p>
        </div>
    `

  // Add styles
  successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `

  document.body.appendChild(successDiv)

  // Remove after 5 seconds
  setTimeout(() => {
    successDiv.style.animation = 'slideOut 0.3s ease'
    setTimeout(() => {
      if (successDiv.parentNode) {
        successDiv.parentNode.removeChild(successDiv)
      }
    }, 300)
  }, 5000)
}

// Events
function initEvents() {
  const eventBtns = document.querySelectorAll('.event-btn')

  eventBtns.forEach((btn) => {
    btn.addEventListener('click', function () {
      const eventCard = this.closest('.event-card')
      const eventTitle = eventCard.querySelector('.event-title').textContent
      const eventDate =
        eventCard.querySelector('.event-day').textContent +
        ' ' +
        eventCard.querySelector('.event-month').textContent

      // Simulate event registration
      this.textContent = 'Регистрация...'
      this.disabled = true

      setTimeout(() => {
        this.textContent = 'Зарегистрирован'
        this.style.background = '#10b981'

        showSuccessMessage(`Вы зарегистрированы на мероприятие "${eventTitle}"`)
      }, 1500)
    })
  })
}

// Scroll Animations
function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in')
      }
    })
  }, observerOptions)

  // Observe elements
  const animateElements = document.querySelectorAll(
    '.project-card, .event-card, .venn-diagram',
  )
  animateElements.forEach((el) => {
    observer.observe(el)
  })
}

// Keyboard Navigation
document.addEventListener('keydown', (e) => {
  // Navigate through filter buttons with arrow keys
  if (e.target.classList.contains('filter-btn')) {
    const buttons = Array.from(document.querySelectorAll('.filter-btn'))
    const currentIndex = buttons.indexOf(e.target)

    if (e.key === 'ArrowLeft' && currentIndex > 0) {
      e.preventDefault()
      buttons[currentIndex - 1].focus()
    } else if (e.key === 'ArrowRight' && currentIndex < buttons.length - 1) {
      e.preventDefault()
      buttons[currentIndex + 1].focus()
    }
  }

  // Navigate through map points
  if (e.target.classList.contains('map-point')) {
    const points = Array.from(document.querySelectorAll('.map-point'))
    const currentIndex = points.indexOf(e.target)

    if (e.key === 'ArrowUp' && currentIndex > 0) {
      e.preventDefault()
      points[currentIndex - 1].focus()
    } else if (e.key === 'ArrowDown' && currentIndex < points.length - 1) {
      e.preventDefault()
      points[currentIndex + 1].focus()
    }
  }
})

// Add CSS animations
const style = document.createElement('style')
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .animate-in {
        animation: fadeInUp 0.6s ease forwards;
    }
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .field-error {
        color: #ef4444;
        font-size: 0.875rem;
        margin-top: 0.25rem;
    }
    
    .form-input.error {
        border-color: #ef4444;
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }
`

document.head.appendChild(style)

// Utility Functions
function debounce(func, wait) {
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

// Progress bar update
function updateProgressBar() {
  const scrollTop = window.pageYOffset
  const docHeight = document.documentElement.scrollHeight - window.innerHeight
  const scrollPercent = (scrollTop / docHeight) * 100

  const progressBar = document.getElementById('progress-bar')
  if (progressBar) {
    progressBar.style.width = scrollPercent + '%'
  }
}

// Add scroll listener for progress bar
window.addEventListener('scroll', debounce(updateProgressBar, 10))

// Initialize progress bar
updateProgressBar()
