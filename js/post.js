class BlogPostPage {
  async init() {
    const params = new URLSearchParams(window.location.search)
    const file = params.get('file')
    if (!file) {
      document.getElementById('post-content').textContent = 'Post not found'
      return
    }
    try {
      const res = await fetch('posts/' + file)
      const text = await res.text()
      const { meta, content } = this.parseFrontmatter(text)
      if (meta.title) {
        document.getElementById('post-title').textContent = meta.title
        document.title = meta.title + ' - Еремей Дмитриенко'
      }
      if (meta.date) {
        const dateEl = document.getElementById('post-date')
        dateEl.setAttribute('datetime', meta.date)
        dateEl.textContent = this.formatDate(meta.date)
      }
      document.getElementById('post-content').innerHTML = marked.parse(content)
    } catch (e) {
      document.getElementById('post-content').textContent = 'Unable to load post'
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

  formatDate(str) {
    const d = new Date(str)
    return d.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const page = new BlogPostPage()
  page.init()
})
