(() => {
// Home page helpers: quick search + quick links

function normalizeHomeQuery(s){
  return (s || "").toString().trim();
}

function initHomeSearch(){
  const qInput = document.getElementById("homeSearchQ");
  const btn = document.getElementById("homeSearchBtn");
  if (!qInput || !btn) return;

  const run = () => {
    const q = normalizeHomeQuery(qInput.value);
    if (!q) return;

    // Open Materials → Search
    if (window.showTab) {
      window.showTab('main', 'materials');
      window.showTab('materials', 'search');
    }

    const apply = () => {
      if (typeof window.setResourceFilters === 'function') {
        window.setResourceFilters({ q });
        return;
      }
      // Fallback: directly set input value
      const searchEl = document.getElementById('searchQ');
      if (searchEl) {
        searchEl.value = q;
        searchEl.dispatchEvent(new Event('input', { bubbles: true }));
      }
    };

    // Let other modules init first
    setTimeout(apply, 0);
  };

  btn.addEventListener('click', run);
  qInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      run();
    }
  });
}

function renderHomeQuickLinks(cfg){
  const host = document.getElementById('homeQuickLinks');
  if (!host) return;

  host.innerHTML = "";

  const addBtn = (label, tabId, { ghost = true } = {}) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = ghost ? 'button ghost' : 'button';
    b.textContent = label;
    b.addEventListener('click', () => {
      if (window.showTab) window.showTab('main', tabId);
    });
    host.appendChild(b);
  };

  addBtn('Материалы', 'materials', { ghost: false });
  addBtn('Расписания', 'schedules');
  addBtn('Калькулятор', 'calculator');
  addBtn('Новости', 'news');
  addBtn('Опросы', 'polls');
  addBtn('Команда', 'community');
  addBtn('Контакты', 'contact');
  addBtn('Донат', 'donate');

  // Add socials (if present)
  (cfg?.socials || []).forEach(l => {
    if (!l?.url) return;
    const a = document.createElement('a');
    a.className = 'button ghost';
    a.href = l.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = l.label || 'Ссылка';
    host.appendChild(a);
  });
}



// ------------------
// Home: collections / top categories
// ------------------
function semesterKey(s){
  const m = (s || "").toString().match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 9999;
}

function normalizeTextLite(s){
  return (s || "").toString().toLowerCase().replace(/ё/g, "е");
}

function renderHomeCollections(resources){
  const host = document.getElementById("homeCollections");
  if (!host) return;

  const items = Array.isArray(resources) ? resources : [];
  const hayOf = (it) => normalizeTextLite([it.title, it.description, it.semester, it.subject, ...(it.tags || [])].filter(Boolean).join(" "));

  const collections = [
    {
      key: "sem1",
      label: "1 семестр",
      count: items.filter((it) => semesterKey(it.semester) === 1).length,
      filters: { semester: "1 семестр", q: "" },
    },
    {
      key: "tickets",
      label: "Билеты",
      count: items.filter((it) => hayOf(it).includes("билет")).length,
      filters: { q: "билет" },
    },
    {
      key: "notes",
      label: "Конспекты",
      count: items.filter((it) => hayOf(it).includes("конспект")).length,
      filters: { q: "конспект" },
    },
    {
      key: "tables",
      label: "Таблицы",
      count: items.filter((it) => hayOf(it).includes("таблиц")).length,
      filters: { q: "таблица" },
    },
  ];

  host.innerHTML = "";
  collections.forEach((c) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "pill-btn";
    const n = (typeof c.count === "number" && c.count > 0) ? ` · ${c.count}` : "";
    b.textContent = `${c.label}${n}`;
    b.addEventListener("click", () => {
      if (window.showTab) {
        window.showTab("main", "materials");
        window.showTab("materials", "search");
      }
      // Apply filters (no server)
      const apply = () => {
        if (typeof window.setResourceFilters === "function") {
          window.setResourceFilters(c.filters || {});
        } else {
          const q = document.getElementById("searchQ");
          if (q && c.filters?.q) {
            q.value = c.filters.q;
            q.dispatchEvent(new Event("input", { bubbles: true }));
          }
        }
      };
      setTimeout(apply, 0);
    });
    host.appendChild(b);
  });
}



// ------------------
// Home: Favorites / Recents (localStorage)
// ------------------
function renderMiniList(host, entries, { emptyText = "Пока пусто." } = {}){
  if (!host) return;
  host.innerHTML = "";

  const arr = Array.isArray(entries) ? entries : [];
  if (!arr.length){
    const d = document.createElement("div");
    d.className = "small";
    d.textContent = emptyText;
    host.appendChild(d);
    return;
  }

  arr.slice(0, 6).forEach((e, idx) => {
    const row = document.createElement("div");
    row.className = "item";

    const left = document.createElement("div");
    left.className = "item-left";

    const h = document.createElement("h3");
    h.className = "item-title";

    const a = document.createElement("a");
    a.href = e.href || "#";
    a.textContent = e.title || "Без названия";
    h.appendChild(a);

    const meta = document.createElement("p");
    meta.className = "item-meta";
    meta.textContent = e.meta || "";

    left.appendChild(h);
    if (e.meta) left.appendChild(meta);

    row.appendChild(left);
    host.appendChild(row);

    if (idx !== Math.min(arr.length, 6) - 1){
      const hr = document.createElement("hr");
      hr.className = "sep";
      host.appendChild(hr);
    }
  });
}

function renderHomeFavsRecents(){
  const favHost = document.getElementById("homeFavs");
  const recHost = document.getElementById("homeRecents");
  const clearBtn = document.getElementById("homeClearRecents");

  const store = window.HubStore;

  if (!store){
    renderMiniList(favHost, [], { emptyText: "Избранное появится здесь." });
    renderMiniList(recHost, [], { emptyText: "Недавние появятся здесь." });
    if (clearBtn) clearBtn.disabled = true;
    return;
  }

  const favs = (typeof store.getFavorites === "function") ? store.getFavorites() : [];
  const recs = (typeof store.getRecents === "function") ? store.getRecents() : [];

  renderMiniList(favHost, favs, { emptyText: "Пока пусто. Открой материал и нажми ★." });
  renderMiniList(recHost, recs, { emptyText: "Пока пусто. Начни открывать материалы." });

  if (clearBtn){
    clearBtn.disabled = !recs.length;
    clearBtn.onclick = () => {
      store.clearRecents?.();
      renderHomeFavsRecents();
      try { window.showToast?.("Недавние очищены"); } catch {}
    };
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initHomeSearch();
  renderHomeFavsRecents();

  if (window.SITE_CFG) renderHomeQuickLinks(window.SITE_CFG);
  document.addEventListener('sitecfg:ready', (ev) => {
    renderHomeQuickLinks(ev.detail);
  });

  // Collections need materials index (resources.json)
  if (window.RESOURCES) renderHomeCollections(window.RESOURCES);
  document.addEventListener('resources:loaded', (ev) => {
    renderHomeCollections(ev.detail || window.RESOURCES || []);
  });

  document.addEventListener('hubstore:changed', () => {
    renderHomeFavsRecents();
  });
});
})();
