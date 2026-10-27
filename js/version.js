// Shows the version number in the footer of both pages (the element with id="appVersion").
// The version number is kept in one place: the VERSION file next to index.html (Semantic Versioning, e.g. 0.3.0-beta).
// Browsers do not let a page opened from disk (file://) read other files, so the footer then says "(local copy)".
(async function loadVersion() {
  const out = document.getElementById("appVersion");
  if (!out) return;
  try {
    const res = await fetch("VERSION", { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const version = (await res.text()).trim();
    if (!/^[0-9A-Za-z.+-]{1,40}$/.test(version)) throw new Error("unexpected VERSION content");
    out.textContent = version;
  } catch (e) {
    out.textContent = location.protocol === "file:" ? "(local copy)" : "";
  }
})();
