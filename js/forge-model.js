// Forge of Potential game rules (Valheim 1.0.20): cost parsing, refunds and the upgrade simulation.
// No page code here, so this file can also be loaded and tested without a browser.

const P_SUCCESS = 0.65;

const NO_REFUND = /\(\s*no refund\s*\)\s*$/i;

function parseCosts(text) {
  const rows = [], bad = [];
  text.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return;
    const refund = !NO_REFUND.test(line);
    const m = line.replace(NO_REFUND, "").trim().match(/^(.+?)[\s:]+((?:\d+|[-–])(?:\s*\/\s*(?:\d+|[-–]))*)$/);
    if (!m) { bad.push(i + 1); return; }
    const amounts = m[2].split("/").map(s => { const v = s.trim(); return /^\d+$/.test(v) ? parseInt(v, 10) : 0; });
    rows.push({ name: m[1].replace(/:$/, "").trim(), amounts, refund });
  });
  return { rows, bad };
}

// Amount of one ingredient for quality q (game rule): the wiki column where there is one; above that,
// (q - 1) x per level below Q4, and (4 + (q - 4) / 2) x per level, rounded down, from Q4 on.
function amountAt(r, q) {
  if (q <= r.amounts.length) return r.amounts[q - 1];
  const per = r.amounts[1] || 0;
  return q < 4 ? (q - 1) * per : Math.floor((4 + (q - 4) / 2) * per);
}

// What a break returns of one ingredient when the item was at quality `level`:
// 35% of (base amount + amount of that level), in the game's 32-bit floats, rounded up.
const BREAK_RETURN = Math.fround(0.35);
function backAt(r, level) {
  if (!r.refund) return 0;
  return Math.ceil(Math.fround(Math.fround(amountAt(r, 1) + (level >= 2 ? amountAt(r, level) : 0)) * BREAK_RETURN));
}

// One entry per material. A material can appear on more than one cost line, for example Flametal in an item's
// own recipe (returned on a break) and in the base item it is made from (never returned). Such lines share one
// stock; each line keeps its own refund rule.
function groupByMaterial(rows) {
  const groups = [];
  for (const r of rows) {
    let g = groups.find(x => x.name === r.name);
    if (!g) { g = { name: r.name, rows: [] }; groups.push(g); }
    g.rows.push(r);
  }
  return groups;
}

// What a break returns of one material (all its lines) when the item was at quality `level`.
const backOfMaterial = (g, level) => g.rows.reduce((sum, r) => sum + backAt(r, level), 0);

// Recraft cost to the normal max level, and the lowest refund (a break at the normal max level), per material.
// `recrafts` = how many copies the stock replaces when every copy breaks at that level (a break higher up returns more).
function supply(rows, maxq, have) {
  let recrafts = Infinity;
  const limits = [];
  const list = groupByMaterial(rows).map(g => {
    let craft = 0;
    for (const r of g.rows) for (let q = 1; q <= maxq; q++) craft += amountAt(r, q);
    const back = backOfMaterial(g, maxq);
    const net = craft - back;
    const stock = have[g.name] || 0;
    if (net > 0) {
      const k = Math.floor(stock / net);
      if (k < recrafts) { recrafts = k; limits.length = 0; limits.push(g.name); }
      else if (k === recrafts) limits.push(g.name);
    }
    return { name: g.name, rows: g.rows, craft, back, stock };
  });
  return { list, recrafts, limits };
}

// The material input for simulate(): cost of one new copy, stock on hand and refund per break level, per material.
// `stock` may be lower than the supply's stock, for example after paying for upgrades at the station first.
function simMaterials(sup, lastLevel, stock = sup.list.map(s => s.stock)) {
  return {
    craft: Float64Array.from(sup.list, s => s.craft),
    stock: Float64Array.from(stock, v => Math.max(0, v)),
    back: Array.from({ length: lastLevel + 1 }, (_, level) => Float64Array.from(sup.list, s => backOfMaterial(s, level)))
  };
}

// Game rules since patch 1.0.20, as read from the game code by Forge Oracle and ValheimSaveParser:
// each attempt has a key = hash(item) + target level. The seed is the one the character stored for that key,
// or, if the character never tried that key, hash(character name) + key. The game calls Random.InitState(seed),
// the roll is Random.value, and Random.Range(0, 99999999) is stored as the new seed for that key.
// The attempt succeeds when roll <= 0.65; otherwise the item is destroyed.
// Because first-attempt seeds of consecutive levels are consecutive numbers, those first rolls are linked.

