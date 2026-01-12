/* dmitrienok.ru — minimal static site core
   Edit content in /content/*.json (no build step).
*/

async function loadJSON(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json();
}

function setText(selector, value) {
  document.querySelectorAll(selector).forEach(el => { el.textContent = value ?? ""; });
}

function setAttr(selector, attr, value) {
  document.querySelectorAll(selector).forEach(el => { el.setAttribute(attr, value ?? ""); });
}

function renderLinks(listEl, links) {
  if (!listEl) return;
  listEl.innerHTML = "";
  (links || []).forEach(l => {
    if (!l?.url) return;
    const a = document.createElement("a");
    a.className = "button ghost";
    a.href = l.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = l.label || l.url;
    listEl.appendChild(a);
  });
}


// ------------------
// Copy-to-clipboard + Toast (share links)
// ------------------
function ensureToastEl(){
  let t = document.getElementById("toast");
  if (t) return t;
  t = document.createElement("div");
  t.id = "toast";
  t.className = "toast hidden";
  t.setAttribute("role", "status");
  t.setAttribute("aria-live", "polite");
  document.body.appendChild(t);
  return t;
}

let _toastTimer = null;
function showToast(message, { duration = 2200 } = {}){
  const el = ensureToastEl();
  el.textContent = message || "";
  el.classList.remove("hidden");
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => {
    el.classList.add("hidden");
  }, duration);
}

async function copyToClipboard(text){
  const value = (text || "").toString();
  if (!value) return false;

  // Modern clipboard API (HTTPS)
  try{
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(value);
      showToast("Ссылка скопирована");
      return true;
    }
  }catch(e){
    // continue to fallback
  }

  // Fallback (older browsers)
  try{
    const ta = document.createElement("textarea");
    ta.value = value;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-9999px";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    if (ok) showToast("Ссылка скопирована");
    return ok;
  }catch(e){
    // Last resort
    try{
      window.prompt("Скопируй ссылку:", value);
      return true;
    }catch{}
    return false;
  }
}

// Build a stable absolute URL to viewer.html for share buttons
function makeViewerUrl(id){
  const u = new URL("viewer.html", window.location.href);
  u.searchParams.set("id", id);
  u.hash = "";
  return u.toString();
}


// ------------------
// Local file availability ("файл ещё не загружен")
// ------------------
function isExternalUrl(u){
  const s = (u || "").toString().trim().toLowerCase();
  return /^https?:\/\//.test(s) || /^mailto:/i.test(s) || /^tel:/i.test(s);
}

function isLocalUrl(u){
  const s = (u || "").toString().trim();
  return !!s && !isExternalUrl(s);
}

const _fileExistsCache = new Map();
async function fileExists(url){
  const u = (url || "").toString().trim();
  if (!u) return false;
  if (!isLocalUrl(u)) return true; // remote links are assumed available
  if (_fileExistsCache.has(u)) return _fileExistsCache.get(u);

  const p = (async() => {
    try{
      // Most static hosts support HEAD.
      const res = await fetch(u, { method: "HEAD", cache: "no-store" });
      if (res.ok) return true;

      // Some hosts disable HEAD; fallback to a tiny GET.
      if (res.status === 405 || res.status === 403) {
        const r2 = await fetch(u, {
          method: "GET",
          headers: { Range: "bytes=0-0" },
          cache: "no-store",
        });
        return r2.ok;
      }
      return false;
    } catch(e){
      try{
        const r2 = await fetch(u, { method: "GET", cache: "no-store" });
        return r2.ok;
      } catch {}
      return false;
    }
  })();

  _fileExistsCache.set(u, p);
  return p;
}

window.FileProbe = { isExternalUrl, isLocalUrl, exists: fileExists };

// ---
// Third‑party embed helpers
// ---
// Yandex Forms recommends adding https://forms.yandex.ru/_static/embed.js alongside the iframe
// so the frame can auto-resize to content. We load it lazily (only when a Yandex form is present).
window.ensureYandexFormsEmbed = function ensureYandexFormsEmbed(){
  try{
    if (document.querySelector('script[data-ya-forms-embed]')) return;
    const s = document.createElement('script');
    s.src = 'https://forms.yandex.ru/_static/embed.js';
    s.async = true;
    s.dataset.yaFormsEmbed = '1';
    document.head.appendChild(s);
  }catch(e){}
};


