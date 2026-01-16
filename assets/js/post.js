(function(){
  function $(sel){ return document.querySelector(sel); }

  function getParam(name){
    const u = new URL(window.location.href);
    return u.searchParams.get(name);
  }

  function escapeHtml(s){
    return (s || "").toString().replace(/[&<>"]/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"
    }[c]));
  }

  function detectTheme(){
    const explicit = document.documentElement.getAttribute("data-theme");
    if (explicit) return explicit;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }

  function formatDateDisplay(date){
    if (window.NewsMeta && typeof window.NewsMeta.formatDateDisplay === "function") {
      return window.NewsMeta.formatDateDisplay(date);
    }
    return date || "";
  }

  function enhanceMarkdown(root){
    if (!root) return;

    // KaTeX (math)
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

    // Mermaid diagrams (```mermaid)
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
        try{
          window.mermaid.initialize({ startOnLoad: false, theme, securityLevel: "strict" });
        }catch(e){}
        // Re-run rendering (Mermaid v10: run, older: init)
        const nodes = Array.from(root.querySelectorAll(".mermaid"));
        nodes.forEach((n) => { if (n.dataset.mermaidSrc) n.textContent = n.dataset.mermaidSrc; });

        if (typeof window.mermaid.run === "function"){
          window.mermaid.run({ nodes });
        }else if (typeof window.mermaid.init === "function"){
          window.mermaid.init(undefined, nodes);
        }
      }
    }catch(e){}
  }

  async function init(){
    const id = getParam("id");
    const back = $("[data-back]");
    if (back) back.href = "index.html#news";

    const titleEl = document.querySelector("[data-post-title]");
    const bodyEl = document.getElementById("postBody");

    if (!id){
      if (titleEl) titleEl.textContent = "Пост не найден";
      if (bodyEl) bodyEl.innerHTML = "<p class=\"small\">Не указан id поста.</p>";
      return;
    }

    let posts = [];
    try{
      const r = await fetch("content/news.json", { cache: "no-store" });
      const data = await r.json();
      posts = Array.isArray(data) ? data : (data.items || []);
    }catch(e){
      if (titleEl) titleEl.textContent = "Ошибка";
      if (bodyEl) bodyEl.innerHTML = "<p class=\"small\">Не удалось загрузить новости.</p>";
      return;
    }

    const post = posts.find((p) => p && p.id === id);
    if (!post){
      if (titleEl) titleEl.textContent = "Пост не найден";
      if (bodyEl) bodyEl.innerHTML = "<p class=\"small\">Такого поста нет в каталоге.</p>";
      return;
    }

    let mdText = "";
    let mdBody = "";
    let mdLoaded = false;
    let meta = post;

    // Load markdown + front matter
    try{
      mdText = await (await fetch(post.file, { cache: "no-store" })).text();
      mdLoaded = true;
      if (window.NewsMeta && typeof window.NewsMeta.parseFrontMatter === "function") {
        const parsed = window.NewsMeta.parseFrontMatter(mdText);
        mdBody = parsed.body;
        if (typeof window.NewsMeta.mergePostMeta === "function") {
          meta = window.NewsMeta.mergePostMeta(post, parsed.meta, parsed.body);
        }
      } else {
        mdBody = mdText;
      }
    }catch(e){
      if (bodyEl) bodyEl.innerHTML = "<p class=\"small\">Не удалось загрузить файл поста.</p>";
    }

    const dateText = meta?.dateDisplay || formatDateDisplay(meta?.date);
    const tags = Array.isArray(meta?.tags) ? meta.tags : [];
    const tagsEl = $("[data-post-tags]");

    // Header
    document.title = (meta?.title ? meta.title + " — " : "") + "dmitrienok.ru";
    if (titleEl) titleEl.textContent = meta?.title || "Пост";
    $("[data-post-date]").textContent = dateText || "";
    if (tagsEl){
      tagsEl.innerHTML = "";
      if (tags.length){
        tagsEl.hidden = false;
        tags.forEach((t) => {
          const span = document.createElement("span");
          span.className = "tag";
          span.textContent = t;
          tagsEl.appendChild(span);
        });
      }else{
        tagsEl.hidden = true;
      }
    }

    // Render markdown
    if (bodyEl && mdLoaded){
      const html = window.marked ? window.marked.parse(mdBody || mdText) : `<pre>${escapeHtml(mdBody || mdText)}</pre>`;
      bodyEl.innerHTML = html;
      enhanceMarkdown(bodyEl);
    }

    // Favorites / Recents (localStorage)
    const store = window.HubStore;
    const storeId = `post:${id}`;
    const metaText = [dateText, ...(tags || [])].filter(Boolean).join(" • ");
    const entry = { id: storeId, title: meta?.title || "Пост", href: window.location.href, kind: "post", meta: metaText };

    try{ store?.addRecent?.(entry); }catch(e){}

    // UI buttons
    const copyBtn = document.querySelector("[data-copy-link]");
    const shareBtn = document.querySelector("[data-share]");
    const favBtn = document.querySelector("[data-fav]");

    if (copyBtn){
      copyBtn.addEventListener("click", async () => {
        const url = window.location.href;
        if (window.copyToClipboard) await window.copyToClipboard(url);
        else {
          try { await navigator.clipboard.writeText(url); } catch {}
        }
      });
    }

    if (shareBtn){
      shareBtn.addEventListener("click", async () => {
        const url = window.location.href;
        const title = post.title || document.title || "dmitrienok.ru";
        const ok = window.nativeShare ? await window.nativeShare({ title, url }) : false;
        if (!ok){
          if (window.copyToClipboard) await window.copyToClipboard(url);
        }
      });
    }

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

    // Re-render Mermaid on theme toggle
    document.addEventListener("theme:changed", () => {
      if (bodyEl) enhanceMarkdown(bodyEl);
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
