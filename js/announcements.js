class AnnouncementsLoader {
  constructor() {
    this.loadAnnouncements()
  }

  loadAnnouncements() {
    const cards = document.querySelectorAll('.announcement-card[data-src]')
    cards.forEach((card) => {
      const src = card.dataset.src
      fetch(src)
        .then((r) => r.text())
        .then((md) => {
          const { meta } = this.parseFrontmatter(md)
          if (meta.title) {
            card.querySelector('.card-title').textContent = meta.title
          }
          if (meta.description) {
            card.querySelector('.card-description').textContent =
              meta.description
          }
          if (meta.date) {
            const time = card.querySelector('.card-date')
            time.setAttribute('datetime', meta.date)
            time.textContent = this.formatDate(meta.date)
          }
        })
        .catch(() => {
          card.querySelector('.card-title').textContent = 'Error'
        })
    })
  }

  parseFrontmatter(md) {
    const match = md.match(/^---\n([\s\S]*?)\n---/)
    const meta = {}
    if (match) {
      match[1].split(/\n/).forEach((line) => {
        const [key, ...rest] = line.split(':')
        meta[key.trim()] = rest.join(':').trim()
      })
    }
    return { meta }
  }

  formatDate(d) {
    const date = new Date(d)
    return date.toLocaleDateString(
      document.documentElement.lang === 'ru' ? 'ru-RU' : 'en-GB',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      },
    )
  }
}

document.addEventListener('DOMContentLoaded', () => new AnnouncementsLoader())
