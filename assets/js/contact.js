/* Contact / Feedback
   - Embeds a form (Yandex Forms recommended) from content/site.json
   - No backend required
*/

(function(){
  function getTheme(){
    try{
      if (typeof window.getEffectiveTheme === "function") return window.getEffectiveTheme();
    }catch(e){}
    try{
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    }catch(e){}
    return "dark";
  }

  function safeUrl(u){
    if (!u) return "";
    const s = String(u).trim();
    if (/^https?:\/\//i.test(s) || /^mailto:/i.test(s) || /^tel:/i.test(s) || s.startsWith("#")) return s;
    return s;
  }

  function loadScriptOnce(src){
    return new Promise((resolve) => {
      if (!src) return resolve(false);
      let esc = src;
      try{
        if (window.CSS && typeof window.CSS.escape === "function") esc = window.CSS.escape(src);
      }catch(e){}
      const existing = document.querySelector(`script[data-embed-src="${esc}"]`);
      if (existing) return resolve(true);

      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.setAttribute("data-embed-src", src);
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.head.appendChild(s);
    });
  }

  function themedEmbedUrl(rawUrl, provider){
    const u = safeUrl(rawUrl);
    if (!u) return "";

    // Prefer the centralized SmartLink helper if present.
    try{
      if (window.SmartLink && typeof window.SmartLink.toEmbedUrl === "function") {
        // SmartLink.toEmbedUrl may already add provider-specific params.
        const emb = window.SmartLink.toEmbedUrl(u, "form");
        return emb || u;
      }
    }catch(e){}

    const isYandex = (provider || "").toLowerCase().includes("yandex") || /forms\.yandex\./i.test(u);
    if (!isYandex) return u;

    // Fallback: add required Yandex embed params.
    try{
      const url = new URL(u);
      url.searchParams.set("iframe", "1");
      url.searchParams.set("theme", getTheme());
      return url.toString();
    }catch(e){
      return u;
    }
  }

  function renderForm(embedCfg){
    const host = document.getElementById("contactEmbed");
    const status = document.getElementById("contactStatus");
    if (!host) return;

    const cfg = embedCfg || {};
    const provider = (cfg.provider || "").toLowerCase();
    const baseUrl = safeUrl(cfg.iframe || cfg.iframeUrl || "");
    const scriptUrl = safeUrl(cfg.script || "");

    if (!baseUrl){
      host.innerHTML = `<div class="notice">Форма пока не настроена. Напиши в Telegram или на почту (кнопки слева).</div>`;
      if (status) status.textContent = "Форма пока не настроена.";
      return;
    }

    // Optional provider script (Yandex Forms can auto-resize if embed.js is present)
    if (scriptUrl){
      loadScriptOnce(scriptUrl);
    }

    host.innerHTML = "";

    const iframe = document.createElement("iframe");
    iframe.dataset.baseSrc = baseUrl;
    iframe.src = themedEmbedUrl(baseUrl, provider);
    iframe.name = cfg.name || "embedded-form";
    iframe.setAttribute("frameborder", "0");
    iframe.setAttribute("loading", "lazy");
    iframe.setAttribute("referrerpolicy", "no-referrer-when-downgrade");
    // Keep a marker class for provider-specific styling (and future expansion).
    iframe.className = (provider.includes("yandex") || /forms\.yandex\./i.test(baseUrl))
      ? "embed-iframe embed-light"
      : "embed-iframe";

    host.appendChild(iframe);

    // Keep the embedded theme in sync with the site theme.
    // (Yandex Forms supports theme=dark/light in the iframe URL.)
    document.addEventListener("theme:changed", () => {
      try{
        const base = iframe.dataset.baseSrc || baseUrl;
        const next = themedEmbedUrl(base, provider);
        if (next && iframe.src !== next) iframe.src = next;
      }catch(e){}
    });

    if (status) status.textContent = "Можно написать через форму ниже.";
  }

  function onSiteCfgReady(cfg){
    try{
      const formCfg = cfg?.contact?.form;
      renderForm(formCfg);
    }catch(e){
      console.warn(e);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    // If config is already loaded (main.js sets window.SITE_CFG), render immediately
    if (window.SITE_CFG) onSiteCfgReady(window.SITE_CFG);

    // Also listen for async config load
    document.addEventListener("sitecfg:ready", (ev) => {
      onSiteCfgReady(ev.detail || {});
    });
  });
})();
