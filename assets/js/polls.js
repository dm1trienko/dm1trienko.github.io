/* Polls (опросы/формы)
   - catalogized by category
   - "smart" search: trigram + substring + token containment (typo-tolerant)
   - embeds on the site (active polls)
   - share links: copy viewer.html?id=...
*/

async function loadJSON(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json();
}

function uniq(arr) {
  return Array.from(new Set((arr || []).filter(Boolean)));
}

function normalizeText(s) {
  return (s || "")
    .toString()
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/c\+\+/g, "cpp")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(s) {
  const clean = normalizeText(s).replace(/[^0-9a-zа-я]+/gi, " ");
  return clean.split(/\s+/).filter(Boolean);
}

function buildTrigramSet(tokens) {
  const set = new Set();
  (tokens || []).forEach((tok) => {
    if (!tok) return;
    if (tok.length <= 2) {
      set.add(tok);
      return;
    }
    for (let i = 0; i <= tok.length - 3; i++) set.add(tok.slice(i, i + 3));
  });
  return set;
}

function dice(a, b) {
  if (!a || !b || !a.size || !b.size) return 0;
  let inter = 0;
  const [small, big] = a.size <= b.size ? [a, b] : [b, a];
  for (const x of small) if (big.has(x)) inter++;
  return (2 * inter) / (a.size + b.size);
}

function safeUrl(u) {
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  return encodeURI(u);
}

function getEmbedUrl(rawUrl) {
  const raw = (rawUrl || "").toString();
  if (!raw) return "";
  try {
    if (window.SmartLink && typeof window.SmartLink.toEmbedUrl === "function") {
      const emb = window.SmartLink.toEmbedUrl(raw, "form");
      return safeUrl(emb || raw);
    }
  } catch (e) {}
  return safeUrl(raw);
}

function djb2Hash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (h * 33) ^ str.charCodeAt(i);
  }
  // Convert to positive 32-bit
  return (h >>> 0).toString(16);
}

function ensureId(p) {
  if (p.id) return p.id;
  const seed = [p.title || "", p.created || "", p.url || "", p.embedUrl || ""].join("|");
  return "p_" + djb2Hash(seed);
}

function isArchived(p) {
  const s = normalizeText(p.status);
  return s === "archived" || s === "closed" || s === "done";
}

function pollMeta(p) {
  const parts = [];
  if (p.category) parts.push(p.category);
  if (p.semester) parts.push(p.semester);
  if (p.subject) parts.push(p.subject);
  if (p.status) parts.push(isArchived(p) ? "архив" : "активный");
  return parts.filter(Boolean).join(" • ");
}

function buildSearchIndex(polls) {
  polls.forEach((p) => {
    const hayParts = [p.title, p.description, p.category, p.semester, p.subject, ...(p.tags || [])];
    const hay = normalizeText(hayParts.filter(Boolean).join(" "));
    const title = normalizeText(p.title || "");
    p._hay = hay;
    p._title = title;
    p._grams = buildTrigramSet(tokenize(hay));
    p._titleGrams = buildTrigramSet(tokenize(title));
  });
}

function buildQuery(qRaw) {
  const qNorm = normalizeText(qRaw);
  const qTokens = tokenize(qNorm);
  const qGrams = buildTrigramSet(qTokens);
  const qCompact = qNorm.replace(/\s+/g, "");

  let threshold = 0.18;
  if (qCompact.length <= 4) threshold = 0.25;
  else if (qCompact.length <= 6) threshold = 0.22;

  return { qRaw, qNorm, qTokens, qGrams, qCompact, threshold };
}

function scoreItem(p, q) {
  if (!q.qNorm) return 0;

  const hay = p._hay || "";
  const title = p._title || "";

  let score = 0;

  if (title.includes(q.qNorm)) score = Math.max(score, 1.6);
  if (hay.includes(q.qNorm)) score = Math.max(score, 1.2);

  if (q.qCompact.length < 3) return score;

  if (q.qTokens.length && q.qTokens.every((t) => hay.includes(t))) {
    score = Math.max(score, 0.9);
  }

  const sHay = dice(q.qGrams, p._grams);
  const sTitle = dice(q.qGrams, p._titleGrams);

  score += sHay * 0.9 + sTitle * 0.7;

  return score;
}

function getActiveFilters() {
  return {
    qRaw: document.querySelector("#pollsQ")?.value || "",
    category: document.querySelector("#pollsCategory")?.value || "",
    semester: document.querySelector("#pollsSemester")?.value || "",
    subject: document.querySelector("#pollsSubject")?.value || "",
  };
}

