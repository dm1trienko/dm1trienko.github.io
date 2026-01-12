/* Explorer (file-browser style)
   Used for: Materials / Schedules / Polls catalogs.
   No server — pure client-side rendering.

   API:
     window.Explorer.render(host, items, options)

   options:
     - id: string (storage key namespace)
     - getPath(item) -> string[]    (folder path segments)
     - getTitle(item) -> string
     - getMeta(item) -> string
     - getTags(item) -> string[]
     - getDescription(item) -> string
     - getId(item) -> string
     - getSourceUrl(item) -> string (raw/original link)
     - getOpenUrl(item) -> string   (viewer link or fallback)
     - showCopy: boolean (default true)
     - showOutside: boolean (default true)
     - emptyText: string
*/

(function(){
  function isExternalUrl(u){
    return /^https?:\/\//i.test((u || "").toString());
  }

  function isBadScheme(u){
    return /^(javascript|data|vbscript):/i.test((u || "").toString().trim());
  }

  function safeUrl(u){
    if (!u) return "";
    const s = (u || "").toString().trim();
    if (!s) return "";
    if (isBadScheme(s)) return "";
    // allow mailto/tel anchors
    if (/^(mailto:|tel:|#)/i.test(s)) return s;
    if (isExternalUrl(s)) return s;
    return encodeURI(s);
  }

  function splitLocalPath(u){
    const raw = (u || "").toString().trim();
    if (!raw || isExternalUrl(raw)) return [];
    const clean = raw.split(/[?#]/)[0];
    return clean.split("/").filter(Boolean).map(seg => {
      try { return decodeURIComponent(seg); } catch { return seg; }
    });
  }

  function typeLabel(t){
    const key = (t || "").toString().toLowerCase();
    const map = {
      calc: "Калькулятор",
      calculator: "Калькулятор",
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
      image: "Изображение",
      audio: "Аудио",
      mp3: "Аудио",
      wav: "Аудио",
      video_file: "Видео",
      mp4: "Видео",
      webm: "Видео"
    };
    return map[key] || (t ? t.toUpperCase() : "");
  }

  function iconForType(t){
    const k = (t || "").toString().toLowerCase();
    if (k === "calc" || k === "calculator") return "🧮";
    if (k === "pdf") return "📄";
    if (k === "csv") return "🧾";
    if (k === "xlsx" || k === "xls" || k === "xlsm" || k === "excel") return "📊";
    if (k.startsWith("google_") || k === "drive" || k === "drive_folder") return "🟩";
    if (k.startsWith("yandex")) return "🟨";
    if (k === "form") return "📝";
    if (k === "telegram") return "✈️";
    if (k === "video" || k === "video_file" || k === "mp4" || k === "webm") return "🎞️";
    if (k === "audio" || k === "mp3" || k === "wav") return "🎧";
    if (k === "image") return "🖼️";
    return "📎";
  }

  function createNode(name){
    return { name: name || "", children: new Map(), items: [] };
  }

  function addToTree(root, pathSegments, item){
    let node = root;
    const segs = (pathSegments || []).map(s => (s || "").toString().trim()).filter(Boolean);
    for (const seg of segs){
      if (!node.children.has(seg)) node.children.set(seg, createNode(seg));
      node = node.children.get(seg);
    }
    node.items.push(item);
  }

  function countNode(node){
    let c = (node.items || []).length;
    for (const child of node.children.values()) c += countNode(child);
    return c;
  }

  function sortKeys(keys){
    return (keys || []).slice().sort((a,b) => a.localeCompare(b, "ru"));
  }

  function pathKey(path){
    return JSON.stringify(path || []);
  }

  function getNodeByPath(root, path){
    let node = root;
    for (const seg of (path || [])){
      if (!node.children.has(seg)) return null;
      node = node.children.get(seg);
    }
    return node;
  }

  function ensureOpenTo(openSet, path){
    const segs = (path || []);
    const cur = [];
    for (const s of segs){
      cur.push(s);
      openSet.add(pathKey(cur));
    }
  }

  function readSavedPath(storageKey){
    try{
      const raw = localStorage.getItem(storageKey);
      const arr = JSON.parse(raw || "[]");
      return Array.isArray(arr) ? arr : [];
    }catch{
      return [];
    }
  }

  function savePath(storageKey, path){
    try{ localStorage.setItem(storageKey, JSON.stringify(path || [])); }catch{}
  }

  function renderBreadcrumbs(el, path, onClick){
    el.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "explorer-breadcrumbs";

    const rootBtn = document.createElement("button");
    rootBtn.type = "button";
    rootBtn.className = "crumb";
    rootBtn.textContent = "Главная";
    rootBtn.addEventListener("click", () => onClick([]));
    wrap.appendChild(rootBtn);

    const cur = [];
    (path || []).forEach((seg) => {
      cur.push(seg);

      const sep = document.createElement("span");
      sep.className = "crumb-sep";
      sep.textContent = "›";
      wrap.appendChild(sep);

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "crumb";
      btn.textContent = seg;
      btn.addEventListener("click", () => onClick(cur.slice()));
      wrap.appendChild(btn);
    });

    el.appendChild(wrap);
  }

  function renderFolderRow({ name, count, onOpen }){
    const row = document.createElement("div");
    row.className = "explorer-row folder";

    const left = document.createElement("div");
    left.className = "explorer-row-left";

    const ico = document.createElement("div");
    ico.className = "explorer-ico";
    ico.textContent = "📁";

    const main = document.createElement("div");
    main.className = "explorer-main";

    const title = document.createElement("button");
    title.type = "button";
    title.className = "explorer-title linklike";
    title.textContent = name || "Папка";
    title.addEventListener("click", onOpen);

    const meta = document.createElement("div");
    meta.className = "small explorer-meta";
    meta.textContent = `${count} элемент(ов)`;

    main.appendChild(title);
    main.appendChild(meta);

    left.appendChild(ico);
    left.appendChild(main);

    const actions = document.createElement("div");
    actions.className = "explorer-row-actions";
    const openBtn = document.createElement("button");
    openBtn.type = "button";
    openBtn.className = "button ghost icon tiny";
    openBtn.title = "Открыть папку";
    openBtn.setAttribute("aria-label", openBtn.title);
    openBtn.textContent = "→";
    openBtn.addEventListener("click", onOpen);
    actions.appendChild(openBtn);

    row.appendChild(left);
    if (actions.childElementCount) row.appendChild(actions);
    return row;
  }

  function renderItemRow(item, opts){
    const getTitle = opts.getTitle || ((x) => x.title || "Без названия");
    const getMeta = opts.getMeta || (() => "");
    const getDesc = opts.getDescription || ((x) => x.description || "");
    const getTags = opts.getTags || ((x) => Array.isArray(x.tags) ? x.tags : []);
    const getId = opts.getId || ((x) => x.id || "");
    const getOpenUrl = opts.getOpenUrl || ((x) => (x.id ? `viewer.html?id=${encodeURIComponent(x.id)}` : safeUrl(x.url || x.embedUrl || "")));
    const getSourceUrl = opts.getSourceUrl || ((x) => safeUrl(x.url || x.embedUrl || ""));
    const getShareUrl = (typeof opts.getShareUrl === "function") ? opts.getShareUrl : null;
    const onItemOpen = (typeof opts.onItemOpen === "function") ? opts.onItemOpen : null;
    const showCopy = (opts.showCopy !== false);
    const showOutside = (opts.showOutside !== false);

    const titleText = getTitle(item);
    const metaText = getMeta(item);
    const descText = getDesc(item);
    const showTags = (opts.showTags !== false);
    const tags = showTags ? (getTags(item) || []).slice(0, 10) : [];

    const openUrl = safeUrl(getOpenUrl(item));
    const srcUrl = safeUrl(getSourceUrl(item));
    const id = getId(item);

    const row = document.createElement("div");
    row.className = "explorer-row file";

    const left = document.createElement("div");
    left.className = "explorer-row-left";

    const ico = document.createElement("div");
    ico.className = "explorer-ico";
    ico.textContent = iconForType(item.type);

    const main = document.createElement("div");
    main.className = "explorer-main";

    // Title click: either navigate (default) or call onItemOpen (for in-place selections)
    let titleEl = null;
    if (onItemOpen){
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "explorer-title linklike";
      btn.textContent = titleText;
      btn.addEventListener("click", (e) => {
        // Allow Ctrl/Cmd+Click to open a share URL in a new tab (useful for calculators)
        if ((e.ctrlKey || e.metaKey) && (openUrl || srcUrl)){
          try{ window.open(openUrl || srcUrl, "_blank", "noopener"); }catch{}
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        try{ onItemOpen(item); }catch{}
      });
      titleEl = btn;
    } else {
      const a = document.createElement("a");
      a.className = "explorer-title";
      a.href = openUrl || (srcUrl || "#");
      if (!id && isExternalUrl(a.href)){
        a.target = "_blank";
        a.rel = "noopener noreferrer";
      }
      a.textContent = titleText;
      titleEl = a;
    }

    // "Файл ещё не загружен" (для локальных путей, которых пока нет в репозитории)
    const explicitMissing = !!item?.missing || !!item?.notUploaded || (String(item?.status || "").toLowerCase() === "missing");

    const meta = document.createElement("div");
    meta.className = "small explorer-meta";
    const tl = typeLabel(item.type);
    const metaParts = [];
    if (metaText) metaParts.push(metaText);
    // Если почти всё PDF, не шумим меткой "PDF" в каталоге
    if (tl && tl !== "PDF") metaParts.push(tl);

    const metaTextEl = document.createElement("span");
    metaTextEl.textContent = metaParts.join(" • ");
    meta.appendChild(metaTextEl);

    let missingBadge = null;
    function setMissing(on){
      if (!on) return;
      row.classList.add("missing");
      if (!missingBadge){
        missingBadge = document.createElement("span");
        missingBadge.className = "badge warn";
        missingBadge.textContent = "файл ещё не загружен";
        meta.appendChild(missingBadge);
      }
    }

    if (explicitMissing) setMissing(true);

    main.appendChild(titleEl);
    const mightBeMissing = !!(srcUrl && window.FileProbe && window.FileProbe.isLocalUrl && window.FileProbe.isLocalUrl(srcUrl));
    if (metaParts.length || explicitMissing || mightBeMissing) main.appendChild(meta);

    if (descText){
      const d = document.createElement("div");
      d.className = "small";
      d.textContent = descText;
      main.appendChild(d);
    }

    if (tags.length){
      const tagRow = document.createElement("div");
      tagRow.className = "tags";
      tags.forEach((t) => {
        const span = document.createElement("span");
        span.className = "tag";
        span.textContent = t;
        tagRow.appendChild(span);
      });
      main.appendChild(tagRow);
    }

    left.appendChild(ico);
    left.appendChild(main);

    const actions = document.createElement("div");
    actions.className = "explorer-row-actions";

    if (showCopy){
      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "button ghost icon tiny";
      copyBtn.title = "Скопировать ссылку";
      copyBtn.setAttribute("aria-label", copyBtn.title);
      copyBtn.textContent = "⧉";
      copyBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        let shareUrl = "";
        try{ shareUrl = getShareUrl ? String(getShareUrl(item) || "") : ""; }catch(e){}
        if (!shareUrl) shareUrl = (window.makeViewerUrl && id) ? window.makeViewerUrl(id) : (openUrl || srcUrl || "");
        if (window.copyToClipboard) await window.copyToClipboard(shareUrl);
      });
      actions.appendChild(copyBtn);
    }

    let outEl = null;
    if (showOutside && srcUrl && !explicitMissing){
      const out = document.createElement("a");
      out.className = "button ghost icon tiny";
      out.href = srcUrl;
      out.target = "_blank";
      out.rel = "noopener noreferrer";
      out.title = "Открыть вне сайта";
      out.setAttribute("aria-label", out.title);
      out.textContent = "↗";
      outEl = out;
      actions.appendChild(out);
    }

    // Lazy check for local files (no heavy checking on page load)
    if (!explicitMissing && srcUrl && window.FileProbe && typeof window.FileProbe.exists === "function" && window.FileProbe.isLocalUrl && window.FileProbe.isLocalUrl(srcUrl)){
      window.FileProbe.exists(srcUrl).then((ok) => {
        if (ok) return;
        setMissing(true);
        // Hide "open outside" for missing local file
        if (outEl) outEl.remove();
      }).catch(() => {
        // ignore
      });
    }

    row.appendChild(left);
    row.appendChild(actions);

    return row;
  }

  function renderTree(host, root, state, opts){
    host.innerHTML = "";

    const ul = document.createElement("ul");
    ul.className = "explorer-tree-list";

    function renderLevel(node, path){
      const keys = sortKeys(Array.from(node.children.keys()));
      keys.forEach((name) => {
        const child = node.children.get(name);
        const childPath = path.concat([name]);
        const key = pathKey(childPath);

        const li = document.createElement("li");
        li.className = "explorer-tree-li";

        const row = document.createElement("div");
        row.className = "explorer-tree-row";

        const caret = document.createElement("button");
        caret.type = "button";
        caret.className = "explorer-caret";
        caret.setAttribute("aria-label", "Свернуть/развернуть");
        caret.textContent = child.children.size ? (state.open.has(key) ? "▾" : "▸") : " ";
        caret.disabled = !child.children.size;

        caret.addEventListener("click", (e) => {
          e.stopPropagation();
          if (!child.children.size) return;
          if (state.open.has(key)) state.open.delete(key);
          else state.open.add(key);
          savePath(state.openKey, Array.from(state.open)); // store open state (best-effort)
          renderAll();
        });

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "explorer-tree-btn";
        btn.textContent = name;
        btn.setAttribute("title", name);

        const isActive = pathKey(state.path) === key;
        btn.classList.toggle("active", isActive);

        btn.addEventListener("click", () => {
          state.path = childPath.slice();
          ensureOpenTo(state.open, state.path);
          savePath(state.pathKey, state.path);
          renderAll();
          if (state.mobileTree){
            state.mobileTree.classList.remove("open");
          }
        });

        const cnt = document.createElement("span");
        cnt.className = "explorer-tree-count";
        cnt.textContent = String(countNode(child));

        row.appendChild(caret);
        row.appendChild(btn);
        row.appendChild(cnt);

        li.appendChild(row);

        if (child.children.size){
          const childUl = document.createElement("ul");
          childUl.className = "explorer-tree-list";
          if (!state.open.has(key)) childUl.hidden = true;
          renderLevel(child, childPath, childUl);

          li.appendChild(childUl);
        }

        ul.appendChild(li);
      });
    }

    function renderLevel(node, path, targetUl){
      const keys = sortKeys(Array.from(node.children.keys()));
      keys.forEach((name) => {
        const child = node.children.get(name);
        const childPath = path.concat([name]);
        const key = pathKey(childPath);

        const li = document.createElement("li");
        li.className = "explorer-tree-li";

        const row = document.createElement("div");
        row.className = "explorer-tree-row";

        const caret = document.createElement("button");
        caret.type = "button";
        caret.className = "explorer-caret";
        caret.setAttribute("aria-label", "Свернуть/развернуть");
        caret.textContent = child.children.size ? (state.open.has(key) ? "▾" : "▸") : " ";
        caret.disabled = !child.children.size;

        caret.addEventListener("click", (e) => {
          e.stopPropagation();
          if (!child.children.size) return;
          if (state.open.has(key)) state.open.delete(key);
          else state.open.add(key);
          try{ localStorage.setItem(state.openKey, JSON.stringify(Array.from(state.open))); }catch{}
          renderAll();
        });

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "explorer-tree-btn";
        btn.textContent = name;
        btn.setAttribute("title", name);

        const isActive = pathKey(state.path) === key;
        btn.classList.toggle("active", isActive);

        btn.addEventListener("click", () => {
          state.path = childPath.slice();
          ensureOpenTo(state.open, state.path);
          savePath(state.pathKey, state.path);
          renderAll();
          if (state.mobileTree){
            state.mobileTree.classList.remove("open");
          }
        });

        const cnt = document.createElement("span");
        cnt.className = "explorer-tree-count";
        cnt.textContent = String(countNode(child));

        row.appendChild(caret);
        row.appendChild(btn);
        row.appendChild(cnt);

        li.appendChild(row);

        if (child.children.size){
          const childUl = document.createElement("ul");
          childUl.className = "explorer-tree-list";
          if (!state.open.has(key)) childUl.hidden = true;
          renderLevel(child, childPath, childUl);
          li.appendChild(childUl);
        }

        targetUl.appendChild(li);
      });
    }

    function renderAll(){
      // This function is replaced by outer closure in renderExplorer
    }

    // Outer closure will override renderAll; here we only return the element.
    host.appendChild(ul);
    return { ul, renderLevel };
  }

  function renderExplorer(host, items, opts){
    if (!host) return;
    const options = opts || {};
    const id = options.id || "explorer";
    const pathStorageKey = `dmitrienok:explorer:${id}:path`;
    const openStorageKey = `dmitrienok:explorer:${id}:open`;

    const getPath = options.getPath || (() => ["Общее"]);

    // Build tree
    const root = createNode("root");
    (items || []).forEach((it) => {
      const p = getPath(it) || [];
      const segs = Array.isArray(p) ? p : [String(p)];
      addToTree(root, segs.length ? segs : ["Общее"], it);
    });

    // State
    const state = {
      pathKey: pathStorageKey,
      openKey: openStorageKey,
      path: [],
      open: new Set(),
      mobileTree: null
    };

    // Restore last path
    state.path = readSavedPath(pathStorageKey);
    // Restore open set
    try{
      const raw = localStorage.getItem(openStorageKey);
      const arr = JSON.parse(raw || "[]");
      if (Array.isArray(arr)) arr.forEach((k) => state.open.add(k));
    }catch{}
    ensureOpenTo(state.open, state.path);

    // If saved path is invalid, reset
    if (state.path.length && !getNodeByPath(root, state.path)){
      state.path = [];
      savePath(pathStorageKey, []);
    }

    // Layout
    host.innerHTML = "";

    const wrap = document.createElement("div");
    wrap.className = "explorer";

    const bar = document.createElement("div");
    bar.className = "explorer-bar";

    const crumbs = document.createElement("div");
    crumbs.className = "explorer-crumbs";
    bar.appendChild(crumbs);

    const actions = document.createElement("div");
    actions.className = "explorer-bar-actions";

    const upBtn = document.createElement("button");
    upBtn.type = "button";
    upBtn.className = "button ghost icon tiny";
    upBtn.title = "На уровень выше";
    upBtn.setAttribute("aria-label", upBtn.title);
    upBtn.textContent = "↑";
    actions.appendChild(upBtn);

    const treeBtn = document.createElement("button");
    treeBtn.type = "button";
    treeBtn.className = "button ghost icon tiny";
    treeBtn.title = "Папки";
    treeBtn.setAttribute("aria-label", treeBtn.title);
    treeBtn.textContent = "📁";
    actions.appendChild(treeBtn);

    bar.appendChild(actions);

    const body = document.createElement("div");
    body.className = "explorer-body";

    const treePane = document.createElement("aside");
    treePane.className = "explorer-tree card";
    treePane.setAttribute("aria-label", "Папки");
    body.appendChild(treePane);

    const listPane = document.createElement("section");
    listPane.className = "explorer-pane card";
    listPane.setAttribute("aria-label", "Содержимое");
    body.appendChild(listPane);

    wrap.appendChild(bar);
    wrap.appendChild(body);
    host.appendChild(wrap);

    // Mobile tree toggle
    state.mobileTree = treePane;
    treeBtn.addEventListener("click", () => {
      treePane.classList.toggle("open");
    });

    // Click outside (mobile) closes tree
    document.addEventListener("click", (e) => {
      if (!treePane.classList.contains("open")) return;
      if (treePane.contains(e.target) || treeBtn.contains(e.target)) return;
      treePane.classList.remove("open");
    });

    // Core render
    function renderAll(){
      // Breadcrumbs
      renderBreadcrumbs(crumbs, state.path, (p) => {
        state.path = p || [];
        ensureOpenTo(state.open, state.path);
        savePath(pathStorageKey, state.path);
        renderAll();
      });

      // Up button (avoid stacking listeners on re-render)
      upBtn.disabled = !state.path.length;
      upBtn.onclick = () => {
        if (!state.path.length) return;
        state.path = state.path.slice(0, -1);
        savePath(pathStorageKey, state.path);
        renderAll();
      };
// Tree
      treePane.innerHTML = "";
      const treeWrap = document.createElement("div");
      treeWrap.className = "explorer-tree-scroll";
      treePane.appendChild(treeWrap);

      const ul = document.createElement("ul");
      ul.className = "explorer-tree-list";
      treeWrap.appendChild(ul);

      function renderLevel(node, path, targetUl){
        const keys = sortKeys(Array.from(node.children.keys()));
        keys.forEach((name) => {
          const child = node.children.get(name);
          const childPath = path.concat([name]);
          const key = pathKey(childPath);

          const li = document.createElement("li");
          li.className = "explorer-tree-li";

          const row = document.createElement("div");
          row.className = "explorer-tree-row";

          const caret = document.createElement("button");
          caret.type = "button";
          caret.className = "explorer-caret";
          caret.setAttribute("aria-label", "Свернуть/развернуть");
          caret.textContent = child.children.size ? (state.open.has(key) ? "▾" : "▸") : " ";
          caret.disabled = !child.children.size;

          caret.addEventListener("click", (e) => {
            e.stopPropagation();
            if (!child.children.size) return;
            if (state.open.has(key)) state.open.delete(key);
            else state.open.add(key);
            try{ localStorage.setItem(openStorageKey, JSON.stringify(Array.from(state.open))); }catch{}
            renderAll();
          });

          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "explorer-tree-btn";
          btn.textContent = name;
          btn.setAttribute("title", name);
          btn.classList.toggle("active", pathKey(state.path) === key);

          btn.addEventListener("click", () => {
            state.path = childPath.slice();
            ensureOpenTo(state.open, state.path);
            savePath(pathStorageKey, state.path);
            renderAll();
            treePane.classList.remove("open");
          });

          const cnt = document.createElement("span");
          cnt.className = "explorer-tree-count";
          cnt.textContent = String(countNode(child));

          row.appendChild(caret);
          row.appendChild(btn);
          row.appendChild(cnt);

          li.appendChild(row);

          if (child.children.size){
            const childUl = document.createElement("ul");
            childUl.className = "explorer-tree-list";
            if (!state.open.has(key)) childUl.hidden = true;
            renderLevel(child, childPath, childUl);
            li.appendChild(childUl);
          }

          targetUl.appendChild(li);
        });
      }

      renderLevel(root, [], ul);

      // List
      listPane.innerHTML = "";

      const node = getNodeByPath(root, state.path) || root;
      const folders = sortKeys(Array.from(node.children.keys()));
      const itemsHere = (node.items || []).slice().sort((a,b) => (String((options.getTitle ? options.getTitle(a) : a.title) || "")).localeCompare(String((options.getTitle ? options.getTitle(b) : b.title) || ""), "ru"));

      // Header row
      const header = document.createElement("div");
      header.className = "explorer-pane-head";

      const hTitle = document.createElement("div");
      hTitle.className = "small";
      const where = state.path.length ? state.path.join(" / ") : "Главная";
      const cnt = folders.length + itemsHere.length;
      hTitle.textContent = `${where} • ${cnt} элемент(ов)`;
      header.appendChild(hTitle);

      listPane.appendChild(header);

      if (!folders.length && !itemsHere.length){
        const empty = document.createElement("div");
        empty.className = "notice";
        empty.textContent = options.emptyText || "Здесь пока пусто.";
        listPane.appendChild(empty);
        return;
      }

      const list = document.createElement("div");
      list.className = "explorer-list";
      listPane.appendChild(list);

      // Folders first
      folders.forEach((fname) => {
        const child = node.children.get(fname);
        const row = renderFolderRow({
          name: fname,
          count: countNode(child),
          onOpen: () => {
            state.path = state.path.concat([fname]);
            ensureOpenTo(state.open, state.path);
            savePath(pathStorageKey, state.path);
            renderAll();
          }
        });
        list.appendChild(row);
      });

      // Then items
      itemsHere.forEach((it) => {
        list.appendChild(renderItemRow(it, options));
      });
    }

    renderAll();
  }

  window.Explorer = {
    render: renderExplorer,
    safeUrl,
    isExternalUrl,
    splitLocalPath,
    typeLabel,
  };
})();