async function nativeShare(payload){
  try{
    if (navigator.share) {
      await navigator.share(payload || {});
      return true;
    }
  }catch(e){
    // User can cancel share — that's fine.
    return false;
  }
  return false;
}


// Expose helpers for other modules
window.showToast = showToast;
window.copyToClipboard = copyToClipboard;
window.makeViewerUrl = makeViewerUrl;
window.nativeShare = nativeShare;


// ------------------
// Избранное / Недавние (localStorage)
// ------------------
(function(){
  const KEY_FAVS = "dmitrienok:favs:v1";
  const KEY_RECENTS = "dmitrienok:recents:v1";
  const MAX_FAVS = 200;
  const MAX_RECENTS = 40;

  function loadList(key){
    try{
      const raw = localStorage.getItem(key);
      const arr = JSON.parse(raw || "[]");
      return Array.isArray(arr) ? arr : [];
    }catch{
      return [];
    }
  }

  function saveList(key, arr){
    try{
      localStorage.setItem(key, JSON.stringify(arr || []));
    }catch{}
  }

  function emit(){
    try{ document.dispatchEvent(new CustomEvent("hubstore:changed")); }catch{}
  }

  function normalizeEntry(entry){
    if (!entry || !entry.id) return null;
    const e = {
      id: String(entry.id),
      title: String(entry.title || ""),
      href: String(entry.href || ""),
      kind: String(entry.kind || "item"), // item | post | calc | link
      meta: String(entry.meta || ""),
      ts: Number(entry.ts || Date.now()),
    };
    return e;
  }

  const HubStore = {
    getFavorites(){
      return loadList(KEY_FAVS);
    },
    isFavorite(id){
      const key = String(id || "");
      if (!key) return false;
      return loadList(KEY_FAVS).some(x => x && x.id === key);
    },
    addFavorite(entry){
      const e = normalizeEntry(entry);
      if (!e) return false;
      const list = loadList(KEY_FAVS).filter(x => x && x.id !== e.id);
      list.unshift(e);
      saveList(KEY_FAVS, list.slice(0, MAX_FAVS));
      emit();
      return true;
    },
    removeFavorite(id){
      const key = String(id || "");
      if (!key) return false;
      const list = loadList(KEY_FAVS).filter(x => x && x.id !== key);
      saveList(KEY_FAVS, list);
      emit();
      return true;
    },
    toggleFavorite(entry){
      const e = normalizeEntry(entry);
      if (!e) return false;
      if (HubStore.isFavorite(e.id)) return HubStore.removeFavorite(e.id);
      return HubStore.addFavorite(e);
    },
    getRecents(){
      return loadList(KEY_RECENTS);
    },
    addRecent(entry){
      const e = normalizeEntry(entry);
      if (!e) return false;
      const list = loadList(KEY_RECENTS).filter(x => x && x.id !== e.id);
      list.unshift(e);
      saveList(KEY_RECENTS, list.slice(0, MAX_RECENTS));
      emit();
      return true;
    },
    clearRecents(){
      saveList(KEY_RECENTS, []);
      emit();
      return true;
    }
  };

  window.HubStore = HubStore;
})();



// ------------------
// Theme toggle (dark/light)
// ------------------
function getEffectiveTheme() {
  const explicit = document.documentElement.getAttribute("data-theme");
  if (explicit === "light" || explicit === "dark") return explicit;
  try {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  } catch {
    return "dark";
  }
}

function setTheme(theme) {
  if (theme === "light" || theme === "dark") {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("theme", theme); } catch {}
  } else {
    document.documentElement.removeAttribute("data-theme");
    try { localStorage.removeItem("theme"); } catch {}
  }
  updateThemeToggle();
}

function updateThemeMeta(explicitTheme){
  const meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) return;
  const t = explicitTheme || getEffectiveTheme();
  meta.setAttribute('content', (t === 'light') ? '#f8fafc' : '#0b1020');
}

