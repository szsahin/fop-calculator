// Short addresses on the live site (GitHub Pages): "guide" instead of "guide.html", and the folder instead of "index.html".
// GitHub Pages serves guide.html for "guide", but a page opened from disk or from a simple local server does not,
// so the files keep ".html" in their links and this script changes them only on github.io.
(function () {
  if (!location.hostname.endsWith(".github.io")) return;
  const short = name => (name === "index" ? "./" : name);

  // Address bar: guide.html -> guide, index.html -> folder. The folder stays the same, so relative files still load.
  const m = location.pathname.match(/^(.*\/)([\w-]+)\.html$/);
  if (m) history.replaceState(null, "", m[1] + (m[2] === "index" ? "" : m[2]) + location.search + location.hash);

  // Links between the pages, keeping any #anchor.
  document.querySelectorAll("a[href]").forEach(a => {
    const h = a.getAttribute("href").match(/^([\w-]+)\.html(#.*)?$/);
    if (h) a.setAttribute("href", short(h[1]) + (h[2] || ""));
  });
})();
