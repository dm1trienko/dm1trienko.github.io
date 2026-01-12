/* Simple tabs for static pages
   Markup:
   <div class="tabset" data-tabs="name" data-default-tab="id">
     <div class="tabs">
       <button class="tab-btn" data-tab="id">...</button>
     </div>
     <div class="tab-panel" data-panel="id">...</div>
   </div>
*/

function initTabsets() {
  const sets = Array.from(document.querySelectorAll("[data-tabs]"));
  sets.forEach(set => {
    // IMPORTANT: support nested tabsets.
    // We only take buttons/panels that belong to this конкретный tabset.
    // Otherwise the outer tabset would accidentally grab inner tab buttons.
    const buttons = Array.from(set.querySelectorAll(".tab-btn[data-tab]"))
      .filter(btn => btn.closest("[data-tabs]") === set);
    const panels = Array.from(set.querySelectorAll(".tab-panel[data-panel]"))
      .filter(p => p.closest("[data-tabs]") === set);
    if (!buttons.length || !panels.length) return;

    const defaultTab = set.getAttribute("data-default-tab") || buttons[0].dataset.tab;

    const show = (tabId) => {
      buttons.forEach(btn => {
        const active = btn.dataset.tab === tabId;
        btn.classList.toggle("active", active);
        btn.setAttribute("aria-selected", active ? "true" : "false");
      });
      panels.forEach(p => {
        const active = p.dataset.panel === tabId;
        p.classList.toggle("active", active);
        p.hidden = !active;
      });
      set.dispatchEvent(new CustomEvent("tabs:change", { detail: { tab: tabId } }));
    };

    // Store handle for programmatic control
    set._showTab = show;

    // a11y roles
    const tabsRow = set.querySelector(".tabs");
    if (tabsRow) tabsRow.setAttribute("role", "tablist");
    buttons.forEach(btn => btn.setAttribute("role", "tab"));
    panels.forEach(p => p.setAttribute("role", "tabpanel"));

    buttons.forEach(btn => {
      btn.addEventListener("click", () => show(btn.dataset.tab));
    });

    show(defaultTab);
  });

  // Global helper
  window.showTab = (tabsetName, tabId) => {
    const set = document.querySelector(`[data-tabs="${tabsetName}"]`);
    if (set && typeof set._showTab === "function") set._showTab(tabId);
  };
}

document.addEventListener("DOMContentLoaded", initTabsets);