function filterAndRank(polls, f, { archived = false } = {}) {
  const q = buildQuery(f.qRaw);

  const base = polls.filter((p) => {
    if (archived && !isArchived(p)) return false;
    if (!archived && isArchived(p)) return false;

    if (f.category && (p.category || "") !== f.category) return false;
    if (f.semester && (p.semester || "") !== f.semester) return false;
    if (f.subject && (p.subject || "") !== f.subject) return false;

    return true;
  });

  if (!q.qNorm) {
    return base
      .slice()
      .sort((a, b) => (b.created || "").localeCompare(a.created || ""));
  }

  const ranked = [];
  for (const p of base) {
    const s = scoreItem(p, q);
    if (s >= 1 || s >= q.threshold) ranked.push({ p, s });
  }

  ranked.sort((a, b) => {
    if (b.s !== a.s) return b.s - a.s;
    return (b.p.created || "").localeCompare(a.p.created || "");
  });

  return ranked.map((x) => x.p);
}

function renderPollCard(p, { embed = true } = {}) {
  const card = document.createElement("div");
  card.className = "card";

  const header = document.createElement("div");
  header.className = "item";

  const left = document.createElement("div");
  left.className = "item-left";

  const h = document.createElement("h3");
  h.className = "item-title";
  h.textContent = p.title || "Опрос";

  const meta = document.createElement("p");
  meta.className = "item-meta";
  meta.textContent = pollMeta(p);

  const d = document.createElement("p");
  d.className = "small";
  d.textContent = p.description || "";

  const tags = document.createElement("div");
  tags.className = "tags";
  (p.tags || []).slice(0, 10).forEach((t) => {
    const span = document.createElement("span");
    span.className = "tag";
    span.textContent = t;
    tags.appendChild(span);
  });

  left.appendChild(h);
  left.appendChild(meta);
  if (p.description) left.appendChild(d);
  if ((p.tags || []).length) left.appendChild(tags);

  const actions = document.createElement("div");
  actions.className = "item-actions";

  const viewerUrl = (p.id ? `viewer.html?id=${encodeURIComponent(p.id)}` : "");
  const outsideUrl = safeUrl(p.url || p.embedUrl || "");

  const open = document.createElement("a");
  open.className = "button";
  open.href = viewerUrl || (outsideUrl || "#");
  if (!viewerUrl) {
    open.target = "_blank";
    open.rel = "noopener noreferrer";
  }
  open.textContent = "Открыть";

  const copy = document.createElement("button");
  copy.type = "button";
  copy.className = "button ghost icon tiny";
  copy.title = "Скопировать ссылку на этот опрос";
  copy.setAttribute("aria-label", copy.title);
  copy.innerHTML = "⧉";
  copy.addEventListener("click", async () => {
    const shareUrl = (window.makeViewerUrl && p.id) ? window.makeViewerUrl(p.id) : (outsideUrl || "");
    if (window.copyToClipboard) await window.copyToClipboard(shareUrl);
  });

  const raw = document.createElement("a");
  raw.className = "button ghost icon tiny";
  raw.href = outsideUrl || "#";
  raw.target = "_blank";
  raw.rel = "noopener noreferrer";
  raw.title = "Открыть вне сайта";
  raw.setAttribute("aria-label", raw.title);
  raw.innerHTML = "↗";

  actions.appendChild(open);
  actions.appendChild(copy);
  actions.appendChild(raw);

  header.appendChild(left);
  header.appendChild(actions);
  card.appendChild(header);

  // Embed (active polls)
  if (embed && p.embedUrl) {
    const hr = document.createElement("hr");
    hr.className = "sep";
    card.appendChild(hr);

    const iframe = document.createElement("iframe");
    const baseSrc = (p.embedUrl || p.url || outsideUrl || "").toString();
    iframe.dataset.baseSrc = baseSrc;
    iframe.className = "viewer-frame";
    iframe.style.minHeight = "520px";
    iframe.title = p.title || "Опрос";
    iframe.loading = "lazy";
    iframe.src = getEmbedUrl(baseSrc);

    // If this is a Yandex form, load the official embed helper so the iframe can auto-resize.
    try{
      if (/forms\.yandex\./i.test(iframe.src) && typeof window.ensureYandexFormsEmbed === "function") {
        window.ensureYandexFormsEmbed();
      }
    }catch(e){}

    const frameWrap = document.createElement("div");
    frameWrap.style.padding = "0 14px 14px";
    frameWrap.appendChild(iframe);

    card.appendChild(frameWrap);
  } else if (embed && !p.embedUrl && outsideUrl) {
    const note = document.createElement("div");
    note.className = "notice";
    note.style.margin = "0 14px 14px";
    note.innerHTML = `Встроенного просмотра нет — открой опрос по кнопке ↗ (или по ссылке: <a href="${outsideUrl}" target="_blank" rel="noopener noreferrer">Открыть источник</a>).`;
    card.appendChild(note);
  }

  return card;
}

