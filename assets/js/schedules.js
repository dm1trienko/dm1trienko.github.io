(() => {
/* Schedules (расписания/календарь/графики)
   - filters: kind / semester / subject / type
   - "smart" search: trigram + substring + token containment (typo-tolerant)
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

// Search normalization:
// - case-insensitive
// - "ё" treated as "е"
// - a few helpful normalizations for "C++"
function normalizeText(s) {
  return (s || "")
    .toString()
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/c\+\+/g, "cpp")
    .replace(/\+\+/g, "pp")
    .replace(/\+/g, "p")
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
    for (let i = 0; i <= tok.length - 3; i++) {
      set.add(tok.slice(i, i + 3));
    }
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

// Viewer can show any item (and fall back to a link) — important for shareable URLs.
function canViewInline(item) {
  return !!(item && item.id);
}

function typeLabel(t) {
  const key = (t || "").toString().toLowerCase();
  const map = {
    pdf: "PDF",
    xlsx: "Excel",
    xls: "Excel",
    xlsm: "Excel",
    excel: "Excel",
    csv: "CSV",
    google_sheet: "Google Sheets",
    google_doc: "Google Docs",
    google_slides: "Google Slides",
    google_calendar: "Google Calendar",
    form: "Опрос/форма",
    telegram: "Telegram",
    link: "Ссылка",
    video: "Видео",
    drive: "Google Drive",
    drive_folder: "Google Drive",
    yandex_disk: "Яндекс.Диск",
    yandex_doc: "Яндекс.Документ",
    yandex_sheet: "Яндекс.Таблица",
    yandex: "Яндекс",
    md: "Пост",
  };
  return map[key] || (t ? t.toUpperCase() : "Материал");
}

function semesterSortKey(s) {
  const m = (s || "").toString().match(/(\d+)/);
  if (m) return parseInt(m[1], 10);
  return 9999;
}

function renderSchedFilters(items) {
  const kindSel = document.querySelector("#schedFilterKind");
  const semSel = document.querySelector("#schedFilterSemester");
  const subSel = document.querySelector("#schedFilterSubject");
  const typeSel = document.querySelector("#schedFilterType");
  if (!kindSel || !semSel || !subSel || !typeSel) return;

  const kinds = uniq(items.map((i) => i.kind || "Другое")).sort((a, b) => a.localeCompare(b, "ru"));
  const sems = uniq(items.map((i) => i.semester)).sort((a, b) => {
    const ka = semesterSortKey(a),
      kb = semesterSortKey(b);
    if (ka !== kb) return ka - kb;
    return (a || "").localeCompare(b || "", "ru");
  });
  const subs = uniq(items.map((i) => i.subject)).sort((a, b) => (a || "").localeCompare(b || "", "ru"));
  const types = uniq(items.map((i) => i.type)).sort();

  function fill(sel, values, labelAll) {
    sel.innerHTML = "";
    const o0 = document.createElement("option");
    o0.value = "";
    o0.textContent = labelAll;
    sel.appendChild(o0);
    values.forEach((v) => {
      const o = document.createElement("option");
      o.value = v;
      o.textContent = v;
      sel.appendChild(o);
    });
  }

  fill(kindSel, kinds, "Вид: все");
  fill(semSel, sems, "Семестр: все");
  fill(subSel, subs, "Предмет: все");

  // Mapping label -> [types] (handles duplicates like xls/xlsx -> "Excel")
  const typeMap = {};
  types.forEach((t) => {
    const lbl = typeLabel(t);
    if (!typeMap[lbl]) typeMap[lbl] = [];
    if (!typeMap[lbl].includes(t)) typeMap[lbl].push(t);
  });
  const typeLabels = Object.keys(typeMap).sort((a, b) => a.localeCompare(b, "ru"));
  fill(typeSel, typeLabels, "Тип: все");
  typeSel.dataset.map = JSON.stringify(typeMap);
}

function getSelectedType() {
  const sel = document.querySelector("#schedFilterType");
  if (!sel) return [];
  const label = sel.value;
  if (!label) return [];
  try {
    const map = JSON.parse(sel.dataset.map || "{}");
    const arr = map[label];
    return Array.isArray(arr) ? arr : (arr ? [arr] : []);
  } catch {
    return [];
  }
}

function buildSearchIndex(items) {
  items.forEach((item) => {
    const hayParts = [
      item.title,
      item.description,
      item.kind,
      item.semester,
      item.subject,
      ...(item.tags || []),
    ];

    const hay = normalizeText(hayParts.filter(Boolean).join(" "));
    const title = normalizeText(item.title || "");

    item._hay = hay;
    item._title = title;
    item._grams = buildTrigramSet(tokenize(hay));
    item._titleGrams = buildTrigramSet(tokenize(title));
  });
}

function buildQuery(qRaw) {
  const qNorm = normalizeText(qRaw);
  const qTokens = tokenize(qNorm);
  const qGrams = buildTrigramSet(qTokens);
  const qCompact = qNorm.replace(/\s+/g, "");

  // dynamic threshold: shorter queries need stricter matching to avoid noise
  let threshold = 0.18;
  if (qCompact.length <= 4) threshold = 0.25;
  else if (qCompact.length <= 6) threshold = 0.22;

  return { qRaw, qNorm, qTokens, qGrams, qCompact, threshold };
}

function scoreItem(item, q) {
  if (!q.qNorm) return 0;

  const hay = item._hay || "";
  const title = item._title || "";

  let score = 0;

  // Strong signals: direct includes
  if (title.includes(q.qNorm)) score = Math.max(score, 1.6);
  if (hay.includes(q.qNorm)) score = Math.max(score, 1.2);

  // For very short queries, only substring matches are meaningful
  if (q.qCompact.length < 3) return score;

  // Token containment
  if (q.qTokens.length && q.qTokens.every((t) => hay.includes(t))) {
    score = Math.max(score, 0.9);
  }

  // Trigram similarity (typo-tolerant)
  const sHay = dice(q.qGrams, item._grams);
  const sTitle = dice(q.qGrams, item._titleGrams);

  score += sHay * 0.9 + sTitle * 0.7;

  return score;
}

function getFilteredRanked(items) {
  const qRaw = document.querySelector("#schedQ")?.value || "";
  const q = buildQuery(qRaw);

  const kind = document.querySelector("#schedFilterKind")?.value || "";
  const sem = document.querySelector("#schedFilterSemester")?.value || "";
  const sub = document.querySelector("#schedFilterSubject")?.value || "";
  const types = getSelectedType();

  const base = items.filter((item) => {
    if (kind && (item.kind || "Другое") !== kind) return false;
    if (sem && (item.semester || "") !== sem) return false;
    if (sub && (item.subject || "") !== sub) return false;
    if (types.length && !types.includes(item.type || "")) return false;
    return true;
  });

  if (!q.qNorm) {
    return base.sort((a, b) => {
      const ka = semesterSortKey(a.semester);
      const kb = semesterSortKey(b.semester);
      if (ka !== kb) return ka - kb;
      const ck = (a.kind || "").localeCompare(b.kind || "", "ru");
      if (ck !== 0) return ck;
      return (a.title || "").localeCompare(b.title || "", "ru");
    });
  }

  const ranked = [];
  for (const item of base) {
    const s = scoreItem(item, q);
    if (s >= 1 || s >= q.threshold) ranked.push({ item, s });
  }

  ranked.sort((a, b) => {
    if (b.s !== a.s) return b.s - a.s;
    return (a.item.title || "").localeCompare(b.item.title || "", "ru");
  });

  return ranked.map((x) => x.item);
}

function renderSchedList(items) {
  const list = document.querySelector("#schedulesList");
  const resultsEl = document.querySelector("[data-sched-results]");
  if (!list) return;

  const filtered = getFilteredRanked(items);
  if (resultsEl) resultsEl.textContent = filtered.length.toString();

  list.innerHTML = "";
  if (!filtered.length) {
    list.innerHTML = `<div class="notice">Ничего не найдено. Попробуй изменить фильтры или запрос.</div>`;
    return;
  }

  filtered.forEach((item) => {
    const el = document.createElement("div");
    el.className = "card item";

    const left = document.createElement("div");
    left.className = "item-left";

    const h = document.createElement("h3");
    h.className = "item-title";
    h.textContent = item.title || "Без названия";

    const meta = document.createElement("p");
    meta.className = "item-meta";
    const parts = [];
    if (item.kind) parts.push(item.kind);
    if (item.semester) parts.push(item.semester);
    if (item.subject) parts.push(item.subject);
    parts.push(typeLabel(item.type));
    meta.textContent = parts.filter(Boolean).join(" • ");

    const desc = document.createElement("p");
    desc.className = "small";
    desc.textContent = item.description || "";

    const tags = document.createElement("div");
    tags.className = "tags";
    (item.tags || []).slice(0, 8).forEach((t) => {
      const span = document.createElement("span");
      span.className = "tag";
      span.textContent = t;
      tags.appendChild(span);
    });

    left.appendChild(h);
    left.appendChild(meta);
    if (item.description) left.appendChild(desc);
    if ((item.tags || []).length) left.appendChild(tags);

    const actions = document.createElement("div");
    actions.className = "item-actions";

    const src = safeUrl(item.url || item.embedUrl || "");

    const open = document.createElement("a");
    open.className = "button";
    if (canViewInline(item)) {
      open.href = `viewer.html?id=${encodeURIComponent(item.id)}`;
      open.textContent = "Открыть";
    } else {
      open.href = src || "#";
      open.target = "_blank";
      open.rel = "noopener noreferrer";
      open.textContent = "Открыть";
    }

    const copy = document.createElement("button");
    copy.type = "button";
    copy.className = "button ghost icon tiny";
    copy.title = "Скопировать ссылку на это расписание";
    copy.setAttribute("aria-label", copy.title);
    copy.innerHTML = "⧉";
    copy.addEventListener("click", async () => {
      const shareUrl = (window.makeViewerUrl && item.id) ? window.makeViewerUrl(item.id) : (src || "");
      if (window.copyToClipboard) await window.copyToClipboard(shareUrl);
    });

    const raw = document.createElement("a");
    raw.className = "button ghost icon tiny";
    raw.href = src || "#";
    raw.target = "_blank";
    raw.rel = "noopener noreferrer";
    raw.title = "Открыть источник (вне сайта)";
    raw.setAttribute("aria-label", raw.title);
    raw.innerHTML = "↗";

    actions.appendChild(open);
    actions.appendChild(copy);
    actions.appendChild(raw);

    el.appendChild(left);
    el.appendChild(actions);
    list.appendChild(el);
  });
}

function renderSchedulesCatalog(host, items) {
  if (!host) return;

  const all = (items || []).slice();
  if (!all.length) {
    host.innerHTML = `<div class="notice">Каталог пока пуст. Если у тебя есть расписание/календарь — напиши в “Обратная связь”.</div>`;
    return;
  }

  if (!window.Explorer || typeof window.Explorer.render !== "function") {
    host.innerHTML = `<div class="notice">Каталог временно недоступен. Попробуй обновить страницу.</div>`;
    return;
  }

  // Folder structure priority:
  // 1) Explicit path overrides everything (useful for cloud links)
  // 2) Local repo path mirrors the real directory tree (like in “Материалы”)
  // 3) Fallback by metadata (semester → kind → subject)
  function getPath(it) {
    try {
      if (typeof getExplicitPath === "function") {
        const explicit = getExplicitPath(it);
        if (explicit && explicit.length) return explicit;
      }
    } catch {}

    try {
      const segs = (typeof splitLocalPath === "function")
        ? splitLocalPath(it?.url || "")
        : (window.Explorer && typeof window.Explorer.splitLocalPath === "function")
          ? window.Explorer.splitLocalPath(it?.url || "")
          : [];
      const dirs = segs.length ? segs.slice(0, -1) : [];
      if (dirs.length) return dirs;
    } catch {}

    const semRaw = (it.semester || "").toString().trim();
    const sem = semRaw ? ((typeof semesterToDir === "function") ? semesterToDir(semRaw) : semRaw) : "Общее";
    const kind = (it.kind || "").toString().trim() || "Другое";
    const sub = (it.subject || "").toString().trim() || "Общее";
    return [sem, kind, sub];
  }

  window.Explorer.render(host, all, {
    id: "schedules",
    showCopy: false,
    getPath,
    getTitle: (it) => it.title || "Без названия",
    getMeta: (it) => "", // folder path already shows semester/kind/subject
    // In folder view, tags often duplicate the path context — keep UI clean.
    showTags: false,
    getTags: (it) => Array.isArray(it.tags) ? it.tags : [],
    getDescription: (it) => it.description || "",
    getId: (it) => it.id || "",
    getSourceUrl: (it) => (it.url || it.embedUrl || ""),
    getOpenUrl: (it) => (it.id ? `viewer.html?id=${encodeURIComponent(it.id)}` : (it.url || it.embedUrl || "")),
    emptyText: "В этой папке пока нет расписаний."
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const listHost = document.querySelector("#schedulesList");
  const catalogHost = document.querySelector("#schedulesCatalogHost");

  // If the schedules section isn't on this page, do nothing.
  if (!listHost && !catalogHost) return;

  try {
    const data = await loadJSON("content/schedules.json");
    const items = Array.isArray(data) ? data : data.items || [];

    // Smart-recognize types/embeds from links (so `type` / `embedUrl` can be omitted).
    if (window.SmartLink && typeof window.SmartLink.normalizeItem === "function") {
      items.forEach((it) => window.SmartLink.normalizeItem(it));
    }

    window.SCHEDULES = items;
    try{ document.dispatchEvent(new CustomEvent("schedules:loaded", { detail: items })); }catch(e){}

    // Prebuild fuzzy-search index (fast, no server)
    buildSearchIndex(items);

    // Counters
    document.querySelectorAll("[data-sched-total]").forEach((el) => {
      el.textContent = items.length.toString();
    });

    renderSchedFilters(items);
    renderSchedList(items);

    // Catalog
    if (catalogHost) renderSchedulesCatalog(catalogHost, items);

    // Events
    ["#schedQ", "#schedFilterKind", "#schedFilterSemester", "#schedFilterSubject", "#schedFilterType"].forEach((sel) => {
      const el = document.querySelector(sel);
      if (!el) return;
      el.addEventListener("input", () => renderSchedList(items));
      el.addEventListener("change", () => renderSchedList(items));
    });

    const searchBtn = document.querySelector("#schedSearchBtn");
    if (searchBtn) {
      searchBtn.addEventListener("click", () => renderSchedList(items));
    }

    const reset = document.querySelector("#schedReset");
    if (reset) {
      reset.addEventListener("click", () => {
        const q = document.querySelector("#schedQ");
        const kind = document.querySelector("#schedFilterKind");
        const sem = document.querySelector("#schedFilterSemester");
        const sub = document.querySelector("#schedFilterSubject");
        const type = document.querySelector("#schedFilterType");
        if (q) q.value = "";
        if (kind) kind.value = "";
        if (sem) sem.value = "";
        if (sub) sub.value = "";
        if (type) type.value = "";
        renderSchedList(items);
      });
    }
  } catch (e) {
    console.warn(e);
    if (listHost) listHost.innerHTML = `<div class="notice">Не получилось загрузить расписания. Попробуй обновить страницу или напиши в “Обратная связь”.</div>`;
    if (catalogHost) catalogHost.innerHTML = `<div class="notice">Не получилось загрузить каталог расписаний. Попробуй обновить страницу или напиши в “Обратная связь”.</div>`;
    document.querySelectorAll("[data-sched-total]").forEach((el) => {
      el.textContent = "0";
    });
  }
});
})();
