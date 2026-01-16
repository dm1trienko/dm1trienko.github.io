(() => {
/* Calculator catalog (БРС)
   - Catalog with cards + tags + filters
   - Compute result + highlight in table
   - Shareable link: index.html?calc=<id>#calculator
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

function semesterSortKey(s) {
  const m = (s || "").toString().match(/(\d+)/);
  if (m) return parseInt(m[1], 10);
  return 9999;
}

function fmtDelta(n) {
  const v = Number(n);
  if (Number.isNaN(v)) return "—";
  if (v > 0) return `+${v}`;
  return `${v}`;
}

function clamp(num, min, max) {
  return Math.min(max, Math.max(min, num));
}

function renderCalcTable(host, calc) {
  if (!host) return;
  host.innerHTML = "";
  if (!calc) return;

  const table = document.createElement("table");
  table.className = "table calc-table";

  const thead = document.createElement("thead");
  const trh = document.createElement("tr");

  const th0 = document.createElement("th");
  th0.textContent = "Баллы БРС (до устного)";
  trh.appendChild(th0);

  const oralGrades = Array.isArray(calc.oralGrades) && calc.oralGrades.length ? calc.oralGrades : [10, 9, 8, 7, 6, 5, 4, 3];
  oralGrades.forEach((g, idx) => {
    const th = document.createElement("th");
    th.textContent = String(g);
    th.dataset.c = String(idx);
    th.dataset.role = "col";
    trh.appendChild(th);
  });

  thead.appendChild(trh);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  (calc.rows || []).forEach((row, rIdx) => {
    const tr = document.createElement("tr");

    const th = document.createElement("th");
    th.textContent = row.label || `${row.min}–${row.max}`;
    th.dataset.r = String(rIdx);
    th.dataset.role = "row";
    tr.appendChild(th);

    (row.delta || []).forEach((d, cIdx) => {
      const td = document.createElement("td");
      td.textContent = fmtDelta(d);
      td.dataset.r = String(rIdx);
      td.dataset.c = String(cIdx);

      const v = Number(d);
      if (!Number.isNaN(v)) {
        if (v > 0) td.classList.add("pos");
        if (v < 0) td.classList.add("neg");
      }

      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  host.appendChild(table);
}

function clearHighlights(host) {
  if (!host) return;
  host.querySelectorAll(".hl").forEach((el) => el.classList.remove("hl"));
}

function setHighlights(host, rowIdx, colIdx) {
  if (!host) return;
  clearHighlights(host);

  const cell = host.querySelector(`[data-r="${rowIdx}"][data-c="${colIdx}"]`);
  if (cell) cell.classList.add("hl");

  const colHead = host.querySelector(`th[data-role="col"][data-c="${colIdx}"]`);
  if (colHead) colHead.classList.add("hl");

  const rowHead = host.querySelector(`th[data-role="row"][data-r="${rowIdx}"]`);
  if (rowHead) rowHead.classList.add("hl");
}

function findRow(calc, brs) {
  const pts = Number(brs);
  if (Number.isNaN(pts)) return { row: null, idx: -1 };

  const rows = calc?.rows || [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const min = Number(r.min);
    const max = Number(r.max);
    if (!Number.isNaN(min) && !Number.isNaN(max) && pts >= min && pts <= max) {
      return { row: r, idx: i };
    }
  }
  return { row: null, idx: -1 };
}

function buildSearchIndex(calcs) {
  calcs.forEach((c) => {
    const tags = [c.semester, c.subject, c.kind].filter(Boolean);
    c._tags = tags;

    const hay = normalizeText([c.title, ...tags, ...(c.tags || [])].filter(Boolean).join(" "));
    const title = normalizeText(c.title || "");

    c._hay = hay;
    c._title = title;
    c._grams = buildTrigramSet(tokenize(hay));
    c._titleGrams = buildTrigramSet(tokenize(title));
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

function scoreCalc(c, q) {
  if (!q.qNorm) return 0;

  const hay = c._hay || "";
  const title = c._title || "";

  let score = 0;
  if (title.includes(q.qNorm)) score = Math.max(score, 1.6);
  if (hay.includes(q.qNorm)) score = Math.max(score, 1.2);

  if (q.qCompact.length < 3) return score;

  if (q.qTokens.length && q.qTokens.every((t) => hay.includes(t))) score = Math.max(score, 0.9);

  score += dice(q.qGrams, c._grams) * 0.9 + dice(q.qGrams, c._titleGrams) * 0.7;
  return score;
}

function fillSelect(sel, values, labelAll) {
  if (!sel) return;
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

function makeCalcShareUrl(calcId) {
  const u = new URL(window.location.href);
  u.searchParams.set("calc", calcId);
  u.hash = "#calculator";
  return u.toString();
}

document.addEventListener("DOMContentLoaded", async () => {
  // Only run if calculator catalog exists on this page
  const catalogHost = document.getElementById("calcCatalogList");
  if (!catalogHost) return;

  const qEl = document.getElementById("calcQ");
  const semSel = document.getElementById("calcFilterSemester");
  const subSel = document.getElementById("calcFilterSubject");
  const kindSel = document.getElementById("calcFilterKind");
  const resetFilters = document.getElementById("calcFilterReset");

  const brsInput = document.getElementById("calcBRS");
  const oralSel = document.getElementById("calcOral");
  const btn = document.getElementById("calcCompute");
  const reset = document.getElementById("calcReset");
  const copyBtn = document.getElementById("calcCopyLink");
  const resEl = document.getElementById("calcResult");
  const tableHost = document.getElementById("calcTableHost");
  const activeTitle = document.getElementById("calcActiveTitle");
  const activeMeta = document.getElementById("calcActiveMeta");

  if (!qEl || !semSel || !subSel || !kindSel || !resetFilters || !brsInput || !oralSel || !btn || !reset || !resEl || !tableHost || !activeTitle || !activeMeta) {
    return;
  }

  let calculators = [];
  let active = null;
  const calcCache = new Map();
  let activeLoading = false;

  async function resolveCalc(meta){
    if (!meta) return null;
    const id = (meta.id || "").toString();
    if (id && calcCache.has(id)) return calcCache.get(id);

    // By design, each calculator lives in its own JSON file.
    // Index entries can provide `file`, otherwise we fall back to a conventional path.
    const filePath = (meta.file || (id ? `content/calculators/${id}.json` : ""))?.toString();
    let full = null;
    if (filePath) {
      try {
        full = await loadJSON(filePath);
      } catch (e) {
        console.warn(e);
        full = null;
      }
    }

    const merged = { ...meta, ...(full || {}) };
    if (id) merged.id = id;
    if (!merged.type) merged.type = "calc";
    if (id) calcCache.set(id, merged);
    return merged;
  }

  function renderOralOptions(calc) {
    const oralGrades = Array.isArray(calc?.oralGrades) && calc.oralGrades.length ? calc.oralGrades : [10, 9, 8, 7, 6, 5, 4, 3];
    oralSel.innerHTML = "";
    oralGrades.forEach((g) => {
      const o = document.createElement("option");
      o.value = String(g);
      o.textContent = String(g);
      oralSel.appendChild(o);
    });
    // default: highest grade
    oralSel.value = String(oralGrades[0]);
  }

  async function setActive(calcMeta, { scroll = false } = {}) {
    if (!calcMeta) return;

    // While loading, show something useful immediately
    activeLoading = true;
    if (btn) btn.disabled = true;
    activeTitle.textContent = calcMeta.title || "Калькулятор";
    const metaPartsPreview = [calcMeta.semester, calcMeta.subject, calcMeta.kind].filter(Boolean);
    activeMeta.textContent = metaPartsPreview.join(" • ") || " ";
    resEl.textContent = "Загружаем калькулятор…";

    const calc = await resolveCalc(calcMeta);
    if (!calc) {
      activeLoading = false;
      if (btn) btn.disabled = false;
      return;
    }
    active = calc;
    activeLoading = false;
    if (btn) btn.disabled = false;

    activeTitle.textContent = calc.title || "Расчёт";
    const metaParts = [calc.semester, calc.subject, calc.kind].filter(Boolean);
    activeMeta.textContent = metaParts.join(" • ") || " ";

    renderOralOptions(calc);
    renderCalcTable(tableHost, calc);

    // placeholder range
    if (Array.isArray(calc?.brsRange) && calc.brsRange.length === 2) {
      brsInput.placeholder = `Баллы БРС (до устного) ${calc.brsRange[0]}–${calc.brsRange[1]}`;
    } else {
      brsInput.placeholder = "Баллы БРС (до устного)";
    }

    // Update URL (shareable)
    try {
      const u = new URL(window.location.href);
      u.searchParams.set("calc", calc.id);
      history.replaceState(null, "", u.toString());
    } catch {}

    // Reset result (keep inputs)
    if (!brsInput.value) {
      resEl.textContent = "Введи данные и нажми «Посчитать».";
      clearHighlights(tableHost);
    } else {
      recompute(true);
    }

    // Update copy button tooltip
    if (copyBtn) {
      copyBtn.disabled = !calc.id;
    }

    // Highlight active in catalog
    catalogHost.querySelectorAll("[data-calc-card]").forEach((el) => {
      el.classList.toggle("is-active", el.getAttribute("data-calc-card") === calc.id);
    });

    if (scroll) {
      try {
        document.getElementById("calculator")?.scrollIntoView({ behavior: "smooth", block: "start" });
      } catch {}
    }
  }

  function getFilters() {
    return {
      qRaw: qEl.value || "",
      semester: semSel.value || "",
      subject: subSel.value || "",
      kind: kindSel.value || "",
    };
  }

  function filterAndRank(calcs) {
    const f = getFilters();
    const q = buildQuery(f.qRaw);

    const base = calcs.filter((c) => {
      if (f.semester && (c.semester || "") !== f.semester) return false;
      if (f.subject && (c.subject || "") !== f.subject) return false;
      if (f.kind && (c.kind || "") !== f.kind) return false;
      return true;
    });

    if (!q.qNorm) {
      return base.slice().sort((a, b) => {
        const ka = semesterSortKey(a.semester);
        const kb = semesterSortKey(b.semester);
        if (ka !== kb) return ka - kb;
        const s = (a.subject || "").localeCompare(b.subject || "", "ru");
        if (s !== 0) return s;
        return (a.title || "").localeCompare(b.title || "", "ru");
      });
    }

    const ranked = [];
    for (const c of base) {
      const s = scoreCalc(c, q);
      if (s >= 1 || s >= q.threshold) ranked.push({ c, s });
    }

    ranked.sort((a, b) => {
      if (b.s !== a.s) return b.s - a.s;
      return (a.c.title || "").localeCompare(b.c.title || "", "ru");
    });

    return ranked.map((x) => x.c);
  }

  function renderCatalog() {
    const filtered = filterAndRank(calculators);

    document.querySelectorAll("[data-calc-total]").forEach((el) => (el.textContent = calculators.length.toString()));
    document.querySelectorAll("[data-calc-results]").forEach((el) => (el.textContent = filtered.length.toString()));

    catalogHost.innerHTML = "";

    if (!filtered.length) {
      catalogHost.innerHTML = `<div class="notice">Ничего не найдено. Измени фильтры или запрос.</div>`;
      return;
    }

    filtered.forEach((c) => {
      const card = document.createElement("div");
      card.className = "card item";
      card.setAttribute("data-calc-card", c.id);

      const left = document.createElement("div");
      left.className = "item-left";

      const h = document.createElement("h3");
      h.className = "item-title";
      h.textContent = c.title || c.id;

      const meta = document.createElement("p");
      meta.className = "item-meta";
      meta.textContent = [c.semester, c.subject, c.kind].filter(Boolean).join(" • ");

      const tags = document.createElement("div");
      tags.className = "tags";
      (c._tags || []).filter(Boolean).forEach((t) => {
        const span = document.createElement("span");
        span.className = "tag";
        span.textContent = t;
        tags.appendChild(span);
      });

      const extra = document.createElement("p");
      extra.className = "small";
      if (Array.isArray(c.brsRange) && c.brsRange.length === 2) {
        extra.textContent = `Диапазон БРС: ${c.brsRange[0]}–${c.brsRange[1]}`;
      } else {
        extra.textContent = "";
      }

      left.appendChild(h);
      if (meta.textContent) left.appendChild(meta);
      if ((c._tags || []).length) left.appendChild(tags);
      if (extra.textContent) left.appendChild(extra);

      const actions = document.createElement("div");
      actions.className = "item-actions";

      const pick = document.createElement("button");
      pick.type = "button";
      pick.className = "button";
      pick.textContent = "Выбрать";
      pick.addEventListener("click", () => {
        setActive(c, { scroll: false }).catch(() => {});
      });

      const copy = document.createElement("button");
      copy.type = "button";
      copy.className = "button ghost icon tiny";
      copy.title = "Скопировать ссылку на этот калькулятор";
      copy.setAttribute("aria-label", copy.title);
      copy.innerHTML = "⧉";
      copy.addEventListener("click", async () => {
        const link = makeCalcShareUrl(c.id);
        if (window.copyToClipboard) await window.copyToClipboard(link);
      });

      actions.appendChild(pick);
      actions.appendChild(copy);

      card.appendChild(left);
      card.appendChild(actions);

      catalogHost.appendChild(card);
    });

    // Mark active if selected
    if (active?.id) {
      catalogHost.querySelectorAll("[data-calc-card]").forEach((el) => {
        el.classList.toggle("is-active", el.getAttribute("data-calc-card") === active.id);
      });
    }
  }

  function renderCalcExplorer() {
    const host = document.getElementById("calcExplorerHost");
    if (!host) return;
    if (!window.Explorer || typeof window.Explorer.render !== "function") {
      host.innerHTML = `<div class="notice">Каталог временно недоступен. Попробуй обновить страницу.</div>`;
      return;
    }

    const items = (calculators || []).slice();
    if (!items.length) {
      host.innerHTML = `<div class="notice">Каталог пока пуст.</div>`;
      return;
    }

    window.Explorer.render(host, items, {
      id: "calc",
      showCopy: false,
      showOutside: false,
      getPath: (c) => {
        try {
          if (typeof getExplicitPath === "function") {
            const explicit = getExplicitPath(c);
            if (explicit && explicit.length) return explicit;
          }
        } catch {}

        const out = [];
        const semRaw = (c.semester || "").toString().trim();
        const sem = semRaw ? ((typeof semesterToDir === "function") ? semesterToDir(semRaw) : semRaw) : "Общее";
        if (sem) out.push(sem);
        if (c.subject) out.push(c.subject.toString());
        if (c.kind) out.push(c.kind.toString());
        return out;
      },
      getTitle: (c) => c.title || c.id || "Калькулятор",
      getMeta: (c) => "",
      // Tags are more useful in global search; in folder view they often duplicate the path.
      showTags: false,
      getTags: (c) => Array.isArray(c.tags) ? c.tags : [],
      getDescription: (c) => c.description || "",
      getId: () => "", // calculators are opened in-place (no viewer.html)
      getSourceUrl: () => "",
      getOpenUrl: (c) => makeCalcShareUrl(c.id),
      getShareUrl: (c) => makeCalcShareUrl(c.id),
      onItemOpen: (c) => {
        // In-place selection without reloading the page
        setActive(c, { scroll: false }).catch(() => {});
      },
      emptyText: "В этой папке пока нет калькуляторов."
    });
  }

  function recompute(silent) {
    if (activeLoading) {
      if (!silent) resEl.textContent = "Калькулятор загружается…";
      return;
    }
    if (!active) return;

    const brs = Number(brsInput.value);
    const oral = Number(oralSel.value);

    if (!Number.isFinite(brs)) {
      if (!silent) resEl.textContent = "Введите баллы БРС (число).";
      clearHighlights(tableHost);
      return;
    }

    const { row, idx: rowIdx } = findRow(active, brs);
    if (!row) {
      const range = Array.isArray(active?.brsRange) ? active.brsRange : null;
      const hint = range ? `Ожидаемый диапазон: ${range[0]}–${range[1]}.` : "Проверь диапазон баллов.";
      resEl.textContent = `Не нашёл строку для ${brs} баллов. ${hint}`;
      clearHighlights(tableHost);
      return;
    }

    const oralGrades = Array.isArray(active.oralGrades) && active.oralGrades.length ? active.oralGrades : [10, 9, 8, 7, 6, 5, 4, 3];
    const colIdx = oralGrades.indexOf(oral);
    if (colIdx === -1) {
      resEl.textContent = "Выберите оценку устного ответа из списка.";
      clearHighlights(tableHost);
      return;
    }

    const delta = Number((row.delta || [])[colIdx]);
    if (!Number.isFinite(delta)) {
      resEl.textContent = "В таблице нет значения для выбранной комбинации.";
      clearHighlights(tableHost);
      return;
    }

    const finalRaw = oral + delta;
    const final = clamp(finalRaw, 1, 10);
    const deltaText = fmtDelta(delta);

    let note = "";
    if (final !== finalRaw) note = ` (ограничено до ${final})`;

    resEl.innerHTML = `
      <div><strong>Результат:</strong> итоговая оценка = <strong>${final}</strong>${note}</div>
      <div class="small" style="margin-top:6px;">
        Баллы БРС: <strong>${brs}</strong> • Устный: <strong>${oral}</strong> • Поправка: <strong>${deltaText}</strong> • Строка: <strong>${row.label || ""}</strong>
      </div>
    `;

    setHighlights(tableHost, rowIdx, colIdx);
  }

  // Wire compute controls
  btn.addEventListener("click", () => recompute(false));
  reset.addEventListener("click", () => {
    brsInput.value = "";
    if (oralSel.options.length) oralSel.value = oralSel.options[0].value;
    resEl.textContent = "Введи данные и нажми «Посчитать».";
    clearHighlights(tableHost);
  });
  brsInput.addEventListener("input", () => recompute(true));
  oralSel.addEventListener("change", () => recompute(true));

  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      if (!active?.id) return;
      const link = makeCalcShareUrl(active.id);
      if (window.copyToClipboard) await window.copyToClipboard(link);
    });
  }

  // Wire catalog filters
  ["input", "change"].forEach((evName) => {
    qEl.addEventListener(evName, renderCatalog);
    semSel.addEventListener(evName, renderCatalog);
    subSel.addEventListener(evName, renderCatalog);
    kindSel.addEventListener(evName, renderCatalog);
  });

  resetFilters.addEventListener("click", () => {
    qEl.value = "";
    semSel.value = "";
    subSel.value = "";
    kindSel.value = "";
    renderCatalog();
  });

  // Load data
  try {
    const data = await loadJSON("content/calculators/index.json");
    calculators = Array.isArray(data) ? data : (data.items || data.calculators || []);

    // Normalize index entries
    calculators = (calculators || []).map((c) => {
      const out = { ...(c || {}) };
      if (!out.type) out.type = "calc";
      // Ensure tags are always an array for UI
      if (!Array.isArray(out.tags)) out.tags = [];
      return out;
    });

    if (!calculators.length) {
      catalogHost.innerHTML = `<div class="notice">Пока нет таблиц для расчёта. Если хочешь добавить калькулятор — напиши в “Обратная связь”.</div>`;
      resEl.innerHTML = "Пока нет таблиц для расчёта.";
      return;
    }

    // Build search index
    buildSearchIndex(calculators);

    // Folder explorer view (optional)
    renderCalcExplorer();

    window.CALCULATORS = calculators;
    try{ document.dispatchEvent(new CustomEvent("calculators:loaded", { detail: calculators })); }catch(e){}

    // Filters options
    fillSelect(semSel, uniq(calculators.map((c) => c.semester)).sort((a, b) => semesterSortKey(a) - semesterSortKey(b)), "Семестр: все");
    fillSelect(subSel, uniq(calculators.map((c) => c.subject)).sort((a, b) => (a || "").localeCompare(b || "", "ru")), "Предмет: все");
    fillSelect(kindSel, uniq(calculators.map((c) => c.kind)).sort((a, b) => (a || "").localeCompare(b || "", "ru")), "Тип: все");

    // Initial render
    renderCatalog();

    // Preselect from URL
    const params = new URL(window.location.href).searchParams;
    const wanted = params.get("calc");
    const first = calculators[0];
    const initial = calculators.find((c) => c.id === wanted) || first;
    await setActive(initial);

    // Show totals
    document.querySelectorAll("[data-calc-total]").forEach((el) => (el.textContent = calculators.length.toString()));
  } catch (e) {
    console.warn(e);
    catalogHost.innerHTML = `<div class="notice">Не получилось загрузить калькуляторы. Попробуй обновить страницу или загляни позже.</div>`;
    resEl.innerHTML = "Не получилось загрузить калькуляторы.";
  }
});
})();