function updateThemeToggle() {
  const t = getEffectiveTheme();

  // Keep browser UI (address bar) in sync
  updateThemeMeta(t);

  const btn = document.getElementById("themeToggle");
  if (!btn) return;
  const icon = btn.querySelector("[data-theme-icon]");
  if (icon) icon.textContent = (t === "light") ? "🌙" : "☀️";

  btn.title = (t === "light") ? "Включить тёмную тему" : "Включить светлую тему";
  btn.setAttribute("aria-label", btn.title);

  try{
    document.dispatchEvent(new CustomEvent("theme:changed", { detail: { theme: t } }));
  }catch(e){}

}

function initThemeToggle() {
  // If a theme was saved, ensure it's applied.
  try {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") {
      document.documentElement.setAttribute("data-theme", saved);
    }
  } catch {}

  updateThemeToggle();

  const btn = document.getElementById("themeToggle");
  if (btn) {
    btn.addEventListener("click", () => {
      const t = getEffectiveTheme();
      setTheme(t === "light" ? "dark" : "light");
    });
  }

  // If user follows system theme (no explicit data-theme), keep icon in sync.
  try {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    mq.addEventListener?.("change", () => {
      if (!document.documentElement.getAttribute("data-theme")) updateThemeToggle();
    });
  } catch {}
}

// Expose theme helpers for other modules (command palette, Mermaid, etc.)
window.getEffectiveTheme = getEffectiveTheme;
window.setTheme = setTheme;





// ------------------
// PWA (service worker + install prompt)
// ------------------
function initPWA(){
  // Register service worker (offline cache)
  try {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => {});
      });
    }
  } catch {}

  // Install prompt (supported mostly in Chromium)
  let deferredPrompt = null;
  const btn = document.getElementById('installBtn');
  const show = () => { if (btn) btn.hidden = false; };
  const hide = () => { if (btn) btn.hidden = true; };

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar
    e.preventDefault();
    deferredPrompt = e;
    show();
  });

  if (btn) {
    btn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      try { await deferredPrompt.userChoice; } catch {}
      deferredPrompt = null;
      hide();
    });
  }

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    hide();
  });
}



// ------------------
// Mobile navigation (burger)
// ------------------
function initMobileNav() {
  const toggle = document.getElementById("navToggle");
  const nav = document.getElementById("primaryNav");
  if (!toggle || !nav) return;

  const setExpanded = (v) => toggle.setAttribute("aria-expanded", v ? "true" : "false");

  const close = () => {
    document.body.classList.remove("nav-open");
    setExpanded(false);
  };

  const open = () => {
    document.body.classList.add("nav-open");
    setExpanded(true);
  };

  const toggleMenu = () => {
    const isOpen = document.body.classList.contains("nav-open");
    if (isOpen) close();
    else open();
  };

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  // Close when clicking outside of the menu
  document.addEventListener("click", (e) => {
    if (!document.body.classList.contains("nav-open")) return;
    const t = e.target;
    if (nav.contains(t) || toggle.contains(t)) return;
    close();
  });

  // Close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  // Close after selecting any nav item (button or link)
  nav.addEventListener("click", (e) => {
    const t = e.target;
    if (t.closest(".tab-btn") || t.closest("a")) close();
  });
}


