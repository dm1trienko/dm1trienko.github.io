(async function(){
  function $(sel){ return document.querySelector(sel); }

  function setText(sel, txt){
    const el = $(sel);
    if (el) el.textContent = txt || "";
  }

  function escapeHtml(s){
    return (s || "").toString().replace(/[&<>"]/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"
    }[c]));
  }

  function safeUrl(u){
    try{
      return new URL(u, window.location.href).toString();
    }catch{
      return "";
    }
  }

  function getParam(name){
    try{
      const u = new URL(window.location.href);
      return u.searchParams.get(name);
    }catch{
      return null;
    }
  }

  function detectTheme(){
    const explicit = document.documentElement.getAttribute("data-theme");
    if (explicit) return explicit;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }

  function enhanceMarkdown(root){
    if (!root) return;

    // KaTeX
    try{
      if (window.renderMathInElement){
        window.renderMathInElement(root, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false },
            { left: "\\\\(", right: "\\\\)", display: false },
            { left: "\\\\[", right: "\\\\]", display: true },
          ],
          throwOnError: false,
        });
      }
    }catch(e){}

    // Mermaid
    try{
      const blocks = root.querySelectorAll("pre > code.language-mermaid, pre > code.lang-mermaid, pre > code.mermaid, pre > code[class*=\"language-mermaid\"], pre > code[class*=\"lang-mermaid\"]");
      blocks.forEach((code) => {
        const src = code.textContent || "";
        const pre = code.closest("pre");
        if (!pre) return;
        const wrap = document.createElement("div");
        wrap.className = "mermaid";
        wrap.dataset.mermaidSrc = src;
        wrap.textContent = src;
        pre.replaceWith(wrap);
      });

      if (window.mermaid){
        const theme = detectTheme() === "light" ? "default" : "dark";
        try{ window.mermaid.initialize({ startOnLoad: false, theme, securityLevel: "strict" }); }catch(e){}
        const nodes = Array.from(root.querySelectorAll(".mermaid"));
        nodes.forEach((n) => { if (n.dataset.mermaidSrc) n.textContent = n.dataset.mermaidSrc; });

        if (typeof window.mermaid.run === "function") window.mermaid.run({ nodes });
        else if (typeof window.mermaid.init === "function") window.mermaid.init(undefined, nodes);
      }
    }catch(e){}
  }

  function renderTableInto(container, headers, rows){
    const tableWrap = document.createElement("div");
    tableWrap.className = "table-wrap";

    const table = document.createElement("table");
    table.className = "table";

    if (headers && headers.length){
      const thead = document.createElement("thead");
      const tr = document.createElement("tr");
      headers.forEach(h => {
        const th = document.createElement("th");
        th.textContent = h;
        tr.appendChild(th);
      });
      thead.appendChild(tr);
      table.appendChild(thead);
    }

    const tbody = document.createElement("tbody");
    rows.forEach((r) => {
      const tr = document.createElement("tr");
      r.forEach((cell) => {
        const td = document.createElement("td");
        td.textContent = cell == null ? "" : String(cell);
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    tableWrap.appendChild(table);
    container.innerHTML = "";
    container.appendChild(tableWrap);
  }

  async function renderCsv(container, url){
    if (!window.Papa){
      container.innerHTML = `<div class="notice">Не удалось загрузить парсер CSV.</div>`;
      return;
    }
    return new Promise((resolve) => {
      window.Papa.parse(url, {
        download: true,
        skipEmptyLines: true,
        complete: (res) => {
          const data = res && res.data ? res.data : [];
          if (!data.length){
            container.innerHTML = `<div class="notice">CSV пустой.</div>`;
            resolve();
            return;
          }
          const headers = data[0] || [];
          const rows = data.slice(1);
          renderTableInto(container, headers, rows);
          resolve();
        },
        error: () => {
          container.innerHTML = `<div class="notice">Не удалось загрузить CSV.</div>`;
          resolve();
        }
      });
    });
  }

  async function renderXlsx(container, url){
    if (!window.XLSX){
      container.innerHTML = `<div class="notice">Не удалось загрузить Excel‑движок.</div>`;
      return;
    }
    try{
      const resp = await fetch(url);
      const buf = await resp.arrayBuffer();
      const wb = window.XLSX.read(buf, { type: "array" });
      const sheetNames = (wb && wb.SheetNames) ? wb.SheetNames : [];
      if (!sheetNames.length){
        container.innerHTML = `<div class="notice">Файл пустой.</div>`;
        return;
      }

      container.innerHTML = "";

      // Toolbar (sheet selector)
      let selectEl = null;
      if (sheetNames.length > 1){
        const tools = document.createElement("div");
        tools.className = "tools";
        tools.style.flexWrap = "wrap";
        tools.style.marginBottom = "10px";

        const label = document.createElement("div");
        label.className = "small";
        label.textContent = "Лист:";
        label.style.alignSelf = "center";
        tools.appendChild(label);

        selectEl = document.createElement("select");
        selectEl.className = "input";
        selectEl.style.maxWidth = "360px";

        sheetNames.forEach((name) => {
          const opt = document.createElement("option");
          opt.value = name;
          opt.textContent = name;
          selectEl.appendChild(opt);
        });
        tools.appendChild(selectEl);

        const meta = document.createElement("div");
        meta.className = "small";
        meta.textContent = `${sheetNames.length} лист(ов)`;
        meta.style.alignSelf = "center";
        tools.appendChild(meta);

        container.appendChild(tools);
      }

      const tableHost = document.createElement("div");
      container.appendChild(tableHost);

      function renderSheet(name){
        const sheet = wb.Sheets[name];
        const rows = window.XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
        if (!rows.length){
          tableHost.innerHTML = `<div class="notice">Лист пустой.</div>`;
          return;
        }
        const headers = rows[0] || [];
        const body = rows.slice(1);
        renderTableInto(tableHost, headers, body);
      }

      if (selectEl){
        selectEl.addEventListener("change", () => renderSheet(selectEl.value));
      }

      renderSheet(sheetNames[0]);
    }catch(e){
      console.warn(e);
      container.innerHTML = `<div class="notice">Не удалось открыть Excel.</div>`;
    }
  }

  async function renderMarkdown(container, url){
    try{
      const md = await (await fetch(url, { cache: "no-store" })).text();
      const html = window.marked ? window.marked.parse(md) : `<pre>${escapeHtml(md)}</pre>`;
      container.innerHTML = html;
      enhanceMarkdown(container);
      // re-render Mermaid on theme changes
      document.addEventListener("theme:changed", () => enhanceMarkdown(container));
    }catch(e){
      container.innerHTML = `<div class="notice">Не удалось загрузить текст.</div>`;
    }
  }

  function renderImage(container, url){
    container.innerHTML = `
      <div style="display:flex;justify-content:center;">
        <img src="${url}" alt="Изображение" style="max-width:100%;height:auto;border-radius:14px;border:1px solid var(--border);background:var(--card-bg);" />
      </div>`;
  }

  function renderAudio(container, url){
    container.innerHTML = `
      <audio controls style="width:100%;">
        <source src="${url}">
        Ваш браузер не поддерживает аудио.
      </audio>`;
  }

  function renderVideoFile(container, url){
    container.innerHTML = `
      <video controls style="width:100%;max-height:80vh;background:var(--card-bg);border-radius:14px;border:1px solid var(--border);">
        <source src="${url}">
        Ваш браузер не поддерживает видео.
      </video>`;
  }

  function isDarkTheme(){
    const explicit = (document.documentElement.getAttribute("data-theme") || "").toLowerCase();
    if (explicit) return explicit === "dark";
    try{ return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches; }catch(e){ return false; }
  }

  function renderTelegram(container, url){
    let u = null;
    try{ u = new URL(url); }catch(e){}
    if (!u){
      container.innerHTML = `<div class="notice">Открой источник: <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">Открыть</a></div>`;
      return;
    }

    const parts = (u.pathname || "").split("/").filter(Boolean);
    // Expect /channel/123 (post)
    if (parts.length >= 2 && /^\d+$/.test(parts[1])){
      const postId = `${parts[0]}/${parts[1]}`;
      container.innerHTML = "";

      const wrap = document.createElement("div");
      wrap.style.maxWidth = "900px";
      wrap.style.margin = "0 auto";
      container.appendChild(wrap);

      const script = document.createElement("script");
      script.async = true;
      script.src = "https://telegram.org/js/telegram-widget.js?22";
      script.dataset.telegramPost = postId;
      script.dataset.width = "100%";
      if (isDarkTheme()) script.dataset.dark = "1";
      wrap.appendChild(script);
      return;
    }

    container.innerHTML = `<div class="notice">Открой в Telegram: <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">Открыть</a></div>`;
  }

  async function renderPdfJs(container, url){
    const pdfjsLib = window.pdfjsLib;
    if (!pdfjsLib || !url){
      container.innerHTML = `<iframe class="viewer-frame" src="${url}" title="Просмотр PDF"></iframe>`;
      return;
    }

    try{
      // Configure worker (jsDelivr CDN)
      if (pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc){
        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
      }
    }catch(e){}

    container.innerHTML = `
      <div class="pdf-ui">
        <div class="tools pdf-tools">
          <button class="button ghost icon tiny" type="button" data-pdf-prev-page title="Предыдущая страница" aria-label="Предыдущая страница">←</button>
          <span class="small">
            <input class="input" data-pdf-page-input inputmode="numeric" style="width:72px;" aria-label="Номер страницы" />
            / <span data-pdf-pages></span>
          </span>
          <button class="button ghost icon tiny" type="button" data-pdf-next-page title="Следующая страница" aria-label="Следующая страница">→</button>

          <button class="button ghost icon tiny" type="button" data-pdf-zoom-out title="Уменьшить" aria-label="Уменьшить">−</button>
          <span class="small" data-pdf-zoom>100%</span>
          <button class="button ghost icon tiny" type="button" data-pdf-zoom-in title="Увеличить" aria-label="Увеличить">+</button>

          <span style="flex:1;"></span>

          <input class="input" data-pdf-find placeholder="Поиск по PDF…" aria-label="Поиск по PDF" />
          <button class="button ghost icon tiny" type="button" data-pdf-find-go title="Искать" aria-label="Искать">⌕</button>
          <button class="button ghost icon tiny" type="button" data-pdf-find-prev title="Предыдущая находка" aria-label="Предыдущая находка">↑</button>
          <button class="button ghost icon tiny" type="button" data-pdf-find-next title="Следующая находка" aria-label="Следующая находка">↓</button>
        </div>

        <div class="pdf-stage">
          <div class="pdf-page">
            <canvas></canvas>
            <div class="textLayer"></div>
          </div>
        </div>

        <div class="small pdf-status" data-pdf-status></div>
      </div>
    `;

    const canvas = container.querySelector("canvas");
    const ctx = canvas.getContext("2d", { alpha: false });

    const pageWrap = container.querySelector(".pdf-page");
    const textLayerDiv = container.querySelector(".textLayer");
    const status = container.querySelector("[data-pdf-status]");
    const pageInput = container.querySelector("[data-pdf-page-input]");
    const pagesEl = container.querySelector("[data-pdf-pages]");
    const zoomEl = container.querySelector("[data-pdf-zoom]");
    const prevBtn = container.querySelector("[data-pdf-prev-page]");
    const nextBtn = container.querySelector("[data-pdf-next-page]");
    const zoomOutBtn = container.querySelector("[data-pdf-zoom-out]");
    const zoomInBtn = container.querySelector("[data-pdf-zoom-in]");
    const findInput = container.querySelector("[data-pdf-find]");
    const findGo = container.querySelector("[data-pdf-find-go]");
    const findPrev = container.querySelector("[data-pdf-find-prev]");
    const findNext = container.querySelector("[data-pdf-find-next]");

    let pdfDoc = null;
    let pageNum = 1;
    let scale = 1.25;
    let rendering = false;
    let pending = null;

    let textDivs = [];
    const pageTextCache = new Map(); // page -> normalized text
    let matchPages = [];
    let matchIdx = -1;
    let lastQuery = "";
    let scanToken = 0;

    function setStatus(t){
      if (status) status.textContent = t || "";
    }

    function normalizeText(s) {
      return (s || "").toString().toLowerCase().replace(/ё/g,"е").replace(/\s+/g," ").trim();
    }

    async function getPageText(n){
      if (pageTextCache.has(n)) return pageTextCache.get(n);
      const page = await pdfDoc.getPage(n);
      const tc = await page.getTextContent();
      const str = (tc.items || []).map(i => i.str || "").join(" ");
      const norm = normalizeText(str);
      pageTextCache.set(n, norm);
      return norm;
    }

    function applyHighlights(){
      const q = normalizeText(lastQuery);
      if (!textDivs || !textDivs.length){
        return;
      }
      textDivs.forEach((d) => {
        if (!d) return;
        d.classList.remove("pdf-hit");
        if (q && normalizeText(d.textContent || "").includes(q)) d.classList.add("pdf-hit");
      });
    }

    async function renderPage(n){
      if (!pdfDoc) return;
      if (rendering){
        pending = n;
        return;
      }
      rendering = true;

      pageNum = Math.max(1, Math.min(n, pdfDoc.numPages));
      if (pageInput) pageInput.value = String(pageNum);
      if (pagesEl) pagesEl.textContent = String(pdfDoc.numPages);
      if (prevBtn) prevBtn.disabled = pageNum <= 1;
      if (nextBtn) nextBtn.disabled = pageNum >= pdfDoc.numPages;

      try{
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        pageWrap.style.width = canvas.width + "px";
        pageWrap.style.height = canvas.height + "px";
        textLayerDiv.style.width = canvas.width + "px";
        textLayerDiv.style.height = canvas.height + "px";
        textLayerDiv.innerHTML = "";
        textDivs = [];

        setStatus("");

        const renderTask = page.render({ canvasContext: ctx, viewport });
        await renderTask.promise;

        // Text layer (for search + selection)
        try{
          const textContent = await page.getTextContent();
          if (typeof pdfjsLib.renderTextLayer === "function"){
            const tl = pdfjsLib.renderTextLayer({
              textContent,
              container: textLayerDiv,
              viewport,
              textDivs,
              enhanceTextSelection: true,
            });
            if (tl && tl.promise) await tl.promise;
          } else {
            // If renderTextLayer is unavailable (API change), skip.
            textLayerDiv.innerHTML = "";
          }
        }catch(e){
          textLayerDiv.innerHTML = "";
        }

        applyHighlights();
      }catch(e){
        // If PDF.js can't fetch (CORS/404), fall back to iframe
        console.warn("PDF.js failed, fallback to iframe:", e);
        container.innerHTML = `<iframe class="viewer-frame" src="${url}" title="Просмотр PDF"></iframe>`;
        return;
      }finally{
        rendering = false;
        if (pending != null){
          const p = pending;
          pending = null;
          renderPage(p);
        }
      }
    }

    async function scanMatches(qRaw){
      const q = normalizeText(qRaw);
      lastQuery = q;
      matchPages = [];
      matchIdx = -1;

      if (!q){
        applyHighlights();
        setStatus("");
        return;
      }

      setStatus("Ищу…");
      const token = ++scanToken;

      for (let i = 1; i <= pdfDoc.numPages; i++){
        if (token !== scanToken) return; // aborted
        try{
          const txt = await getPageText(i);
          if (txt.includes(q)) matchPages.push(i);
        }catch(e){}
      }

      if (!matchPages.length){
        setStatus("Ничего не найдено");
        applyHighlights();
        return;
      }

      // Move to first match if current page doesn't match
      matchIdx = matchPages.indexOf(pageNum);
      if (matchIdx === -1){
        matchIdx = 0;
        await renderPage(matchPages[0]);
      }else{
        applyHighlights();
      }
      setStatus(`Найдено: ${matchPages.length}`);
    }

    function gotoMatch(dir){
      if (!matchPages.length) return;
      if (matchIdx === -1) matchIdx = 0;
      matchIdx = (matchIdx + dir + matchPages.length) % matchPages.length;
      renderPage(matchPages[matchIdx]);
      setStatus(`Найдено: ${matchPages.length}`);
    }

    // Controls
    prevBtn?.addEventListener("click", () => renderPage(pageNum - 1));
    nextBtn?.addEventListener("click", () => renderPage(pageNum + 1));

    pageInput?.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      const v = parseInt(pageInput.value || "1", 10);
      if (Number.isFinite(v)) renderPage(v);
    });

    zoomOutBtn?.addEventListener("click", () => {
      scale = Math.max(0.5, scale / 1.15);
      if (zoomEl) zoomEl.textContent = Math.round(scale * 100) + "%";
      renderPage(pageNum);
    });

    zoomInBtn?.addEventListener("click", () => {
      scale = Math.min(3.0, scale * 1.15);
      if (zoomEl) zoomEl.textContent = Math.round(scale * 100) + "%";
      renderPage(pageNum);
    });

    function triggerFind(){
      scanMatches(findInput?.value || "");
    }

    findGo?.addEventListener("click", triggerFind);
    findInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter"){ e.preventDefault(); triggerFind(); }
    });
    findPrev?.addEventListener("click", () => gotoMatch(-1));
    findNext?.addEventListener("click", () => gotoMatch(+1));

    // Load document
    try{
      setStatus("Загружаю PDF…");
      const task = pdfjsLib.getDocument(url);
      pdfDoc = await task.promise;
      if (pagesEl) pagesEl.textContent = String(pdfDoc.numPages);
      if (pageInput) pageInput.value = "1";
      if (zoomEl) zoomEl.textContent = Math.round(scale * 100) + "%";
      await renderPage(1);
      setStatus("");
    }catch(e){
      console.warn("PDF.js load failed:", e);
      container.innerHTML = `<iframe class="viewer-frame" src="${url}" title="Просмотр PDF"></iframe>`;
    }
  }

  async function fetchJSON(path){
    const r = await fetch(path, { cache: "no-store" });
    return r.json();
  }

  const id = getParam("id");
  if (!id){
    setText("[data-viewer-title]", "Материал не найден");
    const cont = $("#viewer");
    if (cont) cont.innerHTML = `<div class="notice">Не указан id.</div>`;
    return;
  }

  let resources = [];
  let schedules = [];
  let polls = [];
  try{ resources = await fetchJSON("content/resources.json"); }catch{}
  try{ schedules = await fetchJSON("content/schedules.json"); }catch{}
  try{ polls = await fetchJSON("content/polls.json"); }catch{}

  const all = []
    .concat((resources || []).map(r => ({ ...r, __source: "resources" })))
    .concat((schedules || []).map(s => ({ ...s, __source: "schedules" })))
    .concat((polls || []).map(p => ({ ...p, __source: "polls" })));

  const item = all.find((x) => x && x.id === id);
  if (!item){
    setText("[data-viewer-title]", "Материал не найден");
    const cont = $("#viewer");
    if (cont) cont.innerHTML = `<div class="notice">Материал с id “${escapeHtml(id)}” не найден.</div>`;
    return;
  }

  // Normalize links/types for consistent rendering
  try{
    window.SmartLink?.normalizeItem?.(item);
  }catch(e){}

  const source = item.__source || "resources";
  const sourceLabel = source === "schedules" ? "Расписание" : (source === "polls" ? "Опрос" : "Материал");

  // Header
  setText("[data-viewer-title]", item.title || "Без названия");
  setText("[data-viewer-desc]", item.description || "");

  const metaParts = [];
  if (item.semester) metaParts.push(item.semester);
  if (item.subject) metaParts.push(item.subject);
  if (item.kind) metaParts.push(item.kind);

  // Determine type & URLs
  const rawUrl = safeUrl(item.url || item.embedUrl || "");
  let type = (item.type || "").toString().toLowerCase();
  if (!type && source === "polls") type = "form";
  if (type === "xls" || type === "xlsm" || type === "excel") type = "xlsx";

  if (!type || type === "link" || type === "yandex"){
    if (window.SmartLink && typeof window.SmartLink.inferType === "function"){
      const inferred = window.SmartLink.inferType(rawUrl);
      if (inferred) type = inferred;
    }
  }

  const label = (window.SmartLink && window.SmartLink.typeLabel) ? window.SmartLink.typeLabel(type) : type;
  if (label) metaParts.push(label);
  setText("[data-viewer-meta]", metaParts.filter(Boolean).join(" • "));

  let openSrc = rawUrl;
  let embedSrc = rawUrl;
  if (window.SmartLink){
    try{
      if (typeof window.SmartLink.toOpenUrl === "function"){
        openSrc = safeUrl(window.SmartLink.toOpenUrl(rawUrl, type) || rawUrl);
      }
    }catch(e){}
    try{
      if (typeof window.SmartLink.toEmbedUrl === "function"){
        embedSrc = safeUrl(window.SmartLink.toEmbedUrl(rawUrl, type) || rawUrl);
      }
    }catch(e){}
  }

  // Back link
  const back = $("[data-back]");
  if (back){
    if (source === "resources"){
      const p = new URLSearchParams();
      if (item.semester) p.set("sem", item.semester);
      if (item.subject) p.set("sub", item.subject);
      const qs = p.toString();
      back.href = `index.html${qs ? "?" + qs : ""}#materials`;
    } else if (source === "schedules"){
      back.href = "index.html#schedules";
    } else {
      back.href = "index.html#polls";
    }
  }

  // Open source button
  const openBtn = $("[data-open-src]");
  if (openBtn && openSrc){
    openBtn.href = openSrc;
    openBtn.target = "_blank";
    openBtn.rel = "noopener noreferrer";
  }

  // Copy / Share
  const copyBtn = $("[data-copy-link]");
  if (copyBtn){
    copyBtn.addEventListener("click", async () => {
      const url = window.location.href;
      if (window.copyToClipboard) await window.copyToClipboard(url);
      else {
        try { await navigator.clipboard.writeText(url); } catch {}
      }
    });
  }

  const shareBtn = $("[data-share]");
  if (shareBtn){
    shareBtn.addEventListener("click", async () => {
      const url = window.location.href;
      const title = item.title || document.title || "dmitrienok.ru";
      const ok = window.nativeShare ? await window.nativeShare({ title, url }) : false;
      if (!ok && window.copyToClipboard) await window.copyToClipboard(url);
    });
  }

  // Favorites / Recents
  const store = window.HubStore;
  const storeId = `item:${id}`;
  const entryMeta = [sourceLabel, ...metaParts].filter(Boolean).join(" • ");
  const entry = { id: storeId, title: item.title || sourceLabel, href: window.location.href, kind: "item", meta: entryMeta };

  try{ store?.addRecent?.(entry); }catch(e){}

  const favBtn = $("[data-fav]");
  function syncFav(){
    if (!favBtn) return;
    const on = !!store?.isFavorite?.(storeId);
    favBtn.textContent = on ? "★" : "☆";
    favBtn.title = on ? "Убрать из избранного" : "В избранное";
    favBtn.setAttribute("aria-label", favBtn.title);
  }
  if (favBtn){
    favBtn.addEventListener("click", () => {
      if (!store?.toggleFavorite) return;
      store.toggleFavorite(entry);
      syncFav();
      try{
        window.showToast?.(store.isFavorite(storeId) ? "Добавлено в избранное" : "Убрано из избранного");
      }catch(e){}
    });
    syncFav();
  }

  // Viewer width / fullscreen controls
  const widthBtn = $("[data-width-toggle]");
  const fsBtn = $("[data-fullscreen]");
  const widthKey = "viewer:widthMode";
  const widthModes = ["normal", "wide", "full"];
  function applyWidthMode(mode){
    if (!document.body) return;
    document.body.classList.toggle("viewer-wide", mode === "wide");
    document.body.classList.toggle("viewer-full", mode === "full");

    if (widthBtn){
      const t = mode === "normal" ? "Сделать шире" : mode === "wide" ? "На всю ширину" : "Обычная ширина";
      widthBtn.title = t;
      widthBtn.setAttribute("aria-label", t);
    }
  }

  let widthMode = "normal";
  try{
    const saved = localStorage.getItem(widthKey);
    if (saved && widthModes.includes(saved)) widthMode = saved;
  }catch(e){}
  applyWidthMode(widthMode);

  if (widthBtn){
    widthBtn.addEventListener("click", () => {
      const idx = Math.max(0, widthModes.indexOf(widthMode));
      widthMode = widthModes[(idx + 1) % widthModes.length];
      try{ localStorage.setItem(widthKey, widthMode); }catch(e){}
      applyWidthMode(widthMode);
      try{
        const lbl = widthMode === "normal" ? "Обычная ширина" : widthMode === "wide" ? "Широкий режим" : "На всю ширину";
        window.showToast?.(lbl);
      }catch(e){}
    });
  }

  if (fsBtn){
    fsBtn.addEventListener("click", async () => {
      const target = document.querySelector(".viewer-wrap") || document.getElementById("viewer") || document.documentElement;
      try{
        if (!document.fullscreenElement){
          await (target.requestFullscreen ? target.requestFullscreen() : document.documentElement.requestFullscreen());
        } else {
          await document.exitFullscreen();
        }
      }catch(e){
        window.showToast?.("Полноэкранный режим недоступен");
      }
    });
  }

  const container = $("#viewer");
  if (!container) return;

  if (!embedSrc){
    container.innerHTML = `<div class="notice">У этого материала нет ссылки. Сообщи об этом через “Обратная связь”.</div>`;
    return;
  }

  // Missing local file handling (show a friendly placeholder instead of 404)
  const explicitMissing = !!item?.missing || !!item?.notUploaded || (String(item?.status || "").toLowerCase() === "missing");
  let isMissing = explicitMissing;
  const candidateUrl = (openSrc || embedSrc || "").toString();
  const isLocalCandidate = !!(candidateUrl && window.FileProbe && window.FileProbe.isLocalUrl && window.FileProbe.isLocalUrl(candidateUrl));
  if (!isMissing && isLocalCandidate && window.FileProbe && typeof window.FileProbe.exists === "function"){
    try{
      const ok = await window.FileProbe.exists(candidateUrl);
      if (!ok) isMissing = true;
    }catch(e){}
  }

  if (isMissing && isLocalCandidate){
    if (openBtn){
      openBtn.classList.add("disabled");
      openBtn.setAttribute("aria-disabled", "true");
      openBtn.addEventListener("click", (e) => {
        e.preventDefault();
        try{ window.showToast?.("Файл ещё не загружен"); }catch(_){}
      });
    }
    container.innerHTML = `
      <div class="notice">
        <strong>Файл ещё не загружен.</strong>
        <p class="small" style="margin-top:6px;">Карточка уже есть, но сам файл пока отсутствует в хабе. Если у тебя есть версия файла — отправь её через “Обратная связь” или напиши в Telegram.</p>
      </div>
    `;
    return;
  }

  // Render by type
  const t = (type || "").toString().toLowerCase();
  const imgTypes = new Set(["png","jpg","jpeg","gif","webp","svg"]);
  const audioTypes = new Set(["mp3","wav","ogg","m4a"]);
  const videoFileTypes = new Set(["mp4","webm","ogv"]);

  if (t === "pdf"){
    container.innerHTML = `<div class="notice">Загружаю PDF…</div>`;
    await renderPdfJs(container, openSrc || embedSrc);
    return;
  }

  if (t === "xlsx"){
    container.innerHTML = `<div class="notice">Загружаю Excel…</div>`;
    await renderXlsx(container, openSrc || embedSrc);
    return;
  }

  if (t === "csv"){
    container.innerHTML = `<div class="notice">Загружаю CSV…</div>`;
    await renderCsv(container, openSrc || embedSrc);
    return;
  }

  if (t === "md"){
    container.innerHTML = `<div class="notice">Загружаю…</div>`;
    await renderMarkdown(container, openSrc || embedSrc);
    return;
  }

  if (t === "telegram"){
    renderTelegram(container, openSrc || embedSrc);
    // Telegram widget has its own dark/light theme flag — re-render on theme changes.
    document.addEventListener("theme:changed", () => renderTelegram(container, openSrc || embedSrc));
    return;
  }

  if (t === "image" || imgTypes.has(t)){
    renderImage(container, openSrc || embedSrc);
    return;
  }

  if (t === "audio" || audioTypes.has(t)){
    renderAudio(container, openSrc || embedSrc);
    return;
  }

  if (t === "video_file" || videoFileTypes.has(t)){
    renderVideoFile(container, openSrc || embedSrc);
    return;
  }

  if (t === "google_calendar"){
    container.innerHTML = `<iframe class="viewer-frame" src="${embedSrc}" title="Календарь" style="min-height: 70vh;"></iframe>`;
    return;
  }

  if (t === "form"){
    // Recompute embed URL in a theme-aware way (Yandex Forms supports theme=dark/light).
    const base = safeUrl(item.url || item.embedUrl || embedSrc || "");
    let src = embedSrc;
    try{
      if (window.SmartLink && typeof window.SmartLink.toEmbedUrl === "function"){
        src = safeUrl(window.SmartLink.toEmbedUrl(base, "form") || embedSrc);
      }
    }catch(e){}

    container.innerHTML = `<iframe class="viewer-frame" src="${src}" title="Форма / опрос" style="min-height: 70vh;"></iframe>`;

    // Yandex Forms: load the official embed helper (auto-resize) when present.
    try{
      if (/forms\.yandex\./i.test(src) && typeof window.ensureYandexFormsEmbed === "function") {
        window.ensureYandexFormsEmbed();
      }
    }catch(e){}

    // Keep Yandex Forms in sync if the user toggles the site theme.
    if (/forms\.yandex\./i.test(base)){
      document.addEventListener("theme:changed", () => {
        try{
          const ifr = container.querySelector("iframe");
          if (!ifr) return;
          const next = (window.SmartLink && typeof window.SmartLink.toEmbedUrl === "function")
            ? safeUrl(window.SmartLink.toEmbedUrl(base, "form") || ifr.src)
            : ifr.src;
          if (next && ifr.src !== next) ifr.src = next;
        }catch(e){}
      });
    }

    return;
  }

  if (t === "video"){
    container.innerHTML = `<iframe class="viewer-frame" src="${embedSrc}" title="Видео" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    return;
  }

  // Default: iframe embed for known doc types and many links
  if (embedSrc && embedSrc !== openSrc){
    container.innerHTML = `<iframe class="viewer-frame" src="${embedSrc}" title="Документ"></iframe>`;
    return;
  }

  // Fallback: show guidance
  container.innerHTML = `
    <div class="notice">
      Этот материал лучше открыть по ссылке: <a href="${openSrc}" target="_blank" rel="noopener noreferrer">Открыть источник</a>
      <div class="small" style="margin-top:8px;">Если внутри хаба не отображается — нажми ↗ и открой в новом окне.</div>
    </div>
  `;
})();