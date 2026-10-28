// Color theme: Auto (follow the system setting), Light or Dark. Loaded in <head>, so the chosen theme is set
// before the page is drawn. The choice is kept in this browser only; if storage is blocked, it lasts for this page.
(function () {
  const KEY = "fop-theme";
  const root = document.documentElement;
  const saved = () => { try { return localStorage.getItem(KEY) || "auto"; } catch (e) { return "auto"; } };
  const apply = t => { if (t === "light" || t === "dark") root.setAttribute("data-theme", t); else root.removeAttribute("data-theme"); };
  apply(saved());

  document.addEventListener("DOMContentLoaded", () => {
    const box = document.getElementById("themePick");
    if (!box) return;
    const buttons = box.querySelectorAll("button[data-theme]");
    const mark = t => buttons.forEach(b => b.setAttribute("aria-pressed", String(b.dataset.theme === t)));
    mark(saved());
    buttons.forEach(b => b.addEventListener("click", () => {
      const t = b.dataset.theme;
      try { if (t === "auto") localStorage.removeItem(KEY); else localStorage.setItem(KEY, t); } catch (e) { /* storage blocked */ }
      apply(t); mark(t);
    }));
    box.hidden = false;   // shown only when this script runs
  });
})();