// Unity's xorshift128 after InitState(seed): returns Random.value and sets NEXT_SEED.
let NEXT_SEED = 0;
function unityRoll(seed) {
  const x = seed >>> 0;
  const y = (Math.imul(x, 1812433253) + 1) >>> 0;
  const z = (Math.imul(y, 1812433253) + 1) >>> 0;
  const w = (Math.imul(z, 1812433253) + 1) >>> 0;
  let t = (x ^ (x << 11)) >>> 0;
  const r1 = (w ^ (w >>> 19) ^ t ^ (t >>> 8)) >>> 0;
  t = (y ^ (y << 11)) >>> 0;
  const r2 = (r1 ^ (r1 >>> 19) ^ t ^ (t >>> 8)) >>> 0;
  NEXT_SEED = r2 % 99999999;
  return (r1 & 0x7FFFFF) / 8388607;
}

// Fixed pseudo-random values for the simulated players, so the same inputs always give the same table.
function mix32(h) {
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16; return h >>> 0;
}
const playerBase = i => mix32(Math.imul(i + 1, 0x9e3779b1) ^ 0x2545f491);   // hash(name) + hash(item): unknown, so random
const storedSeed = (i, L) => mix32(Math.imul(i + 1, 0x9e3779b1) ^ Math.imul(L, 0x632be5ab) ^ 0x68e31da4) % 99999999;

const SIM_PLAYERS = 40000;       // simulated players per row
const SIM_MIN_PLAYERS = 4000;    // fewer only when a row would take too long
const SIM_BUDGET = 3000000;      // attempts per row before stopping early
const SIM_HARD_BUDGET = 4000000; // attempts per row, never more (extreme inputs)
const SIM_MAX_ATTEMPTS = 20000;  // attempts per simulated player, never more

// Chance for one plan: start at level `start`, aim for `target`, then stop.
// n = normal max level (a recrafted copy comes back at n), idols = number or null (no limit),
// mats = { craft: cost of one new copy at level n, stock: materials on hand, back: back[level] = refund per material },
// all per material in the same order. safe = never attempt when a break could not be recrafted,
// triedUpTo = highest level this character already attempted for this item (0 = never).
// Returns [reach, loseItem, keepBelow, idolsUsedAvg, playersSimulated].
function simulate(n, start, target, idols, mats, safe, triedUpTo) {
  if (start >= target) return [1, 0, 0, 0, 0];
  const maxIdols = idols === null ? Infinity : idols;
  const M = mats.craft.length, s = new Float64Array(M);
  const canReplace = level => {
    const back = mats.back[level];
    for (let m = 0; m < M; m++) if (s[m] + back[m] < mats.craft[m]) return false;
    return true;
  };
  const seeds = new Uint32Array(target + 1), used = new Uint8Array(target + 1);
  let reach = 0, lose = 0, keep = 0, spentAll = 0, players = 0;
  for (let i = 0; i < SIM_PLAYERS; i++) {
    if ((spentAll > SIM_BUDGET && i >= SIM_MIN_PLAYERS) || spentAll > SIM_HARD_BUDGET) break;
    const base = playerBase(i);
    for (let L = n + 1; L <= target; L++) {
      used[L] = L <= triedUpTo ? 1 : 0;
      if (used[L]) seeds[L] = storedSeed(i, L);
    }
    s.set(mats.stock);
    let level = start, spent = 0;
    for (;;) {
      if (level >= target) { reach++; break; }
      if (spent >= maxIdols || spent >= SIM_MAX_ATTEMPTS || (safe && !canReplace(level))) { keep++; break; }
      const L = level + 1;
      const roll = unityRoll(used[L] ? seeds[L] : (base + L) >>> 0);
      seeds[L] = NEXT_SEED; used[L] = 1; spent++;
      if (roll <= P_SUCCESS) { level = L; continue; }
      if (!canReplace(level)) { lose++; break; }        // the break's refund is not enough for a new copy
      const back = mats.back[level];
      for (let m = 0; m < M; m++) s[m] += back[m] - mats.craft[m];
      level = n;                                        // a new copy, upgraded at the station to the normal max
    }
    spentAll += spent; players++;
  }
  return [reach / players, lose / players, keep / players, spentAll / players, players];
}

// For tests run outside the browser (Node.js). Browsers ignore this line.
if (typeof module !== "undefined") {
  module.exports = { P_SUCCESS, parseCosts, amountAt, backAt, supply, simMaterials, unityRoll, nextSeed: () => NEXT_SEED, simulate };
}
