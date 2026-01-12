/* Info / Help section
   - Loads content/info.json
   - Renders cards with helpful links
   - Adds "Quick contacts" badges (no copy buttons)
*/

async function loadJSON(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json();
}

function safeUrl(u) {
  if (!u) return "";
  if (/^https?:\/\//i.test(u) || /^mailto:/i.test(u) || /^tel:/i.test(u)) return u;
  return u; // allow in-site anchors like "#contact"
}

function flattenInfoItems(cfg){
  const sections = Array.isArray(cfg?.sections) ? cfg.sections : [];
  const out = [];
  for (const sec of sections){
    const sectionTitle = (sec?.title || "Справка").toString();
    const items = Array.isArray(sec?.items) ? sec.items : [];
    for (const it of items){
      if (!it) continue;
      const url = safeUrl(it.url || "");
      if (!url) continue;
      out.push({
        title: (it.title || "").toString(),
        description: (it.description || "").toString(),
        url,
        section: sectionTitle,
        tags: Array.isArray(it.tags) ? it.tags : [],
        type: it.type
      });
    }
  }
  return out;
}

function svgIcon(name) {
  const common = `aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="16" height="16"`;
  if (name === "send") {
    return `<svg ${common}><path fill="currentColor" d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>`;
  }
  if (name === "mail") {
    return `<svg ${common}><path fill="currentColor" d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>`;
  }
  if (name === "code") {
    return `<svg ${common}><path fill="currentColor" d="M9.4 16.6L5.8 13l3.6-3.6L8 8l-5 5 5 5 1.4-1.4zm5.2 0L18.2 13l-3.6-3.6L16 8l5 5-5 5-1.4-1.4z"/></svg>`;
  }
  // default: link
  return `<svg ${common}><path fill="currentColor" d="M3.9 12a5 5 0 0 1 5-5h3v2h-3a3 3 0 0 0 0 6h3v2h-3a5 5 0 0 1-5-5zm7-1h3v2h-3v-2zm4-4h3a5 5 0 0 1 0 10h-3v-2h3a3 3 0 0 0 0-6h-3V7z"/></svg>`;
}

function guessIcon(url, label) {
  const u = (url || "").toString().toLowerCase();
  const l = (label || "").toString().toLowerCase();

  if (u.startsWith("mailto:")) return "mail";
  if (u.includes("t.me") || u.includes("telegram") || l.includes("telegram")) return "send";
  if (u.includes("vk.com") || l === "vk" || l.includes("вк")) return "vk";
  return "link";
}

function renderQuickContacts(host, siteCfg) {
  if (!host) return;
  host.innerHTML = "";

  const cfg = siteCfg || window.SITE_CFG || {};
  const seen = new Set();
  const entries = [];

  function add(label, url) {
    const href = safeUrl(url || "");
    if (!href) return;
    const key = href.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    entries.push({ label: label || href, url: href });
  }

  // Prefer explicit contact channels
  if (cfg?.contact?.telegram) add("Telegram", cfg.contact.telegram);
  if (cfg?.contact?.email) add("Email", cfg.contact.email);

  // Add socials (channel, repo, VK, etc.)
  (cfg?.socials || []).forEach((s) => add(s?.label, s?.url));

  if (!entries.length) {
    host.innerHTML = `<div class="small">Контакты ещё не заполнены.</div>`;
    return;
  }

  entries.forEach(({ label, url }) => {
    const a = document.createElement("a");
    a.className = "badge badge-link";
    a.href = url;

    if (url && !url.startsWith("#") && !url.startsWith("mailto:") && !url.startsWith("tel:")) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }

    const iconName = guessIcon(url, label);

    const icon = document.createElement("span");
    icon.className = "badge-icon";
    if (iconName === "vk") {
      icon.textContent = "VK";
    } else {
      icon.innerHTML = svgIcon(iconName);
    }

    const txt = document.createElement("span");
    txt.textContent = label;

    a.appendChild(icon);
    a.appendChild(txt);

    host.appendChild(a);
  });
}

