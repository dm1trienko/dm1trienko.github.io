async function loadJSON(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json();
}

function formatDateDisplay(date) {
  if (window.NewsMeta && typeof window.NewsMeta.formatDateDisplay === "function") {
    return window.NewsMeta.formatDateDisplay(date);
  }
  return date || "";
}

function dateSortKey(date) {
  if (window.NewsMeta && typeof window.NewsMeta.dateSortKey === "function") {
    return window.NewsMeta.dateSortKey(date);
  }
  const s = (date || "").toString();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return 0;
  return parseInt(`${m[1]}${m[2]}${m[3]}`, 10);
}

async function hydrateNewsPosts(posts) {
  if (window.NewsMeta && typeof window.NewsMeta.hydratePosts === "function") {
    return window.NewsMeta.hydratePosts(posts);
  }
  return posts;
}

function renderNewsList(posts) {
  const list = document.querySelector('#newsList');
  if (!list) return;

  list.innerHTML = '';
  if (!posts.length) {
    list.innerHTML = `<div class="notice">Пока нет постов.</div>`;
    return;
  }

  posts.forEach(p => {
    const el = document.createElement('div');
    el.className = 'card item';

    const left = document.createElement('div');
    left.className = 'item-left';

    const h = document.createElement('h3');
    h.className = 'item-title';
    h.textContent = p.title || 'Без названия';

    const meta = document.createElement('p');
    meta.className = 'item-meta';
    const dateText = p.dateDisplay || formatDateDisplay(p.date);
    if (dateText) {
      const dateEl = document.createElement('span');
      dateEl.textContent = dateText;
      meta.appendChild(dateEl);
    }

    const ex = document.createElement('p');
    ex.className = 'small';
    ex.textContent = p.excerpt || '';

    const tagsList = Array.isArray(p.tags) ? p.tags : (p.tags ? [String(p.tags)] : []);
    const tags = document.createElement('div');
    tags.className = 'tags';
    tagsList.slice(0, 6).forEach((t) => {
      const span = document.createElement('span');
      span.className = 'tag';
      span.textContent = t;
      tags.appendChild(span);
    });

    left.appendChild(h);
    if (dateText) left.appendChild(meta);
    if (p.excerpt) left.appendChild(ex);
    if (tagsList.length) left.appendChild(tags);

    const actions = document.createElement('div');
    actions.className = 'item-actions';

    const a = document.createElement('a');
    a.className = 'button';
    a.href = `post.html?id=${encodeURIComponent(p.id)}`;
    a.textContent = 'Читать';

    actions.appendChild(a);

    el.appendChild(left);
    el.appendChild(actions);

    list.appendChild(el);
  });
}

function renderHomeNewsPreview(posts) {
  const host = document.getElementById('homeNewsList');
  if (!host) return;

  host.innerHTML = '';

  if (!posts.length) {
    host.innerHTML = `<div class="small">Пока нет новостей.</div>`;
    return;
  }

  const ul = document.createElement('ul');
  ul.className = 'clean';

  posts.slice(0, 4).forEach(p => {
    const li = document.createElement('li');
    li.style.display = 'flex';
    li.style.gap = '10px';
    li.style.justifyContent = 'space-between';
    li.style.alignItems = 'baseline';

    const a = document.createElement('a');
    a.href = `post.html?id=${encodeURIComponent(p.id)}`;
    a.textContent = p.title || 'Без названия';

    const d = document.createElement('span');
    d.className = 'small';
    d.textContent = p.dateDisplay || formatDateDisplay(p.date);

    li.appendChild(a);
    li.appendChild(d);
    ul.appendChild(li);
  });

  host.appendChild(ul);
}

function sortNews(posts){
  return [...posts]
    .map((post, index) => ({ post, index }))
    .sort((a, b) => {
      const da = Number.isFinite(a?.post?._dateSort) ? a.post._dateSort : dateSortKey(a?.post?.date);
      const db = Number.isFinite(b?.post?._dateSort) ? b.post._dateSort : dateSortKey(b?.post?.date);
      if (da !== db) return db - da;
      const t = (a?.post?.title || '').localeCompare(b?.post?.title || '', 'ru');
      if (t !== 0) return t;
      return a.index - b.index;
    })
    .map(({ post }) => post);
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const data = await loadJSON('content/news.json');
    const raw = Array.isArray(data) ? data : (data.items || []);
    const hydrated = await hydrateNewsPosts(raw);
    const posts = sortNews(hydrated);
    window.NEWS = posts;
    try{ document.dispatchEvent(new CustomEvent("news:loaded", { detail: posts })); }catch(e){}

    const cnt = document.querySelector('[data-news-count]');
    if (cnt) cnt.textContent = posts.length.toString();

    renderNewsList(posts);
    renderHomeNewsPreview(posts);
  } catch (e) {
    console.warn(e);
    const list = document.querySelector('#newsList');
    if (list) list.innerHTML = `<div class="notice">Не получилось загрузить новости. Попробуй обновить страницу или загляни позже.</div>`;

    const host = document.getElementById('homeNewsList');
    if (host) host.innerHTML = `<div class="small">Не получилось загрузить новости.</div>`;
  }
});