document.addEventListener("DOMContentLoaded", async () => {
  // Year in footer
  const y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear().toString();

  initThemeToggle();
  initMobileNav();
  initPWA();

  try {
    const cfg = await loadJSON("content/site.json");

    // Title + brand
    document.title = cfg?.site?.title || "dmitrienok.ru";
    setText("[data-brand]", cfg?.site?.brand || "Дмитриёнок");
    setText("[data-brand-sub]", cfg?.site?.subtitle || "Учебный хаб");
    setText("[data-tagline]", cfg?.site?.tagline || "Ясность и структура");
    setText("[data-hero-subtitle]", cfg?.site?.heroSubtitle || "");

    // Founder block
    setText("[data-founder-name]", cfg?.founder?.name || "");
    setText("[data-founder-role]", cfg?.founder?.role || "");
    if (cfg?.founder?.photo) setAttr("[data-founder-photo]", "src", cfg.founder.photo);
    // Founder badge link (clickable badge on the photo)
    if (cfg?.contact?.telegram) setAttr("[data-founder-link]", "href", cfg.contact.telegram);

    // Socials + donate
    renderLinks(document.querySelector("#socialLinks"), cfg?.socials);
    renderLinks(document.querySelector("#donateLinks"), cfg?.donate);

    // Contact shortcuts
    if (cfg?.contact?.email) setAttr("[data-contact-email]", "href", cfg.contact.email);
    if (cfg?.contact?.telegram) setAttr("[data-contact-telegram]", "href", cfg.contact.telegram);

    // Expose config globally (used by other modules)
    window.SITE_CFG = cfg;
    document.dispatchEvent(new CustomEvent("sitecfg:ready", { detail: cfg }));
  } catch (e) {
    console.warn(e);
  }
});