function renderInfo(host, cfg) {
  if (!host) return;
  host.innerHTML = "";

  const sections = Array.isArray(cfg?.sections) ? cfg.sections : [];

  if (!sections.length) {
    host.innerHTML = `<div class="notice">Пока тут пусто. Если знаешь полезную ссылку — напиши в “Обратная связь”.</div>`;
    return;
  }

  sections.forEach((sec) => {
    const card = document.createElement("div");
    card.className = "card kpi";

    const title = document.createElement("strong");
    title.textContent = sec.title || "Раздел";
    card.appendChild(title);

    if (sec.description) {
      const d = document.createElement("p");
      d.className = "small";
      d.style.marginTop = "6px";
      d.textContent = sec.description;
      card.appendChild(d);
    }

    const ul = document.createElement("ul");
    ul.className = "clean";
    ul.style.marginTop = "10px";
    ul.style.display = "grid";
    ul.style.gap = "10px";

    (sec.items || []).forEach((it) => {
      const li = document.createElement("li");
      li.style.display = "flex";
      li.style.alignItems = "flex-start";
      li.style.justifyContent = "space-between";
      li.style.gap = "12px";

      const left = document.createElement("div");
      left.style.minWidth = "0";

      const a = document.createElement("a");
      const url = safeUrl(it.url || "");
      a.href = url || "#";
      a.textContent = it.title || url || "Ссылка";
      a.style.textDecoration = "none";

      // For non-anchor links open in new tab
      if (url && !url.startsWith("#")) {
        a.target = "_blank";
        a.rel = "noopener noreferrer";
      }

      left.appendChild(a);

      if (it.description) {
        const dd = document.createElement("div");
        dd.className = "small";
        dd.textContent = it.description;
        left.appendChild(dd);
      }

      li.appendChild(left);
      ul.appendChild(li);
    });

    card.appendChild(ul);
    host.appendChild(card);
  });
}

function renderInfoCatalog(host, cfg) {
  if (!host) return;
  host.innerHTML = "";

  if (!window.Explorer || typeof window.Explorer.render !== "function") {
    host.innerHTML = `<div class="notice">Каталог временно недоступен. Попробуй обновить страницу.</div>`;
    return;
  }

  const sections = Array.isArray(cfg?.sections) ? cfg.sections : [];

  const rawItems = [];
  sections.forEach((sec) => {
    const secTitle = (sec?.title || "Раздел").toString();
    (sec?.items || []).forEach((it) => {
      const url = safeUrl(it?.url || "");
      if (!url) return;
      rawItems.push({
        ...it,
        url,
        section: secTitle,
      });
    });
  });

  if (!rawItems.length) {
    host.innerHTML = `<div class="notice">Пока тут пусто. Если знаешь полезную ссылку — напиши в “Обратная связь”.</div>`;
    return;
  }

  const items = rawItems.map((x) => {
    // Smart type recognition (Google/Yandex/etc.)
    try {
      if (window.SmartLink && typeof window.SmartLink.normalizeItem === "function") {
        return window.SmartLink.normalizeItem(x);
      }
    } catch {}
    return x;
  });

  window.Explorer.render(host, items, {
    id: "info",
    showCopy: false,
    showOutside: false,
    showTags: false,
    emptyText: "В этой папке пока пусто.",
    getPath: (it) => {
      // Prefer explicit paths when provided (useful for subfolders)
      try {
        if (typeof getExplicitPath === "function") {
          const explicit = getExplicitPath(it);
          if (explicit && explicit.length) return explicit;
        }
      } catch {}

      return [it.section || "Справка"];
    },
    getTitle: (it) => it.title || it.url || "Ссылка",
    getDescription: (it) => it.description || "",
    getId: () => "",
    getOpenUrl: (it) => safeUrl(it.url || ""),
    getSourceUrl: (it) => safeUrl(it.url || ""),
    getTags: (it) => Array.isArray(it.tags) ? it.tags : [],
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const host = document.getElementById("infoHost");
  const catalogHost = document.getElementById("infoCatalogHost");
  const quick = document.getElementById("infoQuickContacts");

  // Quick contacts are driven by site.json (no copy buttons)
  if (quick) {
    // Render immediately if config is already loaded
    if (window.SITE_CFG) renderQuickContacts(quick, window.SITE_CFG);

    // Also listen for async load from main.js
    document.addEventListener("sitecfg:ready", (ev) => {
      try {
        renderQuickContacts(quick, ev.detail);
      } catch (e) {
        console.warn(e);
      }
    });
  }

  if (!host && !catalogHost) return;

  try {
    const cfg = await loadJSON("content/info.json");

    // Provide a flat list for command palette (Ctrl+K)
    try {
      window.INFO_ITEMS = flattenInfoItems(cfg);
      document.dispatchEvent(new CustomEvent("info:loaded", { detail: window.INFO_ITEMS }));
    } catch(e){}
    if (host) renderInfo(host, cfg);
    if (catalogHost) renderInfoCatalog(catalogHost, cfg);
  } catch (e) {
    console.warn(e);
    const msg = `<div class="notice">Не получилось загрузить справку. Попробуй обновить страницу или напиши в “Обратная связь”.</div>`;
    if (host) host.innerHTML = msg;
    if (catalogHost) catalogHost.innerHTML = msg;
  }
});
