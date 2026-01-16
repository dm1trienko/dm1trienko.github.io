async function loadJSON(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json();
}

function uniq(arr) {
  return Array.from(new Set((arr || []).filter(Boolean)));
}

// Normalization for search:
// - case insensitive
// - "ё" treated as "е" (so users can type without diaeresis)
// - basic support for "C++" -> "cpp" so it can be found reliably
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
  (tokens || []).forEach(tok => {
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
  // Keep http(s) as-is; encode local paths (Cyrillic/spaces).
  if (/^https?:\/\//i.test(u)) return u;
  return encodeURI(u);
}

function isExternalUrl(u) {
  return /^https?:\/\//i.test((u || "").toString());
}

function splitLocalPath(u) {
  const raw = (u || "").toString().trim();
  if (!raw || isExternalUrl(raw)) return [];
  const clean = raw.split(/[?#]/)[0];
  return clean
    .split("/")
    .filter(Boolean)
    .map((seg) => {
      try {
        return decodeURIComponent(seg);
      } catch {
        return seg;
      }
    });
}

function splitPathString(s) {
  const raw = (s || "").toString().trim();
  if (!raw) return [];
  const norm = raw.replace(/\s*\/\s*/g, "/").replace(/\\+/g, "/");
  return norm.split("/").map((x) => x.trim()).filter(Boolean);
}

function getExplicitPath(item) {
  if (!item) return [];
  if (Array.isArray(item.path)) return item.path.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof item.path === "string") return splitPathString(item.path);
  if (typeof item.folder === "string") return splitPathString(item.folder);
  if (typeof item.dir === "string") return splitPathString(item.dir);
  return [];
}

// Subject subfolders (used for catalog + extra filter)
// Examples:
//  1_семестр/Матан/Письмак/ВвМА_О_21.pdf -> "Письмак"
//  1_семестр/Матан/file.pdf             -> "Общее"
function folderLabel(item) {
  const explicit = getExplicitPath(item);
  const segs = explicit.length ? explicit : splitLocalPath(item?.url || "");
  if (!segs.length) return "";

  const dirs = explicit.length ? segs : segs.slice(0, -1);
  if (!dirs.length) return "";

  let i = 0;
  const first = (dirs[0] || "").toString().toLowerCase();
  if (/^\d+[_-]?семестр$/i.test(first) || first.includes("семестр")) i = 1;
  if (i < dirs.length) i += 1; // skip subject dir

  const rest = dirs.slice(i).filter(Boolean);
  if (!rest.length) return "Общее";
  return rest.join(" / ");
}

function canViewInline(item) {
  // Viewer can show any item (and fall back to a link) — important for shareable URLs.
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
    form: "Форма/опрос",
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

function renderFilters(resources) {
  const typeSel = document.querySelector("#filterType");
  const semSel = document.querySelector("#filterSemester");
  const subSel = document.querySelector("#filterSubject");
  const folderSel = document.querySelector("#filterFolder");
  if (!typeSel || !semSel || !subSel || !folderSel) return;

  const types = uniq(resources.map((r) => r.type)).sort();
  const sems = uniq(resources.map((r) => r.semester)).sort((a, b) => (a || "").localeCompare(b || "", "ru"));
  const subs = uniq(resources.map((r) => r.subject)).sort((a, b) => (a || "").localeCompare(b || "", "ru"));
  const folders = uniq(resources.map((r) => folderLabel(r))).sort((a, b) => (a || "").localeCompare(b || "", "ru"));

  function fill(sel, items, labelAll) {
    sel.innerHTML = "";
    const opt0 = document.createElement("option");
    opt0.value = "";
    opt0.textContent = labelAll;
    sel.appendChild(opt0);
    items.forEach((v) => {
      const o = document.createElement("option");
      o.value = v;
      o.textContent = v;
      sel.appendChild(o);
    });
  }

  // store mapping label -> [types] for reverse filter (handles duplicates like xls/xlsx -> "Excel")
  const typeMap = {};
  types.forEach((t) => {
    const lbl = typeLabel(t);
    if (!typeMap[lbl]) typeMap[lbl] = [];
    if (!typeMap[lbl].includes(t)) typeMap[lbl].push(t);
  });
  const typeLabels = Object.keys(typeMap).sort((a, b) => a.localeCompare(b, "ru"));
  fill(typeSel, typeLabels, "Тип: все");
  typeSel.dataset.map = JSON.stringify(typeMap);

  fill(semSel, sems, "Семестр: все");
  fill(subSel, subs, "Раздел: всё");
  fill(folderSel, folders, "Подкаталог: все");
}

function getSelectedType() {
  const sel = document.querySelector("#filterType");
  if (!sel) return "";
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

function buildSearchIndex(resources) {
  resources.forEach((item) => {
    item._folder = folderLabel(item);
    const urlSegs = splitLocalPath(item?.url || "");
    const fileName = urlSegs.length ? urlSegs[urlSegs.length - 1] : "";
    const hayParts = [
      item.title,
      item.description,
      item.semester,
      item.subject,
      item._folder,
      item.folder,
      fileName,
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

  // Token containment (all query tokens present in any form)
  if (q.qTokens.length && q.qTokens.every((t) => hay.includes(t))) {
    score = Math.max(score, 0.9);
  }

  // Trigram similarity (typo-tolerant)
  const sHay = dice(q.qGrams, item._grams);
  const sTitle = dice(q.qGrams, item._titleGrams);

  score += sHay * 0.9 + sTitle * 0.7;

  return score;
}

function getFilteredRanked(resources) {
  const qRaw = document.querySelector("#searchQ")?.value || "";
  const q = buildQuery(qRaw);

  const types = getSelectedType();
  const sem = document.querySelector("#filterSemester")?.value || "";
  const sub = document.querySelector("#filterSubject")?.value || "";
  const folder = document.querySelector("#filterFolder")?.value || "";

  const base = resources.filter((item) => {
    if (types.length && !types.includes(item.type)) return false;
    if (sem && item.semester !== sem) return false;
    if (sub && item.subject !== sub) return false;
    if (folder && (item._folder || folderLabel(item)) !== folder) return false;
    return true;
  });

  if (!q.qNorm) {
    // Default ordering: title asc
    return base.sort((a, b) => (a.title || "").localeCompare(b.title || "", "ru"));
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

function renderResourcesList(resources) {
  const list = document.querySelector("#resourcesList");
  const results = document.querySelector("[data-res-results]");
  if (!list) return;

  const filtered = getFilteredRanked(resources);

  if (results) results.textContent = filtered.length.toString();

  list.innerHTML = "";
  if (!filtered.length) {
    list.innerHTML = `<div class="notice">Ничего не найдено. Попробуй изменить фильтры или запрос.</div>`;
    return;
  }

  filtered.forEach((item) => {
    const el = document.createElement("div");
    el.className = "card item";

    const explicitMissing = !!item?.missing || !!item?.notUploaded || (String(item?.status || "").toLowerCase() === "missing");

    const left = document.createElement("div");
    left.className = "item-left";

    const h = document.createElement("h3");
    h.className = "item-title";
    h.textContent = item.title || "Без названия";

    const meta = document.createElement("p");
    meta.className = "item-meta";
    const parts = [];
    if (item.semester) parts.push(item.semester);
    if (item.subject) parts.push(item.subject);
    if (item._folder && item._folder !== "Общее") parts.push(item._folder);
    const tl = typeLabel(item.type);
    // Если почти всё PDF, не шумим меткой "PDF" в результатах
    if (tl && tl !== "PDF") parts.push(tl);
    const metaText = document.createElement("span");
    metaText.textContent = parts.join(" • ");
    meta.appendChild(metaText);
    if (explicitMissing){
      const b = document.createElement("span");
      b.className = "badge warn";
      b.textContent = "файл ещё не загружен";
      meta.appendChild(b);
    }

    const tags = document.createElement("div");
    tags.className = "tags";
    (item.tags || []).slice(0, 6).forEach((t) => {
      const span = document.createElement("span");
      span.className = "tag";
      span.textContent = t;
      tags.appendChild(span);
    });

    const desc = document.createElement("p");
    desc.className = "small";
    desc.textContent = item.description || "";

    left.appendChild(h);
    left.appendChild(meta);
    if (item.description) left.appendChild(desc);
    if ((item.tags || []).length) left.appendChild(tags);

    const actions = document.createElement("div");
actions.className = "item-actions";

const u = item.url ? safeUrl(item.url) : "";

// Primary: open inside the hub (viewer has graceful fallback for any type)
const open = document.createElement("a");
open.className = "button";
if (canViewInline(item)) {
  open.href = `viewer.html?id=${encodeURIComponent(item.id)}`;
  open.textContent = "Открыть";
} else {
  open.href = u || "#";
  open.target = "_blank";
  open.rel = "noopener noreferrer";
  open.textContent = "Открыть";
}

// Secondary: share + open outside (small)
const copy = document.createElement("button");
copy.type = "button";
copy.className = "button ghost icon tiny";
copy.title = "Скопировать ссылку на этот материал";
copy.setAttribute("aria-label", copy.title);
copy.innerHTML = "⧉";
copy.addEventListener("click", async () => {
  const shareUrl = (window.makeViewerUrl && item.id) ? window.makeViewerUrl(item.id) : (u || "");
  if (window.copyToClipboard) await window.copyToClipboard(shareUrl);
});

const raw = document.createElement("a");
raw.className = "button ghost icon tiny";
raw.href = u || "#";
raw.target = "_blank";
raw.rel = "noopener noreferrer";
raw.title = "Открыть источник (вне сайта)";
raw.setAttribute("aria-label", raw.title);
raw.innerHTML = "↗";

actions.appendChild(open);
actions.appendChild(copy);
if (u && !explicitMissing) actions.appendChild(raw);

    el.appendChild(left);
    el.appendChild(actions);

    list.appendChild(el);
  });
}

function applyFilters(resources, f = {}) {
  const qEl = document.querySelector("#searchQ");
  const typeSel = document.querySelector("#filterType");
  const semSel = document.querySelector("#filterSemester");
  const subSel = document.querySelector("#filterSubject");
  const folderSel = document.querySelector("#filterFolder");

  if (qEl && typeof f.q === "string") qEl.value = f.q;
  if (semSel && typeof f.semester === "string") semSel.value = f.semester;
  if (subSel && typeof f.subject === "string") subSel.value = f.subject;
  if (folderSel && typeof f.folder === "string") folderSel.value = f.folder;

  if (typeSel && typeof f.type === "string") {
    // typeSel stores labels (e.g. "PDF"), but we also accept raw types (e.g. "pdf")
    const wanted = f.type;
    let labelCandidate = wanted;

    // If the option is not present as-is, try the human label
    try {
      const esc = (window.CSS && typeof window.CSS.escape === "function") ? window.CSS.escape(wanted) : wanted;
      if (!typeSel.querySelector(`option[value="${esc}"]`)) labelCandidate = typeLabel(wanted);
    } catch {
      labelCandidate = typeLabel(wanted);
    }

    typeSel.value = labelCandidate;
  }

  renderResourcesList(resources);
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const data = await loadJSON("content/resources.json");
    const resources = Array.isArray(data) ? data : (data.items || []);

    // Smart-recognize types/embeds from links (so `type` / `embedUrl` can be omitted).
    if (window.SmartLink && typeof window.SmartLink.normalizeItem === "function") {
      resources.forEach((r) => window.SmartLink.normalizeItem(r));
    }

    window.RESOURCES = resources;

    // Notify other sections (Home collections, etc.)
    try{
      document.dispatchEvent(new CustomEvent('resources:loaded', { detail: resources }));
    }catch(e){}

    // Prebuild fuzzy-search index (fast, no server)
    buildSearchIndex(resources);

    // Update all counters on the page
    document.querySelectorAll("[data-res-total]").forEach((el) => {
      el.textContent = resources.length.toString();
    });

    renderFilters(resources);

    // Allow other parts of the site to set filters programmatically
    window.setResourceFilters = (filters) => applyFilters(resources, filters || {});
    document.addEventListener("resources:setFilters", (ev) => {
      applyFilters(resources, ev.detail || {});
    });

    // Apply filters from URL params (useful when coming back from viewer.html)
    try {
      const params = new URL(window.location.href).searchParams;
      const sem = params.get("sem");
      const sub = params.get("sub");
      const type = params.get("type");
      const q = params.get("q");
      const folder = params.get("folder");
      const any = sem || sub || type || q || folder;
      if (any) {
        applyFilters(resources, {
          semester: sem || "",
          subject: sub || "",
          type: type || "",
          q: q || "",
          folder: folder || "",
        });
        // Optionally switch tab to search if tabs exist
        if (window.showTab) window.showTab("materials", "search");
      } else {
        renderResourcesList(resources);
      }
    } catch {
      renderResourcesList(resources);
    }

    // Hook up UI
    ["#searchQ", "#filterType", "#filterSemester", "#filterSubject", "#filterFolder"].forEach((sel) => {
      const el = document.querySelector(sel);
      if (!el) return;
      el.addEventListener("input", () => renderResourcesList(resources));
      el.addEventListener("change", () => renderResourcesList(resources));
      if (sel === "#searchQ") {
        el.addEventListener("keyup", () => renderResourcesList(resources));
        el.addEventListener("search", () => renderResourcesList(resources));
      }
    });

    const searchBtn = document.querySelector("#resourcesSearchBtn");
    if (searchBtn) {
      searchBtn.addEventListener("click", () => renderResourcesList(resources));
    }

    const reset = document.querySelector("#resetFilters");
    if (reset) {
      reset.addEventListener("click", () => {
        const q = document.querySelector("#searchQ");
        const t = document.querySelector("#filterType");
        const s = document.querySelector("#filterSemester");
        const sub = document.querySelector("#filterSubject");
        const f = document.querySelector("#filterFolder");
        if (q) q.value = "";
        if (t) t.value = "";
        if (s) s.value = "";
        if (sub) sub.value = "";
        if (f) f.value = "";
        renderResourcesList(resources);
      });
    }
  } catch (e) {
    console.warn(e);
    const list = document.querySelector("#resourcesList");
    if (list)
      list.innerHTML = `<div class="notice">Не получилось загрузить материалы. Попробуй обновить страницу или напиши в “Обратная связь”.</div>`;
  }
});