// ------------------------------
// Smart link recognition (no server)
// ------------------------------
// Lets you paste a link (Google/Yandex/Drive/etc.) and the hub will:
//  - infer the type
//  - auto-build an embeddable URL (if possible)
//  - keep the same UX across Materials / Schedules / Polls / Viewer
//
// IMPORTANT: This is best-effort. Some external services can block iframes
// via headers (X-Frame-Options / CSP). In that case we still provide “↗ Открыть”.
(function () {
  function isBadScheme(u) {
    return /^(javascript|data|vbscript):/i.test((u || "").toString().trim());
  }

  function safeUrl(u) {
    if (!u) return "";
    const s = u.toString().trim();
    if (!s || isBadScheme(s)) return "";
    if (s.startsWith("#")) return s;
    if (/^mailto:/i.test(s) || /^tel:/i.test(s)) return s;
    if (/^https?:\/\//i.test(s)) return s;
    // relative path inside the repo
    return encodeURI(s);
  }

  function toUrl(u) {
    if (!u) return null;
    try {
      return new URL(u, window.location.href);
    } catch {
      return null;
    }
  }

  function getSiteTheme(){
    // Prefer the shared helper from main.js (defined above this SmartLink module).
    try{
      if (typeof window.getEffectiveTheme === "function") return window.getEffectiveTheme();
    }catch(e){}
    // Fallback to system.
    try{
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    }catch(e){}
    return "dark";
  }

  function isYandexFormsUrl(inputUrl){
    const u = toUrl(inputUrl);
    if (!u) return false;
    const host = (u.hostname || "").toLowerCase();
    // forms.yandex.ru / forms.yandex.com and localized mirrors.
    return host.includes("forms.yandex");
  }

  function withYandexFormTheme(inputUrl, theme){
    const u = toUrl(inputUrl);
    if (!u) return inputUrl || "";
    // Required for iframe embedding + auto-resize script.
    u.searchParams.set("iframe", "1");
    const th = (theme || getSiteTheme() || "dark").toString();
    if (th) u.searchParams.set("theme", th);
    // Some links may have legacy _theme param — keep consistent.
    try{ u.searchParams.delete("_theme"); }catch(e){}
    return u.toString();
  }

  function getExtFromName(name) {
    const n = (name || "").toString().toLowerCase();
    const m = n.match(/\.([a-z0-9]{1,8})$/i);
    return m ? m[1] : "";
  }

  function guessFileNameFromUrl(inputUrl) {
    const u = toUrl(inputUrl);
    if (!u) return "";

    // Some services pass a filename via query
    const p = u.searchParams;
    const cand = p.get("name") || p.get("filename") || p.get("file") || p.get("title") || "";
    if (cand) return cand;

    // Fallback: last path segment
    try {
      const seg = (u.pathname || "").split("/").filter(Boolean).pop() || "";
      return decodeURIComponent(seg);
    } catch {
      return (u.pathname || "").split("/").pop() || "";
    }
  }

  function inferType(inputUrl) {
    const u = toUrl(inputUrl);
    if (!u) return "";

    const host = (u.hostname || "").toLowerCase();
    const path = (u.pathname || "").toLowerCase();

    // ------------------
    // Google
    // ------------------
    if (host === "forms.gle") return "form";

    if (host.endsWith("docs.google.com")) {
      if (path.includes("/spreadsheets/d/") || path.includes("/spreadsheets/u/")) return "google_sheet";
      if (path.includes("/document/d/") || path.includes("/document/u/")) return "google_doc";
      if (path.includes("/presentation/d/") || path.includes("/presentation/u/") || path.includes("/presentation/d/e/")) return "google_slides";
      if (path.includes("/forms/")) return "form";
      if (path.includes("/file/d/")) return "drive";
    }

    if (host.endsWith("drive.google.com")) {
      if (path.includes("/file/d/") || path.includes("/uc") || u.searchParams.get("id")) return "drive";
      if (path.includes("/drive/folders/")) return "drive_folder";
    }

    if (host.endsWith("calendar.google.com")) {
      if (path.includes("/calendar/embed")) return "google_calendar";
    }

    // ------------------
    // Forms (Fillout / Yandex)
    // ------------------
    if (host.endsWith("forms.fillout.com")) return "form";
    if (host.includes("forms.yandex")) return "form";

    // ------------------
    // Yandex (Disk / Docs / Viewer)
    // ------------------
    const isYadi = host.endsWith("yadi.sk");
    const isDisk = host.includes("disk.yandex");
    const isDocs = host.includes("docs.yandex");
    const isDocviewer = host.includes("docviewer.yandex");

    // Yandex Docs editor URLs can live under disk.yandex.* with /edit/
    if (isDocs || isDocviewer || (isDisk && path.includes("/edit/"))) {
      const name = guessFileNameFromUrl(u.href);
      const ext = getExtFromName(name) || getExtFromName((u.pathname || "").split("/").pop());
      if (["xlsx", "xls", "xlsm", "csv"].includes(ext)) return "yandex_sheet";
      return "yandex_doc";
    }

    if (isDisk || isYadi) {
      // If the public link contains a filename hint, classify it as doc/table.
      const name = guessFileNameFromUrl(u.href);
      const ext = getExtFromName(name);
      if (["xlsx", "xls", "xlsm", "csv"].includes(ext)) return "yandex_sheet";
      if (["pdf", "doc", "docx", "ppt", "pptx", "txt", "rtf", "odt", "ods"].includes(ext)) return "yandex_doc";
      return "yandex_disk";
    }

    // ------------------
    // Other common links
    // ------------------
    if (host === "t.me" || host.endsWith(".t.me")) return "telegram";
    // Code hosting links are treated as обычные ссылки (не показываем технические названия на сайте)
    if (host === "github.com" || host.endsWith(".github.com") || host === "raw.githubusercontent.com") return "link";
    if (host.includes("youtu.be") || host.includes("youtube.com")) return "video";

    // ------------------
    // File extensions
    // ------------------
    const ext = getExtFromName(path) || getExtFromName(guessFileNameFromUrl(u.href));
    if (ext === "pdf") return "pdf";
    if (ext === "csv") return "csv";
    if (["xlsx", "xls", "xlsm"].includes(ext)) return "xlsx";
    if (["md", "markdown"].includes(ext)) return "md";

    if (["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext)) return "image";
    if (["mp3", "wav", "ogg", "m4a"].includes(ext)) return "audio";
    if (["mp4", "webm", "mov"].includes(ext)) return "video_file";

    return "link";
  }

  function canonicalizeYandexDisk(inputUrl) {
    const u = toUrl(inputUrl);
    if (!u) return inputUrl || "";
    const host = (u.hostname || "").toLowerCase();
    if (host.endsWith("yadi.sk")) {
      // short links still work, but canonical host helps unify behaviour
      u.hostname = "disk.yandex.ru";
    }
    return u.toString();
  }

  function googleIdFrom(u, kind) {
    const p = u.pathname || "";
    let m = null;

    if (kind === "sheet") {
      m = p.match(/\/spreadsheets\/d\/([^\/]+)/) || p.match(/\/spreadsheets\/u\/\d+\/d\/([^\/]+)/);
    } else if (kind === "doc") {
      m = p.match(/\/document\/d\/([^\/]+)/) || p.match(/\/document\/u\/\d+\/d\/([^\/]+)/);
    } else if (kind === "slides") {
      // regular
      m = p.match(/\/presentation\/d\/([^\/]+)/) || p.match(/\/presentation\/u\/\d+\/d\/([^\/]+)/);
      // published
      if (!m) m = p.match(/\/presentation\/d\/e\/([^\/]+)/);
    } else if (kind === "form") {
      m = p.match(/\/forms\/d\/e\/([^\/]+)/) || p.match(/\/forms\/d\/([^\/]+)/);
    } else if (kind === "drive") {
      m = p.match(/\/file\/d\/([^\/]+)/);
    }

    return m ? m[1] : "";
  }

  function toEmbedUrl(inputUrl, explicitType) {
    const raw = (inputUrl || "").toString().trim();
    const u = toUrl(raw);
    if (!u) return "";

    const t = (explicitType || inferType(raw) || "link").toString().toLowerCase();

    // NOTE: for direct "open in new tab" we use toOpenUrl().
    // Here we *only* build iframe-friendly URLs.
    const host = (u.hostname || "").toLowerCase();

    // ------------------
    // Google Docs / Sheets / Slides
    // ------------------
    if (t === "google_doc") {
      // If already published, leave as is.
      if ((u.pathname || "").includes("/pub")) return u.toString();
      const id = googleIdFrom(u, "doc");
      return id ? `https://docs.google.com/document/d/${id}/preview` : u.toString();
    }

    if (t === "google_sheet") {
      // Published sheets already have embed-friendly URLs.
      if ((u.pathname || "").includes("/pubhtml") || (u.pathname || "").includes("/pub")) return u.toString();

      const id = googleIdFrom(u, "sheet");
      if (!id) return u.toString();

      // Preview mode is iframe-friendly and shows all sheets (tabs).
      const emb = new URL(`https://docs.google.com/spreadsheets/d/${id}/preview`);
      // Try to minimize Google UI chrome (best-effort).
      emb.searchParams.set("rm", "minimal");

      // Preserve a starting sheet if provided (still keeps all tabs).
      if (u.hash && u.hash.includes("gid=")) {
        emb.hash = u.hash;
      } else {
        const gid = u.searchParams.get("gid");
        if (gid) emb.hash = `gid=${gid}`;
      }
      return emb.toString();
    }

    if (t === "google_slides") {
      // If already a published embed, keep.
      if ((u.pathname || "").includes("/embed")) return u.toString();

      // published d/e
      const deId = (u.pathname || "").match(/\/presentation\/d\/e\/([^\/]+)/);
      if (deId && deId[1]) {
        const emb = new URL(`https://docs.google.com/presentation/d/e/${deId[1]}/embed`);
        if (u.search) emb.search = u.search;
        if (!emb.searchParams.has("start")) emb.searchParams.set("start", "false");
        if (!emb.searchParams.has("loop")) emb.searchParams.set("loop", "false");
        if (!emb.searchParams.has("delayms")) emb.searchParams.set("delayms", "3000");
        return emb.toString();
      }

      const id = googleIdFrom(u, "slides");
      if (!id) return u.toString();
      const emb = new URL(`https://docs.google.com/presentation/d/${id}/embed`);
      emb.searchParams.set("start", "false");
      emb.searchParams.set("loop", "false");
      emb.searchParams.set("delayms", "3000");
      return emb.toString();
    }

    if (t === "drive") {
      // Already preview?
      if ((u.pathname || "").includes("/preview")) return u.toString();

      let id = googleIdFrom(u, "drive");
      if (!id) id = u.searchParams.get("id") || "";
      return id ? `https://drive.google.com/file/d/${id}/preview` : u.toString();
    }

    if (t === "google_calendar") {
      // Only embed links are reliable.
      return u.toString();
    }

    // ------------------
    // Forms (Google / Fillout / Yandex)
    // ------------------
    if (t === "form") {
      if (host === "forms.gle") {
        // Best-effort: the short link usually redirects to the real form and keeps params.
        const emb = new URL(u.toString());
        emb.searchParams.set("embedded", "true");
        return emb.toString();
      }

      // Google Forms
      if (host.endsWith("docs.google.com")) {
        const idE = (u.pathname || "").match(/\/forms\/d\/e\/([^\/]+)/);
        const idD = (u.pathname || "").match(/\/forms\/d\/([^\/]+)/);
        if (idE && idE[1]) {
          const emb = new URL(`https://docs.google.com/forms/d/e/${idE[1]}/viewform`);
          emb.searchParams.set("embedded", "true");
          // preserve prefill params (ignore common noise)
          u.searchParams.forEach((v, k) => {
            if (["usp", "embedded"].includes(k)) return;
            emb.searchParams.set(k, v);
          });
          return emb.toString();
        }
        if (idD && idD[1]) {
          const emb = new URL(`https://docs.google.com/forms/d/${idD[1]}/viewform`);
          emb.searchParams.set("embedded", "true");
          u.searchParams.forEach((v, k) => {
            if (["usp", "embedded"].includes(k)) return;
            emb.searchParams.set(k, v);
          });
          return emb.toString();
        }

        // Unknown forms URL — still try embedded=true
        const emb = new URL(u.toString());
        emb.searchParams.set("embedded", "true");
        return emb.toString();
      }

      // Yandex Forms: add iframe=1 and a theme that matches the site.
      // Docs: https://yandex.ru/support/forms/ru/publish (theme=dark/light/...)
      if (isYandexFormsUrl(u.toString())) {
        return withYandexFormTheme(u.toString(), getSiteTheme());
      }

      // Fillout and other providers: the publish URL is usually already embeddable.
      return u.toString();
    }

    // ------------------
    // Yandex (Disk / Docs / Viewer)
    // ------------------
    if (t.startsWith("yandex")) {
      const y = toUrl(canonicalizeYandexDisk(u.toString()));
      if (!y) return u.toString();
      const yHost = (y.hostname || "").toLowerCase();

      // Docs viewer URLs: try to keep them in embedded mode.
      if (yHost.includes("docs.yandex") || yHost.includes("docviewer.yandex")) {
        if (!y.searchParams.has("nosw")) y.searchParams.set("nosw", "1");
        return y.toString();
      }

      // Disk public link: best-effort “embed=1”.
      if (yHost.includes("disk.yandex") || yHost.endsWith("yadi.sk")) {
        // Yandex editor links (/edit/...) are already "the right" UX —
        // adding embed params can break them.
        const yPath = (y.pathname || "").toLowerCase();
        if (yPath.includes("/edit/")) return y.toString();

        if (!y.searchParams.has("embed")) y.searchParams.set("embed", "1");
        if (y.searchParams.get("download") === "1") y.searchParams.delete("download");
        return y.toString();
      }

      return y.toString();
    }

    // ------------------
    // Video (YouTube)
    // ------------------
    if (t === "video") {
      if (host.includes("youtu.be")) {
        const id = (u.pathname || "").split("/").filter(Boolean)[0];
        return id ? `https://www.youtube.com/embed/${id}` : u.toString();
      }
      if (host.includes("youtube.com")) {
        const id = u.searchParams.get("v") || "";
        if (id) return `https://www.youtube.com/embed/${id}`;
        return u.toString();
      }
      return u.toString();
    }

    // Default: no conversion (PDF/CSV/XLSX already work by direct URL)
    return u.toString();
  }


  function toOpenUrl(inputUrl, explicitType){
    const raw = (inputUrl || "").toString().trim();
    const u = toUrl(raw);
    if (!u) return "";

    const t = (explicitType || inferType(raw) || "link").toString().toLowerCase();

    // Forms: when the user clicks "open source", prefer the normal (non-embedded) view.
    if (t === "form") {
      try {
        // Yandex Forms supports theming and iframe embedding via URL params.
        // For the external open page we remove those params.
        if (isYandexFormsUrl(u.toString())) {
          const y = new URL(u.toString());
          y.searchParams.delete("iframe");
          y.searchParams.delete("theme");
          y.searchParams.delete("_theme");
          return y.toString();
        }

        // Google Forms: remove the embedded=true flag, keep other prefill params.
        const host = (u.hostname || "").toLowerCase();
        if (host.endsWith("docs.google.com") && (u.pathname || "").includes("/forms/")) {
          const g = new URL(u.toString());
          g.searchParams.delete("embedded");
          return g.toString();
        }
      } catch (e) {}

      return u.toString();
    }

    // Prefer clean, canonical URLs for sharing / opening.
    if (t.startsWith("yandex")){
      const y = toUrl(canonicalizeYandexDisk(raw));
      if (!y) return u.toString();
      // Remove embed-only params for a normal open experience.
      try{
        y.searchParams.delete("embed");
        y.searchParams.delete("embedded");
      }catch{}
      return y.toString();
    }

    if (t === "google_doc"){
      const id = googleIdFrom(u, "doc");
      return id ? `https://docs.google.com/document/d/${id}/edit?usp=sharing` : u.toString();
    }

    if (t === "google_sheet"){
      const id = googleIdFrom(u, "sheet");
      if (!id) return u.toString();
      const open = new URL(`https://docs.google.com/spreadsheets/d/${id}/edit`);
      // Preserve a starting gid when present.
      if (u.hash && u.hash.includes("gid=")) open.hash = u.hash;
      else {
        const gid = u.searchParams.get("gid");
        if (gid) open.hash = `gid=${gid}`;
      }
      return open.toString();
    }

    if (t === "google_slides"){
      const id = googleIdFrom(u, "slides");
      return id ? `https://docs.google.com/presentation/d/${id}/edit?usp=sharing` : u.toString();
    }

    // Default: return as-is
    return u.toString();
  }

  function normalizeItem(item) {
    if (!item || typeof item !== "object") return item;

    const raw = (item.url || item.embedUrl || "").toString().trim();
    if (!raw) return item;

    const inferred = inferType(raw);

    // Type: fill if missing / generic
    const currentType = (item.type || "").toString().toLowerCase();
    if (!currentType || currentType === "link" || currentType === "yandex") {
      if (inferred) item.type = inferred;
    }

    // Canonicalize yadi.sk → disk.yandex.ru for consistency
    if (item.url && (item.type || inferred || "").toString().toLowerCase().startsWith("yandex")) {
      item.url = canonicalizeYandexDisk(item.url);
    }

    // embedUrl: auto-fill if missing
    if (!item.embedUrl) {
      const t = (item.type || inferred || "link").toString().toLowerCase();
      if (t && t !== "link") {
        const emb = toEmbedUrl(raw, t);
        if (emb) item.embedUrl = emb;
      }
    } else {
      // If embedUrl was provided but is a short yadi/forms link, still normalize.
      const t = (item.type || inferred || "link").toString().toLowerCase();
      if (t && t !== "link") {
        try {
          item.embedUrl = toEmbedUrl(item.embedUrl, t);
        } catch {}
      }
    }

    return item;
  }

  function typeLabel(t) {
    const key = (t || "").toString().toLowerCase();
    const map = {
      pdf: "PDF",
      csv: "CSV",
      xlsx: "Excel",
      xls: "Excel",
      xlsm: "Excel",
      md: "Пост",

      google_sheet: "Google Sheets",
      google_doc: "Google Docs",
      google_slides: "Google Slides",
      drive: "Google Drive",
      drive_folder: "Google Drive",
      google_calendar: "Google Calendar",
      form: "Форма/опрос",

      yandex_disk: "Яндекс.Диск",
      yandex_doc: "Яндекс.Документ",
      yandex_sheet: "Яндекс.Таблица",

      telegram: "Telegram",
      video: "Видео",
      video_file: "Видео",
      image: "Изображение",
      audio: "Аудио",
      link: "Ссылка",
    };
    return map[key] || (t ? t.toString().toUpperCase() : "Ссылка");
  }

  // Expose globally for all modules
  window.SmartLink = {
    safeUrl,
    inferType,
    toEmbedUrl,
    toOpenUrl,
    normalizeItem,
    typeLabel,
  };
})();

