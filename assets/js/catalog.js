/* Materials catalog (Explorer view)
   - folder tree: semester → subject → subfolders (from repo path) → items
   - rendered as a "file explorer" (left tree + right pane)
*/

async function loadJSON(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json();
}

function isExternalUrl(u) {
  return /^https?:\/\//i.test((u || "").toString());
}

function splitLocalPath(u) {
  // Prefer Explorer util if present (single source of truth)
  if (window.Explorer && typeof window.Explorer.splitLocalPath === "function") {
    return window.Explorer.splitLocalPath(u);
  }
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

function splitPathString(s){
  const raw = (s || "").toString().trim();
  if (!raw) return [];
  const norm = raw.replace(/\s*\/\s*/g, "/").replace(/\\+/g, "/");
  return norm.split("/").map(x => x.trim()).filter(Boolean);
}

function semesterToDir(sem){
  const raw = (sem || "").toString().trim();
  if (!raw) return "";
  // Already looks like a folder name
  if (/^\d+[_-]?семестр$/i.test(raw)) return raw.replace(/-/, "_");

  const s = raw.toLowerCase().replace(/ё/g, "е");
  const m = s.match(/(\d+)/);
  if (m && s.includes("семестр")) return `${m[1]}_семестр`;
  return raw;
}

function getExplicitPath(item){
  // Allows placing cloud/external materials into the same folder tree.
  // Supported fields:
  //   - path: ["1_семестр","Матан","Таблицы"]
  //   - path: "1_семестр/Матан/Таблицы"
  //   - folder: "..." (alias)
  if (!item) return [];
  if (Array.isArray(item.path)) return item.path.map(String).map(s => s.trim()).filter(Boolean);
  if (typeof item.path === "string") return splitPathString(item.path);
  if (typeof item.folder === "string") return splitPathString(item.folder);
  if (typeof item.dir === "string") return splitPathString(item.dir);
  return [];
}

function getPath(item) {
  // 1) Explicit path overrides everything (useful for external links).
  const explicit = getExplicitPath(item);
  if (explicit.length) return explicit;

  // 2) Local repo path → mirror real directory structure.
  const segs = splitLocalPath(item?.url || "");
  const dirs = segs.length ? segs.slice(0, -1) : [];
  if (dirs.length) return dirs;

  // 3) Fallback (external links without explicit path): try to integrate into
  //    the same semester/subject tree.
  const semDir = semesterToDir(item?.semester || "");
  const subject = (item?.subject || "").toString().trim();
  const out = [];
  if (semDir) out.push(semDir);
  if (subject) out.push(subject);
  return out.length ? out : ["Общее"];
}

function getMeta(item) {
  // Keep meta compact inside Explorer (path already shown in folders).
  // Show additional hint when available.
  const parts = [];
  if (item.description) parts.push("описание");
  return ""; // intentionally minimal
}

function render(resources) {
  const host = document.querySelector("#catalogHost");
  if (!host) return;

  if (!window.Explorer || typeof window.Explorer.render !== "function") {
    host.innerHTML = `<div class="notice">Каталог временно недоступен. Попробуй обновить страницу.</div>`;
    return;
  }

  window.Explorer.render(host, resources || [], {
    id: "materials",
    showCopy: false,
    getPath,
    getTitle: (it) => it.title || "Без названия",
    getMeta,
    // In folder view, tags often duplicate the path context — keep UI clean.
    showTags: false,
    getTags: (it) => Array.isArray(it.tags) ? it.tags : [],
    getDescription: (it) => it.description || "",
    getId: (it) => it.id || "",
    getSourceUrl: (it) => (it.url || it.embedUrl || ""),
    getOpenUrl: (it) => (it.id ? `viewer.html?id=${encodeURIComponent(it.id)}` : (it.url || it.embedUrl || "")),
    emptyText: "В этой папке пока нет материалов."
  });
}

document.addEventListener("resources:loaded", (e) => {
  const items = e?.detail || [];
  render(items);
});

document.addEventListener("DOMContentLoaded", async () => {
  // If the materials catalog isn't on this page, do nothing.
  const host = document.querySelector("#catalogHost");
  if (!host) return;

  try {
    const resources = (window.RESOURCES && Array.isArray(window.RESOURCES))
      ? window.RESOURCES
      : (await loadJSON("content/resources.json"));

    const items = Array.isArray(resources) ? resources : (resources.items || []);

    // Smart-recognize types/embeds from links (so `type` / `embedUrl` can be omitted).
    if (window.SmartLink && typeof window.SmartLink.normalizeItem === "function") {
      items.forEach((r) => window.SmartLink.normalizeItem(r));
    }

    render(items);
  } catch (e) {
    console.warn(e);
    host.innerHTML = `<div class="notice">Не получилось загрузить каталог. Попробуй обновить страницу или напиши в “Обратная связь”.</div>`;
  }
});