function renderActiveTools(host, polls) {
  if (!host) return;

  const categories = uniq(polls.map((p) => p.category || "Без категории")).sort((a, b) => a.localeCompare(b, "ru"));
  const semesters = uniq(polls.map((p) => p.semester)).sort((a, b) => (a || "").localeCompare(b || "", "ru"));
  const subjects = uniq(polls.map((p) => p.subject)).sort((a, b) => (a || "").localeCompare(b || "", "ru"));

  host.innerHTML = `
    <div class="tools" style="flex-wrap:wrap;">
      <input id="pollsQ" class="input" placeholder="Умный поиск по опросам (с опечатками тоже)…" />
      <select id="pollsCategory" aria-label="Категория">
        <option value="">Категория: все</option>
        ${categories.map((c) => `<option value="${c.replace(/"/g, "&quot;")}">${c}</option>`).join("")}
      </select>
      <select id="pollsSemester" aria-label="Семестр">
        <option value="">Семестр: все</option>
        ${semesters.map((s) => `<option value="${(s || "").replace(/"/g, "&quot;")}">${s}</option>`).join("")}
      </select>
      <select id="pollsSubject" aria-label="Предмет">
        <option value="">Предмет: все</option>
        ${subjects.map((s) => `<option value="${(s || "").replace(/"/g, "&quot;")}">${s}</option>`).join("")}
      </select>
      <button id="pollsReset" class="button ghost" type="button">Сброс</button>
    </div>
    <div class="small" style="margin:10px 2px 0;">Найдено: <span data-polls-results>—</span></div>
  `;
}

function renderActiveList(host, polls) {
  if (!host) return;

  const f = getActiveFilters();
  const filtered = filterAndRank(polls, f, { archived: false });

  const countEl = document.querySelector("[data-polls-results]");
  if (countEl) countEl.textContent = filtered.length.toString();

  host.innerHTML = "";

  if (!filtered.length) {
    host.innerHTML = `<div class="notice">Пока нет активных опросов по выбранным фильтрам.</div>`;
    return;
  }

  filtered.forEach((p) => host.appendChild(renderPollCard(p, { embed: true })));
}

function renderArchiveList(host, polls) {
  if (!host) return;

  const f = getActiveFilters();
  // In archive we respect the same filters (except status)
  const archived = filterAndRank(polls, f, { archived: true });

  host.innerHTML = "";
  if (!archived.length) {
    host.innerHTML = `<div class="notice">Архив пуст.</div>`;
    return;
  }

  archived.forEach((p) => host.appendChild(renderPollCard(p, { embed: false })));
}

function renderPollsCatalog(host, polls) {
  if (!host) return;

  const all = (polls || []).slice();
  if (!all.length) {
    host.innerHTML = `<div class="notice">Каталог пока пуст. Если хочешь запустить опрос — напиши в “Обратная связь”.</div>`;
    return;
  }

  if (!window.Explorer || typeof window.Explorer.render !== "function") {
    host.innerHTML = `<div class="notice">Каталог временно недоступен. Попробуй обновить страницу.</div>`;
    return;
  }

  // Folder structure priority:
  // 1) Explicit path overrides everything (useful for cloud links)
  // 2) Local repo path mirrors the real directory tree (like in “Материалы”)
  // 3) Fallback by metadata (Активные/Архив → категория → семестр → предмет)
  function getPath(p) {
    try {
      if (typeof getExplicitPath === "function") {
        const explicit = getExplicitPath(p);
        if (explicit && explicit.length) return explicit;
      }
    } catch {}

    try {
      const src = (p.url || p.embedUrl || "").toString();
      const segs = (typeof splitLocalPath === "function")
        ? splitLocalPath(src)
        : (window.Explorer && typeof window.Explorer.splitLocalPath === "function")
          ? window.Explorer.splitLocalPath(src)
          : [];
      const dirs = segs.length ? segs.slice(0, -1) : [];
      if (dirs.length) return dirs;
    } catch {}

    const statusFolder = isArchived(p) ? "Архив" : "Активные";
    const cat = (p.category || "Без категории").toString().trim() || "Без категории";
    const segs = [statusFolder, cat];
    if (p.semester) {
      const semRaw = p.semester.toString();
      segs.push((typeof semesterToDir === "function") ? semesterToDir(semRaw) : semRaw);
    }
    if (p.subject) segs.push(p.subject.toString());
    return segs;
  }

  window.Explorer.render(host, all, {
    id: "polls",
    showCopy: false,
    getPath,
    getTitle: (p) => p.title || "Опрос",
    getMeta: (p) => pollMeta(p),
    // In folder view, tags often duplicate the current context — keep UI clean.
    showTags: false,
    getTags: (p) => Array.isArray(p.tags) ? p.tags : [],
    getDescription: (p) => p.description || "",
    getId: (p) => ensureId(p),
    getSourceUrl: (p) => (p.url || p.embedUrl || ""),
    getOpenUrl: (p) => {
      const id = ensureId(p);
      return id ? `viewer.html?id=${encodeURIComponent(id)}` : (p.url || p.embedUrl || "");
    },
    emptyText: "В этой папке пока нет опросов."
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const activeTools = document.querySelector("#pollsActiveTools");
  const activeList = document.querySelector("#pollsActiveList");
  const catalogHost = document.querySelector("#pollsCatalogHost");
  const archiveList = document.querySelector("#pollsArchiveList");

  // If polls section isn't present on this page, do nothing.
  if (!activeTools && !activeList && !catalogHost && !archiveList) return;

  try {
    const idx = await loadJSON("content/polls.json");
    const raw = Array.isArray(idx) ? idx : idx.polls || [];

    const polls = raw.map((p) => ({
      ...p,
      id: ensureId(p),
      category: p.category || "Общее",
      status: p.status || "active",
      tags: Array.isArray(p.tags) ? p.tags : p.tags ? [String(p.tags)] : [],
    }));

    function syncEmbeddedThemes(){
      // Only matters for providers with explicit theming (Yandex Forms: theme=dark/light).
      try{
        const frames = (activeList ? activeList.querySelectorAll("iframe[data-base-src]") : []);
        frames.forEach((ifr) => {
          const base = (ifr.dataset.baseSrc || "").toString();
          if (!base) return;
          // Avoid needless reloads for other providers.
          if (!/forms\.yandex\./i.test(base)) return;
          const next = getEmbedUrl(base);
          if (next && ifr.src !== next) ifr.src = next;
        });
      }catch(e){}
    }

    // Polls are meant to be embedded. If the JSON only has a `url`,
    // we auto-fill `type=form` and build an embed URL (Google/Yandex/etc.).
    polls.forEach((p) => {
      if (!p.type) p.type = "form";
      if (!p.embedUrl && p.url) p.embedUrl = p.url;
      if (window.SmartLink && typeof window.SmartLink.normalizeItem === "function") {
        window.SmartLink.normalizeItem(p);
      }
    });

    window.POLLS = polls;
    try{ document.dispatchEvent(new CustomEvent("polls:loaded", { detail: polls })); }catch(e){}

    // Prebuild fuzzy-search index
    buildSearchIndex(polls);

    renderActiveTools(activeTools, polls);
    renderActiveList(activeList, polls);
    renderPollsCatalog(catalogHost, polls);
    renderArchiveList(archiveList, polls);

    // Keep embedded Yandex Forms readable when the user toggles theme.
    document.addEventListener("theme:changed", () => syncEmbeddedThemes());

    // events for active filters
    ["#pollsQ", "#pollsCategory", "#pollsSemester", "#pollsSubject"].forEach((sel) => {
      const el = document.querySelector(sel);
      if (!el) return;
      el.addEventListener("input", () => {
        renderActiveList(activeList, polls);
        renderArchiveList(archiveList, polls);
        syncEmbeddedThemes();
      });
      el.addEventListener("change", () => {
        renderActiveList(activeList, polls);
        renderArchiveList(archiveList, polls);
        syncEmbeddedThemes();
      });
    });

    const reset = document.querySelector("#pollsReset");
    if (reset) {
      reset.addEventListener("click", () => {
        const q = document.querySelector("#pollsQ");
        const c = document.querySelector("#pollsCategory");
        const s = document.querySelector("#pollsSemester");
        const sub = document.querySelector("#pollsSubject");
        if (q) q.value = "";
        if (c) c.value = "";
        if (s) s.value = "";
        if (sub) sub.value = "";
        renderActiveList(activeList, polls);
        renderArchiveList(archiveList, polls);
        syncEmbeddedThemes();
      });
    }
  } catch (e) {
    console.warn(e);

    if (activeList) activeList.innerHTML = `<div class="notice">Не получилось загрузить опросы. Попробуй обновить страницу или напиши в “Обратная связь”.</div>`;
    if (catalogHost) catalogHost.innerHTML = `<div class="notice">Не получилось загрузить каталог опросов. Попробуй обновить страницу или напиши в “Обратная связь”.</div>`;
    if (archiveList) archiveList.innerHTML = `<div class="notice">Не получилось загрузить архив опросов. Попробуй обновить страницу или напиши в “Обратная связь”.</div>`;
  }
});
