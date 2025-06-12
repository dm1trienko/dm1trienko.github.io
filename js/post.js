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
      if (!res.ok) {
        throw new Error(res.status + ' ' + res.statusText)
      }
      const text = await res.text()
      const { meta, content } = this.parseFrontmatter(text)
      const body = this.stripTitleFromContent(content, meta.title)

      if (meta.title) {
        document.getElementById('post-title').textContent = meta.title
        document.title = meta.title + ' - Еремей Дмитриенко'
      }

      if (meta.date) {
        const dateEl = document.getElementById('post-date')
        dateEl.setAttribute('datetime', meta.date)
        dateEl.textContent = this.formatDate(meta.date)
      }

      document.getElementById('post-content').innerHTML = marked.parse(body)
    } catch (e) {
      const msg = e && e.message ? e.message : 'Unknown error'
      document.getElementById('post-content').textContent =
        'Не удалось загрузить пост: ' + msg
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

    if (!meta.title) {
      const m = body.match(/^\s*#\s+(.*)/)
      if (m) meta.title = m[1].trim()
    }

    return { meta, content: body }
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
        while (lines.length && lines[0].trim() === '') lines.shift()
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

  formatDate(str) {
    const d = new Date(str)
    return d.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const page = new BlogPostPage()
  page.init()
})
