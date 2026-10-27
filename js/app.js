// Calculator page: reads the inputs, runs the simulation (forge-model.js) for each level and shows the results.
// Needs items.js and forge-model.js to be loaded first.

// Starting state: the example from the conversation.
const START = { item: "Spinesnap", cur: 4, want: 6, tried: "", idols: 15, rule: "go",
  have: { "Finewood": 200, "Bone Fragments": 1000, "Refined Eitr": 100 } };

// ---------- PAGE ----------
const $ = id => document.getElementById(id);
const els = { item: $("item"), info: $("itemInfo"), recipe: $("recipe"), maxq: $("maxq"), cur: $("cur"), want: $("want"),
  tried: $("tried"), idols: $("idols"), mats: $("mats"), msg: $("msg"), target: $("target"), supply: $("supply"), rows: $("rows") };
const have = Object.assign({}, START.have);

const pct = v => {
  const x = v * 100;
  if (x > 0 && x < 0.1) return "<0.1%";
  if (x < 100 && x > 99.9) return ">99.9%";
  return x.toFixed(1) + "%";
};
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const slug = s => "mat-" + s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const intOr = (el, d) => { const v = parseInt(el.value, 10); return Number.isFinite(v) ? v : d; };

ITEMS.forEach((it, i) => {
  let group = els.item.lastElementChild;
  if (!group || group.label !== it.group) {
    group = document.createElement("optgroup"); group.label = it.group; els.item.appendChild(group);
  }
  const o = document.createElement("option"); o.value = i; o.textContent = it.name; group.appendChild(o);
});

function showItemInfo() {
  const it = ITEMS[+els.item.value];
  const parts = [];
  if (it.station) parts.push("Station: " + it.station);
  if (it.idol) parts.push("Idol: " + it.idol);
  if (!it.idol) parts.push("Use the idol of the item's tier, as listed on its wiki page.");
  els.info.textContent = parts.join(" · ") + (it.note ? " " + it.note : "");
}

function loadItem(i, keepLevels) {
  const it = ITEMS[i];
  els.recipe.value = it.costs;
  els.maxq.value = it.maxq;
  if (!keepLevels) els.cur.value = it.maxq;
  showItemInfo();
}

function syncMats(rows) {
  const names = rows.map(r => r.name);
  const current = Array.from(els.mats.children).map(c => c.dataset.name);
  if (names.join("\n") === current.join("\n")) return;
  els.mats.innerHTML = "";
  names.forEach(name => {
    const row = document.createElement("div");
    row.className = "mat"; row.dataset.name = name;
    const id = slug(name);
    row.innerHTML = `<label for="${id}">${esc(name)}</label><input id="${id}" type="number" min="0" step="1" value="${have[name] || 0}">`;
    row.querySelector("input").addEventListener("input", e => { have[name] = Math.max(0, parseInt(e.target.value, 10) || 0); schedule(); });
    els.mats.appendChild(row);
  });
}

function showError(text) {
  els.msg.textContent = text; els.msg.hidden = false;
  els.target.hidden = true; els.supply.hidden = true; els.rows.innerHTML = "";
}

