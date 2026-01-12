async function loadJSON(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json();
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
    meta.textContent = [p.date || '', ...(p.tags || [])].filter(Boolean).join(' • ');

    const ex = document.createElement('p');
    ex.className = 'small';
    ex.textContent = p.excerpt || '';

    left.appendChild(h);
    left.appendChild(meta);
    if (p.excerpt) left.appendChild(ex);

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
    d.textContent = p.date || '';

    li.appendChild(a);
    li.appendChild(d);
    ul.appendChild(li);
  });

  host.appendChild(ul);
}

function sortNews(posts){
  return [...posts].sort((a,b) => {
    const da = a.date || '';
    const db = b.date || '';
    if (da !== db) return db.localeCompare(da);
    return (a.title || '').localeCompare(b.title || '', 'ru');
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const data = await loadJSON('content/news.json');
    const posts = sortNews(Array.isArray(data) ? data : (data.items || []));
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
