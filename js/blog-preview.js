class BlogPreview {
  constructor() {
    this.repo = 'dm1trienko/dm1trienko.github.io'
    this.maxPosts = 3
    this.loadPosts()
  }

  async loadPosts() {
    const container = document.getElementById('latest-posts')
    if (!container) return
    container.textContent = 'Загрузка...'
    try {
      const api = `https://api.github.com/repos/${this.repo}/contents/posts`
      const listRes = await fetch(api)
      const files = (await listRes.json()).filter((f) => f.name.endsWith('.md'))

      const posts = await Promise.all(
        files.map(async (file) => {
          const md = await fetch(file.download_url).then((r) => r.text())
          const { meta, excerpt } = this.parseFrontmatter(md)
          const title = meta.title || file.name.replace(/\.md$/i, '')
          return {
            file: file.name,
            title,
            date: meta.date || '',
            excerpt,
          }
        })
      )

      posts.sort((a, b) => new Date(b.date) - new Date(a.date))
      container.textContent = ''
      posts.slice(0, this.maxPosts).forEach((post) => {
        container.appendChild(this.renderCard(post))
      })
    } catch (e) {
      container.textContent = 'Не удалось загрузить статьи'
    }
  }

  parseFrontmatter(md) {
    const match = md.match(/^---\n([\s\S]*?)\n---\n/)
    const meta = {}
    let body = md
    if (match) {
      match[1].split(/\n/).forEach((line) => {
        const [k, ...r] = line.split(':')
        let val = r.join(':').trim()
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1)
        }
        meta[k.trim()] = val
      })
      body = md.slice(match[0].length)
    }
    if (meta['дата'] && !meta.date) {
      meta.date = this.parseDate(meta['дата'])
    }
    body = this.stripTitleFromContent(body, meta.title)
    const excerpt = body
      .trim()
      .split(/\n{2,}/)[0]
      .replace(/[#*_`>\[\]]/g, '')
    return { meta, excerpt, content: body }
  }

  stripTitleFromContent(content, title) {
    if (!title) return content
    const lines = content.split(/\n/)
    while (lines.length && lines[0].trim() === '') {
      lines.shift()
    }
    if (lines[0] && /^#\s+/.test(lines[0])) {
      const heading = lines[0].replace(/^#\s+/, '').trim()
      if (heading === title) {
        lines.shift()
        if (lines.length && lines[0].trim() === '') lines.shift()
      }
    }
    return lines.join('\n')
  }

  parseDate(str) {
    const parts = str.split('.')
    if (parts.length === 3) {
      const [d, m, y] = parts
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
    }
    return str
  }

  formatDate(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  renderCard(post) {
    const card = document.createElement('article')
    card.className = 'blog-card'
    card.innerHTML = `
      <div class="card-content">
        <h3 class="card-title">
          <a href="post.html?file=${encodeURIComponent(post.file)}">${post.title}</a>
        </h3>
        <p class="card-excerpt">${post.excerpt}</p>
        <time class="card-date" datetime="${post.date}">${this.formatDate(post.date)}</time>
      </div>
    `
    return card
  }
}

document.addEventListener('DOMContentLoaded', () => new BlogPreview())
