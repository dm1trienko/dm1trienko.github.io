import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import MarkdownIt from 'markdown-it'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const md = new MarkdownIt({ html: true })

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[.,!?:"'«»]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function parseFrontMatter(src) {
  if (src.startsWith('---')) {
    const end = src.indexOf('\n---', 3)
    if (end !== -1) {
      const fmContent = src.slice(3, end).trim()
      const metadata = {}
      fmContent.split(/\n+/).forEach((line) => {
        const [key, ...rest] = line.split(':')
        if (key) {
          metadata[key.trim()] = rest.join(':').trim()
        }
      })
      const content = src.slice(end + 4)
      return { metadata, content }
    }
  }
  return { metadata: {}, content: src }
}

function processDir(dir, outDir, index) {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }
  const files = fs.readdirSync(dir)
  for (const file of files) {
    if (!file.endsWith('.md')) continue
    const src = fs.readFileSync(path.join(dir, file), 'utf8')
    const { metadata, content } = parseFrontMatter(src)
    const html = md.render(content)
    const slug = slugify(file.replace(/\.md$/, ''))
    let title = metadata.title || ''
    if (!title) {
      const firstLine = content.split('\n').find((l) => l.trim()) || ''
      if (firstLine.startsWith('#')) {
        title = firstLine.replace(/^#\s*/, '')
      }
    }
    if (!title) {
      title = file.replace(/\.md$/, '')
    }
    fs.writeFileSync(path.join(outDir, `${slug}.html`), html)
    index.push({ title, slug, excerpt: content.slice(0, 160) })
  }
}

function build() {
  const index = []
  processDir(
    path.join(__dirname, '..', 'posts'),
    path.join(__dirname, '..', 'public', 'posts'),
    index,
  )
  processDir(
    path.join(__dirname, '..', 'announcements'),
    path.join(__dirname, '..', 'public', 'announcements'),
    index,
  )
  fs.writeFileSync(
    path.join(__dirname, '..', 'public', 'search-index.json'),
    JSON.stringify(index, null, 2),
  )
}

build()
