/* Router for top-level tabs on index.html
   - Keeps URL hash in sync: #home, #materials, #schedules, ...
   - Allows deep links from viewer/post pages back to a specific tab.
*/

function normalizeHash(h) {
  return (h || "").replace(/^#/, "").trim();
}

function getMainTabIds() {
  const set = document.querySelector('[data-tabs="main"]');
  if (!set) return [];
  return Array.from(set.querySelectorAll('.tab-btn[data-tab]'))
    .filter(btn => btn.closest('[data-tabs]') === set)
    .map(btn => btn.dataset.tab)
    .filter(Boolean);
}

function setHashSilently(tabId) {
  try {
    const url = new URL(window.location.href);
    url.hash = tabId ? `#${encodeURIComponent(tabId)}` : "";
    history.replaceState(null, "", url.toString());
  } catch {
    // Fallback (may scroll)
    window.location.hash = tabId;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const mainSet = document.querySelector('[data-tabs="main"]');
  if (!mainSet) return;

  const allowed = new Set(getMainTabIds());

  const applyFromHash = () => {
    const raw = normalizeHash(window.location.hash);
    const tabId = decodeURIComponent(raw || "");

    if (tabId && allowed.has(tabId) && window.showTab) {
      window.showTab("main", tabId);
      return true;
    }
    return false;
  };

  // If user came with query params but without a hash, open the most relevant tab.
  try {
    const params = new URL(window.location.href).searchParams;
    const hasCalc = !!params.get("calc");
    const hasResourceFilters = !!(params.get("sem") || params.get("sub") || params.get("type") || params.get("q"));
    if (!window.location.hash && hasCalc && allowed.has("calculator") && window.showTab) {
      window.showTab("main", "calculator");
      setHashSilently("calculator");
    } else if (!window.location.hash && hasResourceFilters && allowed.has("materials") && window.showTab) {
      window.showTab("main", "materials");
      setHashSilently("materials");
    }
  } catch {}

  // Apply hash on first load
  const applied = applyFromHash();
  if (!applied) {
    // No hash — keep it consistent with the active tab (default)
    const active = mainSet.querySelector('.tab-btn.active[data-tab]')?.dataset.tab;
    if (active) setHashSilently(active);
  }

  // React to manual hash changes
  window.addEventListener("hashchange", () => {
    applyFromHash();
  });

  // Keep hash in sync when user clicks tabs
  mainSet.addEventListener("tabs:change", (ev) => {
    const tabId = ev?.detail?.tab;
    if (!tabId || !allowed.has(tabId)) return;
    setHashSilently(tabId);
    // Optional: scroll to top of page on tab change
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});
