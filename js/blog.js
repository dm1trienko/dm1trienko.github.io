class BlogPage {
  constructor() {
    this.repo = 'dm1trienko/dm1trienko.github.io'
    this.loadPosts()
    this.setupSearch()
    this.setupModal()
  }

  async loadPosts() {
    const container = document.getElementById('blog-grid')
    const status = document.getElementById('blog-status')
    if (!container) return

    status.textContent = 'Загрузка статей...'

    try {
      const api = `https://api.github.com/repos/${this.repo}/contents/posts`
      const listRes = await fetch(api)
      const files = (await listRes.json()).filter((f) => f.name.endsWith('.md'))

      const posts = await Promise.all(
        files.map(async (file) => {
          const md = await fetch(file.download_url).then((r) => r.text())
          const { meta, excerpt } = this.parseFrontmatter(md)
          return {
            file: file.name,
            title: meta.title || file.name,
            date: meta.date || '',
            excerpt,
          }
        })
      )

      posts
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .forEach((post) => {
          container.appendChild(this.renderCard(post))
        })
      status.textContent = posts.length ? '' : 'Посты не найдены'
    } catch {
      status.textContent = 'Не удалось загрузить статьи'
    }
  }

  parseFrontmatter(md) {
    const match = md.match(/^---\n([\s\S]*?)\n---\n/)
    const meta = {}
    let body = md
    if (match) {
      match[1].split(/\n/).forEach((line) => {
        const [k, ...r] = line.split(':')
        meta[k.trim()] = r.join(':').trim()
      })
      body = md.slice(match[0].length)
    }
    const excerpt = body
      .trim()
      .split(/\n{2,}/)[0]
      .replace(/[#*_`>\[\]]/g, '')
    return { meta, excerpt }
  }

  renderCard(post) {
    const card = document.createElement('article')
    card.className = 'blog-card'
    card.innerHTML = `
      <h3><a href="post.html?file=${encodeURIComponent(post.file)}" data-file="${post.file}">${post.title}</a></h3>
      <time datetime="${post.date}">${this.formatDate(post.date)}</time>
      <p>${post.excerpt}</p>
    `
    return card
  }

  setupSearch() {
    const input = document.getElementById('blog-search')
    if (!input) return
    input.addEventListener('input', () => {
      const term = input.value.toLowerCase()
      document.querySelectorAll('.blog-card').forEach((card) => {
        const text = card.textContent.toLowerCase()
        card.style.display = text.includes(term) ? '' : 'none'
      })
    })
  }

  setupModal() {
    this.modal = document.getElementById('blog-modal')
    if (!this.modal) return
    this.modalTitle = document.getElementById('modal-title')
    this.modalDate = document.getElementById('modal-date')
    this.modalBody = document.getElementById('modal-body')
    const closeBtn = document.getElementById('blog-modal-close')
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeModal())
    }
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.closeModal()
    })
    const grid = document.getElementById('blog-grid')
    if (grid) {
      grid.addEventListener('click', (e) => {
        const link = e.target.closest('a[data-file]')
        if (!link) return
        e.preventDefault()
        const file = link.getAttribute('data-file')
        if (file) this.openPost(file)
      })
    }
  }

  async openPost(file) {
    try {
      const res = await fetch('posts/' + file)
      if (!res.ok) throw new Error(res.statusText)
      const md = await res.text()
      const { meta, content } = this.parseFrontmatter(md)
      if (meta.title) {
        this.modalTitle.textContent = meta.title
      } else {
        this.modalTitle.textContent = ''
      }
      if (meta.date) {
        this.modalDate.setAttribute('datetime', meta.date)
        this.modalDate.textContent = this.formatDate(meta.date)
      } else {
        this.modalDate.textContent = ''
      }
      this.modalBody.innerHTML = marked.parse(content)
    } catch {
      this.modalBody.textContent = 'Не удалось загрузить пост'
    }
    this.modal.classList.add('active')
  }

  closeModal() {
    this.modal.classList.remove('active')
  }

  formatDate(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })
  }
}

document.addEventListener('DOMContentLoaded', () => new BlogPage())
