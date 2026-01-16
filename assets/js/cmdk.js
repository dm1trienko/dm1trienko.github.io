/* Command palette (Ctrl/Cmd+K)
   - Navigation across tabs
   - Smart search across Materials / Schedules / Polls / Calculators / News
   - Actions: theme toggle, reset theme, copy/share current link, open Favorites/Recents
   Статический сайт, без сервера.
*/
(function () {
  const root = document.getElementById("cmdk");
  if (!root) return;

  const input = root.querySelector("#cmdkInput");
  const list = root.querySelector("#cmdkList");
  const closeEls = root.querySelectorAll("[data-cmdk-close]");
  if (!input || !list) return;

  const NAV = [
    { id: "home", label: "Главная", icon: "🏠" },
    { id: "materials", label: "Материалы", icon: "📚" },
    { id: "schedules", label: "Расписания", icon: "🗓" },
    { id: "calculator", label: "Калькулятор", icon: "🧮" },
    { id: "news", label: "Новости", icon: "📣" },
    { id: "polls", label: "Опросы", icon: "📝" },
    { id: "community", label: "Команда", icon: "👥" },
    { id: "info", label: "Справка", icon: "ℹ️" },
    { id: "contact", label: "Обратная связь", icon: "✉️" },
    { id: "donate", label: "Донат", icon: "💛" },
  ];

  let isOpen = false;
  let lastFocus = null;
  let results = [];
  let selected = 0;

  // ---------------------------
  // Smart search helpers (typo tolerant)
  // ---------------------------
  function normalizeText(s) {
    return (s || "")
      .toString()
      .toLowerCase()
      .replace(/ё/g, "е")
      .replace(/c\+\+/g, "cpp")
      .replace(/\s+/g, " ")
      .trim();
  }

  function formatNewsDate(date) {
    if (window.NewsMeta && typeof window.NewsMeta.formatDateDisplay === "function") {
      return window.NewsMeta.formatDateDisplay(date);
    }
    return date || "";
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

  function scoreDoc(doc, q) {
    if (!q.qNorm) return 0;

    const hay = doc._hay || "";
    const title = doc._title || "";

    let score = 0;
    if (title.includes(q.qNorm)) score = Math.max(score, 1.6);
    if (hay.includes(q.qNorm)) score = Math.max(score, 1.2);

    if (q.qCompact.length < 3) return score;

    if (q.qTokens.length && q.qTokens.every((t) => hay.includes(t))) score = Math.max(score, 0.9);

    score += dice(q.qGrams, doc._grams) * 0.9 + dice(q.qGrams, doc._titleGrams) * 0.7;
    return score;
  }

  // ---------------------------
  // Build searchable docs from hub data
  // ---------------------------
  const INDEX = {
    commands: [],
    resources: [],
    schedules: [],
    polls: [],
    calculators: [],
    news: [],
    favorites: [],
    recents: [],
  };

  function typeLabel(t) {
    try {
      if (window.SmartLink && typeof window.SmartLink.typeLabel === "function") return window.SmartLink.typeLabel(t);
    } catch {}
    return (t || "").toString();
  }

  function docBase({ title, subtitle, icon, run, keywords }) {
    const hay = normalizeText([title, subtitle, ...(keywords || [])].filter(Boolean).join(" "));
    const t = normalizeText(title || "");
    return {
      title,
      subtitle,
      icon: icon || "",
      run,
      _hay: hay,
      _title: t,
      _grams: buildTrigramSet(tokenize(hay)),
      _titleGrams: buildTrigramSet(tokenize(t)),
    };
  }

  function navTo(tabId) {
    // On index.html we can switch tabs instantly.
    const hasTabs = typeof window.showTab === "function" && document.querySelector('[data-tabs="main"]');
    if (hasTabs) {
      window.showTab("main", tabId);
      return;
    }
    // From viewer/post pages — go to index with hash.
    window.location.href = `index.html#${encodeURIComponent(tabId)}`;
  }

  function buildCommands() {
    const out = [];

    // Navigation
    NAV.forEach((t) => {
      out.push(
        docBase({
          title: `${t.icon} ${t.label}`,
          subtitle: "Перейти в раздел",
          icon: t.icon,
          keywords: [t.id, t.label, "раздел", "вкладка", "таб"],
          run: () => navTo(t.id),
        })
      );
    });

    // Actions
    out.push(
      docBase({
        title: "🌓 Сменить тему",
        subtitle: "Светлая ↔ тёмная",
        icon: "🌓",
        keywords: ["тема", "theme", "dark", "light"],
        run: () => {
          const btn = document.getElementById("themeToggle");
          if (btn) btn.click();
        },
      })
    );

    out.push(
      docBase({
        title: "💻 Тема как в системе",
        subtitle: "Сбросить ручной выбор темы",
        icon: "💻",
        keywords: ["система", "auto", "system", "reset"],
        run: () => {
          try {
            localStorage.removeItem("theme");
          } catch {}
          document.documentElement.removeAttribute("data-theme");
          if (typeof window.showToast === "function") window.showToast("Тема: как в системе");
          try {
            const t = typeof window.getEffectiveTheme === "function" ? window.getEffectiveTheme() : "";
            document.dispatchEvent(new CustomEvent("theme:changed", { detail: { theme: t } }));
          } catch {}
        },
      })
    );

    out.push(
      docBase({
        title: "🔗 Скопировать ссылку на страницу",
        subtitle: "Поделиться текущей страницей",
        icon: "🔗",
        keywords: ["копировать", "ссылка", "share", "url"],
        run: async () => {
          const url = window.location.href;
          if (typeof window.copyToClipboard === "function") {
            await window.copyToClipboard(url);
          } else {
            try {
              await navigator.clipboard.writeText(url);
            } catch {}
          }
        },
      })
    );

    out.push(
      docBase({
        title: "📤 Поделиться…",
        subtitle: "Нативное меню “Поделиться” (если поддерживается)",
        icon: "📤",
        keywords: ["поделиться", "share", "отправить"],
        run: async () => {
          const url = window.location.href;
          const title = document.title || "dmitrienok.ru";
          if (typeof window.nativeShare === "function") {
            const ok = await window.nativeShare({ title, url });
            if (ok) return;
          }
          if (typeof window.copyToClipboard === "function") await window.copyToClipboard(url);
        },
      })
    );

    out.push(
      docBase({
        title: "⭐ Открыть избранное",
        subtitle: "Список сохранённых материалов и ссылок",
        icon: "⭐",
        keywords: ["избранное", "favorites", "favs"],
        run: () => {
          navTo("home");
          // Optional scroll to section on index page
          try {
            document.getElementById("homeFavs")?.scrollIntoView({ behavior: "smooth", block: "start" });
          } catch {}
        },
      })
    );

    out.push(
      docBase({
        title: "🕒 Открыть недавние",
        subtitle: "То, что открывал(а) недавно",
        icon: "🕒",
        keywords: ["недавние", "recent", "history"],
        run: () => {
          navTo("home");
          try {
            document.getElementById("homeRecents")?.scrollIntoView({ behavior: "smooth", block: "start" });
          } catch {}
        },
      })
    );

    return out;
  }

  function buildDataDocs() {
    const docs = [];

    // Materials (viewer.html?id=...)
    const res = window.RESOURCES || [];
    res.forEach((r) => {
      if (!r || !r.id) return;
      const meta = [r.semester, r.subject, r.kind, typeLabel(r.type)].filter(Boolean).join(" • ");
      const subtitle = meta || "Материал";
      const url = `viewer.html?id=${encodeURIComponent(r.id)}`;
      docs.push(
        docBase({
          title: r.title || "Без названия",
          subtitle: `📚 ${subtitle}`,
          icon: "📚",
          keywords: [r.description, ...(r.tags || []), r.category],
          run: () => (window.location.href = url),
        })
      );
    });

    // Schedules
    const sch = window.SCHEDULES || [];
    sch.forEach((s) => {
      if (!s || !s.id) return;
      const meta = [s.semester, s.subject, s.kind, typeLabel(s.type)].filter(Boolean).join(" • ");
      const subtitle = meta || "Расписание";
      const url = `viewer.html?id=${encodeURIComponent(s.id)}`;
      docs.push(
        docBase({
          title: s.title || "Без названия",
          subtitle: `🗓 ${subtitle}`,
          icon: "🗓",
          keywords: [s.description, ...(s.tags || []), s.category],
          run: () => (window.location.href = url),
        })
      );
    });

    // Polls
    const polls = window.POLLS || [];
    polls.forEach((p) => {
      if (!p || !p.id) return;
      const meta = [p.semester, p.subject, p.category].filter(Boolean).join(" • ");
      const subtitle = meta || "Опрос";
      const url = `viewer.html?id=${encodeURIComponent(p.id)}`;
      docs.push(
        docBase({
          title: p.title || "Без названия",
          subtitle: `📝 ${subtitle}`,
          icon: "📝",
          keywords: [p.description, ...(p.tags || [])],
          run: () => (window.location.href = url),
        })
      );
    });

    // Calculators (deep link on index)
    const calcs = window.CALCULATORS || [];
    calcs.forEach((c) => {
      if (!c || !c.id) return;
      const meta = [c.semester, c.subject, c.kind].filter(Boolean).join(" • ");
      const subtitle = meta || "Калькулятор";
      const url = `index.html?calc=${encodeURIComponent(c.id)}#calculator`;
      docs.push(
        docBase({
          title: c.title || "Калькулятор",
          subtitle: `🧮 ${subtitle}`,
          icon: "🧮",
          keywords: [...(c.tags || [])],
          run: () => (window.location.href = url),
        })
      );
    });

    // Reference info (help)
    const infoItems = window.INFO_ITEMS || [];
    infoItems.forEach((it) => {
      if (!it) return;
      const url = safeUrl(it.url || "");
      if (!url) return;
      const meta = [it.section].filter(Boolean).join(" • ");
      const subtitle = meta || "Справка";
      docs.push(
        docBase({
          title: it.title || "Справка",
          subtitle: `ℹ️ ${subtitle}`,
          icon: "ℹ️",
          keywords: [it.description, it.section].filter(Boolean),
          run: () => {
            if (isExternalUrl(url)) window.open(url, "_blank", "noopener,noreferrer");
            else window.location.href = url;
          },
        })
      );
    });

    // News posts
    const news = window.NEWS || [];
    news.forEach((n) => {
      if (!n || !n.id) return;
      const dateText = n.dateDisplay || formatNewsDate(n.date);
      const tags = Array.isArray(n.tags) ? n.tags : (n.tags ? [String(n.tags)] : []);
      const meta = [dateText, ...tags].filter(Boolean).join(" • ");
      const url = `post.html?id=${encodeURIComponent(n.id)}`;
      docs.push(
        docBase({
          title: n.title || "Пост",
          subtitle: `📣 ${meta || "Новости"}`,
          icon: "📣",
          keywords: [n.excerpt, ...tags],
          run: () => (window.location.href = url),
        })
      );
    });

    return docs;
  }

  function buildFavDocs() {
    const favs = (window.HubStore && typeof window.HubStore.getFavorites === "function") ? window.HubStore.getFavorites() : [];
    const docs = [];
    favs.forEach((f) => {
      if (!f || !f.href) return;
      docs.push(
        docBase({
          title: f.title || "Избранное",
          subtitle: `⭐ ${f.meta || ""}`.trim(),
          icon: "⭐",
          keywords: [f.meta, f.kind],
          run: () => (window.location.href = f.href),
        })
      );
    });
    return docs;
  }

  function buildRecentDocs() {
    const rec = (window.HubStore && typeof window.HubStore.getRecents === "function") ? window.HubStore.getRecents() : [];
    const docs = [];
    rec.forEach((r) => {
      if (!r || !r.href) return;
      docs.push(
        docBase({
          title: r.title || "Недавнее",
          subtitle: `🕒 ${r.meta || ""}`.trim(),
          icon: "🕒",
          keywords: [r.meta, r.kind],
          run: () => (window.location.href = r.href),
        })
      );
    });
    return docs;
  }

  
  // On viewer/post pages the catalogs may not be loaded (resources.js is not included there).
  // Load basic catalogs lazily so search works everywhere.
  let catalogsLoading = null;

  async function ensureCatalogs(){
    try{
      const needResources = !(Array.isArray(window.RESOURCES) && window.RESOURCES.length);
      const needSchedules = !(Array.isArray(window.SCHEDULES) && window.SCHEDULES.length);
      const needPolls = !(Array.isArray(window.POLLS) && window.POLLS.length);
      const needNews = !(Array.isArray(window.NEWS) && window.NEWS.length);
      const needCalcs = !(Array.isArray(window.CALCULATORS) && window.CALCULATORS.length);
      const needInfo = !(Array.isArray(window.INFO_ITEMS) && window.INFO_ITEMS.length);

      if (!(needResources || needSchedules || needPolls || needNews || needCalcs || needInfo)) return;
      if (catalogsLoading) return catalogsLoading;

      catalogsLoading = Promise.all([
        needResources
          ? fetch("content/resources.json", { cache: "no-store" }).then(r => r.json()).then(d => {
              window.RESOURCES = Array.isArray(d) ? d : (d.items || []);
              try{ document.dispatchEvent(new CustomEvent("resources:loaded", { detail: window.RESOURCES })); }catch(e){}
            }).catch(() => {})
          : Promise.resolve(),

        needSchedules
          ? fetch("content/schedules.json", { cache: "no-store" }).then(r => r.json()).then(d => {
              window.SCHEDULES = Array.isArray(d) ? d : (d.items || []);
              try{ document.dispatchEvent(new CustomEvent("schedules:loaded", { detail: window.SCHEDULES })); }catch(e){}
            }).catch(() => {})
          : Promise.resolve(),

        needPolls
          ? fetch("content/polls.json", { cache: "no-store" }).then(r => r.json()).then(d => {
              window.POLLS = Array.isArray(d) ? d : (d.items || []);
              try{ document.dispatchEvent(new CustomEvent("polls:loaded", { detail: window.POLLS })); }catch(e){}
            }).catch(() => {})
          : Promise.resolve(),

        needCalcs
          ? fetch("content/calculators/index.json", { cache: "no-store" }).then(r => r.json()).then(d => {
              const arr = Array.isArray(d) ? d : (d.items || d.calculators || []);
              window.CALCULATORS = arr;
              try{ document.dispatchEvent(new CustomEvent("calculators:loaded", { detail: window.CALCULATORS })); }catch(e){}
            }).catch(() => {})
          : Promise.resolve(),

        needNews
          ? fetch("content/news.json", { cache: "no-store" }).then(r => r.json()).then(async (d) => {
              const arr = Array.isArray(d) ? d : (d.items || []);
              if (window.NewsMeta && typeof window.NewsMeta.hydratePosts === "function") {
                try {
                  window.NEWS = await window.NewsMeta.hydratePosts(arr);
                } catch (e) {
                  window.NEWS = arr;
                }
              } else {
                window.NEWS = arr;
              }
              try{ document.dispatchEvent(new CustomEvent("news:loaded", { detail: window.NEWS })); }catch(e){}
            }).catch(() => {})
          : Promise.resolve(),

        needInfo
          ? fetch("content/info.json", { cache: "no-store" }).then(r => r.json()).then(d => {
              const secs = Array.isArray(d?.sections) ? d.sections : [];
              const items = [];
              for (const sec of secs){
                const section = (sec?.title || "").toString();
                const arr = Array.isArray(sec?.items) ? sec.items : [];
                for (const it of arr){
                  const url = safeUrl(it?.url || "");
                  if (!url) continue;
                  items.push({
                    title: (it?.title || "").toString(),
                    description: (it?.description || "").toString(),
                    url,
                    section,
                  });
                }
              }
              window.INFO_ITEMS = items;
              try{ document.dispatchEvent(new CustomEvent("info:loaded", { detail: window.INFO_ITEMS })); }catch(e){}
            }).catch(() => {})
          : Promise.resolve(),
      ]).finally(() => {
        catalogsLoading = null;
        rebuildIndex();
        if (isOpen) update();
      });

      return catalogsLoading;
    }catch(e){
      catalogsLoading = null;
    }
  }

function rebuildIndex() {
    INDEX.commands = buildCommands();
    INDEX.favorites = buildFavDocs();
    INDEX.recents = buildRecentDocs();

    // Data docs can be large; rebuild only if data exists
    INDEX.resources = []; INDEX.schedules = []; INDEX.polls = []; INDEX.calculators = []; INDEX.news = [];
    INDEX.data = buildDataDocs();
  }

  // Keep palette in sync with localStorage changes
  document.addEventListener("hubstore:changed", () => {
    if (!isOpen) return;
    rebuildIndex();
    update();
  });

  // Many modules load async — rebuild on their load events
  const listen = (ev) => document.addEventListener(ev, () => { rebuildIndex(); if (isOpen) update(); });
  ["resources:loaded", "schedules:loaded", "polls:loaded", "calculators:loaded", "news:loaded", "info:loaded"].forEach(listen);

  // First build (may be empty, that's ok)
  rebuildIndex();

  // ---------------------------
  // UI
  // ---------------------------
  function open(prefill = "") {
    if (isOpen) return;
    isOpen = true;
    lastFocus = document.activeElement;
    root.hidden = false;
    root.classList.add("open");
    document.body.classList.add("cmdk-open");

    input.value = prefill;
    ensureCatalogs();
    selected = 0;
    update();

    setTimeout(() => input.focus(), 0);
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    root.classList.remove("open");
    root.hidden = true;
    document.body.classList.remove("cmdk-open");

    if (lastFocus && typeof lastFocus.focus === "function") {
      try { lastFocus.focus(); } catch {}
    }
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function setSelected(i) {
    selected = clamp(i, 0, Math.max(0, results.length - 1));
    const els = list.querySelectorAll(".cmdk-item");
    els.forEach((el, idx) => {
      const on = idx === selected;
      el.setAttribute("aria-selected", on ? "true" : "false");
      if (on) {
        try { el.scrollIntoView({ block: "nearest" }); } catch {}
      }
    });
  }

  function render() {
    list.innerHTML = "";
    if (!results.length) {
      list.innerHTML = `<div class="small" style="padding:10px 6px;">Ничего не найдено.</div>`;
      return;
    }

    results.forEach((r, idx) => {
      const el = document.createElement("div");
      el.className = "cmdk-item";
      el.setAttribute("role", "option");
      el.setAttribute("aria-selected", idx === selected ? "true" : "false");
      el.dataset.idx = String(idx);

      const left = document.createElement("div");
      left.className = "cmdk-item-left";

      const t = document.createElement("div");
      t.className = "cmdk-item-title";
      t.textContent = r.title || "";

      const s = document.createElement("div");
      s.className = "cmdk-item-sub";
      s.textContent = r.subtitle || "";

      left.appendChild(t);
      if (r.subtitle) left.appendChild(s);

      const icon = document.createElement("div");
      icon.className = "cmdk-item-icon";
      icon.textContent = r.icon || "";

      el.appendChild(icon);
      el.appendChild(left);

      list.appendChild(el);
    });
  }

  function defaultResults() {
    // When query empty: show navigation + a few favorites/recents.
    const out = [];

    // Navigation (first)
    out.push(...INDEX.commands.slice(0, NAV.length));

    // Favorites + recents (small preview)
    const favs = INDEX.favorites.slice(0, 6);
    const recs = INDEX.recents.slice(0, 6);

    if (favs.length) out.push(...favs);
    if (recs.length) out.push(...recs);

    // Remaining commands (actions)
    out.push(...INDEX.commands.slice(NAV.length));

    return out;
  }

  function searchResults(qRaw) {
    const q = buildQuery(qRaw);

    // Combine: commands + data + favs/recents
    const pool = [
      ...INDEX.commands,
      ...(INDEX.data || []),
      ...INDEX.favorites,
      ...INDEX.recents,
    ];

    const scored = [];
    for (const doc of pool) {
      const sc = scoreDoc(doc, q);
      if (sc >= q.threshold) scored.push({ doc, sc });
    }

    scored.sort((a, b) => b.sc - a.sc);
    return scored.slice(0, 22).map((x) => x.doc);
  }

  function update() {
    ensureCatalogs();
    const q = input.value || "";
    const qTrim = q.trim();

    results = qTrim ? searchResults(qTrim) : defaultResults();
    selected = 0;
    render();
    setSelected(0);
  }

  function activate() {
    const r = results[selected];
    if (!r || typeof r.run !== "function") return;
    close();
    try { r.run(); } catch (e) { console.warn(e); }
  }

  // ---------------------------
  // Events
  // ---------------------------
  closeEls.forEach((el) => el.addEventListener("click", close));

  root.addEventListener("click", (e) => {
    const t = e.target;
    if (t && t.hasAttribute("data-cmdk-close")) close();
  });

  list.addEventListener("click", (e) => {
    const t = e.target;
    const it = t.closest(".cmdk-item");
    if (!it) return;
    const idx = parseInt(it.dataset.idx || "0", 10);
    if (!Number.isNaN(idx)) {
      setSelected(idx);
      activate();
    }
  });

  input.addEventListener("input", () => {
    update();
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected(selected + 1);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected(selected - 1);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      activate();
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
  });

  function isTypingTarget(el) {
    const tag = (el?.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select") return true;
    if (el?.isContentEditable) return true;
    return false;
  }

  document.addEventListener("keydown", (e) => {
    // Ctrl/Cmd+K opens palette
    const isK = (e.key || "").toLowerCase() === "k";
    const mod = e.ctrlKey || e.metaKey;

    if (mod && isK) {
      e.preventDefault();
      if (isOpen) close();
      else open("");
      return;
    }

    // "/" opens palette (but not while typing)
    if (!mod && e.key === "/" && !isOpen && !isTypingTarget(e.target)) {
      e.preventDefault();
      open("");
      return;
    }

    // Esc closes palette
    if (isOpen && e.key === "Escape") {
      e.preventDefault();
      close();
    }
  });

  // Expose helpers for other scripts (shortcuts.js fallback, etc.)
  window.cmdkOpen = open;
  window.cmdkClose = close;
})();
