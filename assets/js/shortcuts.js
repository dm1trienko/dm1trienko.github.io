/* Keyboard shortcuts
   - Ctrl/Cmd + K : command palette (navigation + search + actions)
   - /            : command palette (quick open)
   Fallback (if palette is not loaded): focus section search on the main page
*/

function isTypingTarget(el){
  if (!el) return false;
  const tag = (el.tagName || "").toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (el.isContentEditable) return true;
  return false;
}

function getActiveMainTab(){
  const set = document.querySelector('[data-tabs="main"]');
  if (!set) return "home";
  return set.querySelector('.tab-btn.active[data-tab]')?.dataset.tab || "home";
}

function focusSearchForTab(tabId){
  const map = {
    materials: "searchQ",
    schedules: "schedQ",
    polls: "pollsQ",
    calculator: "calcQ",
  };
  const id = map[tabId];
  if (!id) return false;
  const el = document.getElementById(id);
  if (!el) return false;
  el.focus();
  if (typeof el.select === "function") {
    try{ el.select(); }catch{}
  }
  return true;
}

function focusSearch(){
  // Only makes sense on the main hub page.
  if (!document.querySelector('[data-tabs="main"]')) return;

  const tab = getActiveMainTab();
  if (!focusSearchForTab(tab)) {
    if (window.showTab) {
      window.showTab("main", "materials");
      window.showTab("materials", "search");
    }
    setTimeout(() => focusSearchForTab("materials"), 0);
  }
}

document.addEventListener("keydown", (e) => {
  const mod = e.ctrlKey || e.metaKey;
  const key = (e.key || "");

  // Ctrl/Cmd+K
  if (mod && (key === "k" || key === "K")) {
    e.preventDefault();
    if (window.cmdkOpen) window.cmdkOpen("");
    else focusSearch();
    return;
  }

  // Slash (quick open) — don't hijack while typing
  if (!mod && key === "/" && !isTypingTarget(e.target)) {
    e.preventDefault();
    if (window.cmdkOpen) window.cmdkOpen("");
    else focusSearch();
  }
});
