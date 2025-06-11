class BlogPage {
  constructor() {
    this.loadPosts()
    this.setupSearch()
  }

  async loadPosts() {
    const container = document.getElementById('blog-grid')
    if (!container) return

    const postFiles = ['post1.md', 'post2.md', 'post3.md']
    const posts = await Promise.all(postFiles.map((f) => this.fetchPost(f)))

    posts.forEach((post) => {
      if (!post) return
      const card = document.createElement('article')
      card.className = 'blog-card'
      card.innerHTML = `
        <h3><a href="post.html?file=${post.file}">${post.title}</a></h3>
        <p>${post.excerpt}</p>
        <time datetime="${post.date}">${this.formatDate(post.date)}</time>
      `
      container.appendChild(card)
    })
  }

  async fetchPost(file) {
    try {
      const res = await fetch('posts/' + file)
      const text = await res.text()
      const { meta, content } = this.parseFrontmatter(text)
      const words = content.trim().split(/\s+/).slice(0, 30).join(' ')
      return {
        file,
        title: meta.title || 'Без названия',
        date: meta.date || '',
        excerpt: words + '...'
      }
    } catch (e) {
      return null
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
    return { meta, content: body }
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

  formatDate(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })
  }
}

document.addEventListener('DOMContentLoaded', () => new BlogPage())
