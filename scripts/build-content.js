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

function processDir(dir, outDir, index) {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }
  const files = fs.readdirSync(dir)
  for (const file of files) {
    if (!file.endsWith('.md')) continue
    const src = fs.readFileSync(path.join(dir, file), 'utf8')
    const html = md.render(src)
    const slug = slugify(file.replace(/\.md$/, ''))
    const title = src.split('\n')[0].replace(/^#\s*/, '')
    fs.writeFileSync(path.join(outDir, `${slug}.html`), html)
    index.push({ title, slug, excerpt: src.slice(0, 160) })
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