function render() {
  const { rows, bad } = parseCosts(els.recipe.value);
  syncMats(rows);
  if (bad.length) return showError(`Line ${bad.join(", ")} of the costs could not be read. Write each line as a name and amounts, for example "Finewood: 10/5/10/20".`);
  if (!rows.length) return showError("Enter the item's cost per quality level, one material per line, as shown on its wiki page.");

  const maxq = Math.min(10, Math.max(1, intOr(els.maxq, 4)));
  const cur = Math.max(1, intOr(els.cur, maxq));
  const wantRaw = intOr(els.want, null);
  const want = wantRaw !== null && wantRaw > Math.max(cur, maxq) ? wantRaw : null;
  const idolsRaw = els.idols.value.trim();
  const idols = idolsRaw === "" ? null : Math.min(500, Math.max(0, parseInt(idolsRaw, 10) || 0));
  const tried = Math.max(0, intOr(els.tried, 0));
  const safe = document.querySelector('input[name="rule"]:checked').value === "safe";
  const name = ITEMS[+els.item.value].costs === els.recipe.value ? ITEMS[+els.item.value].name : "this item";

  // Bring the item to the normal max level first, at its normal station.
  const stock = Object.assign({}, have);
  let pre = [];
  if (cur < maxq) {
    const short = [];
    rows.forEach(r => {
      let need = 0;
      for (let q = cur + 1; q <= maxq; q++) need += r.amounts[q - 1] || 0;
      if (need > 0) { pre.push(`${r.name} ${need}`); stock[r.name] = (stock[r.name] || 0) - need; if (stock[r.name] < 0) short.push(r.name); }
    });
    if (short.length) return showError(`Upgrading from Q${cur} to Q${maxq} needs more ${short.join(", ")} than you have. The Forge of Potential starts at the normal max level.`);
  }
  const start = Math.max(cur, maxq);
  const sup = supply(rows, maxq, stock);

  els.msg.hidden = true; els.target.hidden = false; els.supply.hidden = false;

  // Table
  const last = Math.min(start + 30, Math.max(want || 0, start + 8));
  const results = [];
  const mats = {
    craft: Float64Array.from(sup.list, s => s.craft),
    stock: Float64Array.from(sup.list, s => Math.max(0, s.stock)),
    back: Array.from({ length: last + 1 }, (_, level) => Float64Array.from(rows, r => backAt(r, level)))
  };
  for (let t = start + 1; t <= last; t++) results.push([t, simulate(maxq, start, t, idols, mats, safe, tried)]);
  const fewest = Math.min(...results.map(([, r]) => r[4]));
  const margin = (1.96 * Math.sqrt(0.25 / fewest) * 100).toFixed(1);
  $("simNote").textContent = `Each row plays out the game's rules for ${fewest.toLocaleString("en-US")} simulated players. A number can differ from the exact value by up to about ${margin} percentage points.`;
  els.rows.innerHTML = results.map(([t, r]) => `
    <tr class="${t === want ? "wanted" : ""}">
      <td class="lvl">Q${t}${t === want ? '<span class="tag">Wanted</span>' : ""}</td>
      <td class="n">${pct(r[0])}</td>
      <td><div class="bar" role="img" aria-label="Reach ${pct(r[0])}, keep below ${pct(r[2])}, lose ${pct(r[1])}"><span class="r" style="width:${(r[0] * 100).toFixed(2)}%"></span><span class="k" style="width:${(r[2] * 100).toFixed(2)}%"></span><span class="l" style="width:${(r[1] * 100).toFixed(2)}%"></span></div></td>
      <td class="n">${pct(r[1])}</td>
      <td class="n">${pct(r[2])}</td>
      <td class="n">${r[3].toFixed(1)}</td>
    </tr>`).join("");

  // Target summary
  const focus = want ? results.find(([t]) => t === want) : results[0];
  const [ft, fr] = focus;
  els.target.innerHTML = `
    <div>
      <div class="big">${pct(fr[0])}</div>
      <div class="caption">Chance to reach Q${ft}${want ? "" : " (next level)"}</div>
    </div>
    <div class="stats">
      <div class="stat"><b>${pct(fr[1])}</b><span>Lose the item</span></div>
      <div class="stat"><b>${pct(fr[2])}</b><span>Keep an item below Q${ft}</span></div>
      <div class="stat"><b>${fr[3].toFixed(1)}</b><span>Idols used on average${idols === null ? "" : ` (of ${idols})`}</span></div>
    </div>`;

  // Supply summary
  const list = items => items.map(s => `${esc(s)}`).join(" · ");
  const recraftText = sup.recrafts === Infinity
    ? "No limit. The refund covers the full recraft cost."
    : sup.recrafts === 0
    ? `Not even once if the copy breaks at Q${maxq}. A break at a higher level returns a little more.`
    : `At least <span class="strong num">${sup.recrafts}</span> ${sup.recrafts === 1 ? "time" : "times"}. ${esc(sup.limits.join(" and "))} ${sup.limits.length > 1 ? "run" : "runs"} out first. A break at a higher level returns a little more.`;
  els.supply.innerHTML = `
    ${pre.length ? `<dt>First, Q${cur} → Q${maxq}</dt><dd class="num">${list(pre)}</dd>` : ""}
    <dt>Recraft to Q${maxq}</dt><dd class="num">${list(sup.list.filter(s => s.craft > 0).map(s => `${s.name} ${s.craft}`))}</dd>
    <dt>Back on a break at Q${maxq}</dt><dd class="num">${list(sup.list.filter(s => s.back > 0).map(s => `${s.name} ${s.back}`)) || "Nothing"}</dd>
    <dt>You can recraft ${esc(name)}</dt><dd>${recraftText}</dd>`;
}

let pending = 0;
function schedule() { if (!pending) pending = requestAnimationFrame(() => { pending = 0; render(); }); }

els.item.addEventListener("change", () => { loadItem(+els.item.value, false); schedule(); });
["recipe", "maxq", "cur", "want", "tried", "idols"].forEach(id => els[id].addEventListener("input", schedule));
document.querySelectorAll('input[name="rule"]').forEach(r => r.addEventListener("change", schedule));
$("bench").addEventListener("submit", e => e.preventDefault());

// Initial state
els.item.value = String(ITEMS.findIndex(it => it.name === START.item));
loadItem(+els.item.value, true);
els.cur.value = START.cur; els.want.value = START.want; els.tried.value = START.tried; els.idols.value = START.idols;
document.querySelector(`input[name="rule"][value="${START.rule}"]`).checked = true;
render();
