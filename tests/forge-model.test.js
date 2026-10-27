// Tests for js/forge-model.js and js/items.js. Run from the repository root with:
//   node --test tests/
// Needs Node.js 18 or newer and no npm packages.
//
// The expected values come from real game results (Valheim 1.0.20), not from this code:
//  - the Unity random generator values match the published reference implementations,
//  - the CHATU replay is a test character's real Forge attempts, read from its save file,
//  - the hammer refunds were counted in game after real breaks.
// If a test fails after a game patch, check the game first; only then change the expected values.

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const model = require("../js/forge-model.js");
const { ITEMS, ITEM_TYPES, biomeOf } = new Function(
  fs.readFileSync(path.join(__dirname, "../js/items.js"), "utf8") + "; return { ITEMS, ITEM_TYPES, biomeOf };")();

// Valheim's string hash (GetStableHashCode). Used only here, to rebuild the test character's first seeds;
// the app itself never uses character names.
function stableHash(s) {
  let n = 5381, n2 = 5381;
  for (let i = 0; i < s.length; i += 2) {
    n = ((Math.imul(n, 33) >>> 0) ^ s.charCodeAt(i)) >>> 0;
    if (i === s.length - 1) break;
    n2 = ((Math.imul(n2, 33) >>> 0) ^ s.charCodeAt(i + 1)) >>> 0;
  }
  return (n + Math.imul(n2, 1566083941)) >>> 0;
}

test("Unity random generator: roll and stored seed for known seeds", () => {
  const cases = [
    [0, 0.5841396551298684, 725065],
    [1, 0.9996846913915505, 46916641],
    [12345, 0.5868507131160156, 73367792],
    [4294967295, 0.1692056857592685, 51848286],
    [99999998, 0.4881295547639793, 36431007],
    [2718281828, 0.24617066933759085, 66282344]
  ];
  for (const [seed, roll, next] of cases) {
    assert.equal(model.unityRoll(seed), roll, `roll for seed ${seed}`);
    assert.equal(model.nextSeed(), next, `stored seed after seed ${seed}`);
  }
});

test("Real game test: the CHATU character's hammer attempts replay exactly", () => {
  // From the character's save file after the tests: target level -> results in order (S = success, F = break)
  // and the seed the game stored after the last attempt.
  const recorded = {
    4: ["SFSSFSSFSFFSSSSFSSFSSS", 66026409],
    5: ["SFFSSFSSFSFSSSF", 30273810],
    6: ["FFFFFFSFS", 5851278],
    7: ["S", 24409505],
    8: ["F", 87294576]
  };
  const base = (stableHash("CHATU") + stableHash("Hammer")) >>> 0;
  for (const [level, [results, storedSeed]] of Object.entries(recorded)) {
    let seed = (base + Number(level)) >>> 0;
    let got = "";
    for (let i = 0; i < results.length; i++) {
      got += model.unityRoll(seed) <= model.P_SUCCESS ? "S" : "F";
      seed = model.nextSeed();
    }
    assert.equal(got, results, `results at Q${level}`);
    assert.equal(seed, storedSeed, `stored seed at Q${level}`);
  }
});

test("Refund on a break: hammer, counted in game", () => {
  const hammer = model.parseCosts("Wood: 3/1/2\nStone: 2/1/2").rows;
  const counted = { 3: [2, 2], 4: [3, 3], 5: [3, 3], 7: [3, 3] };   // level the hammer had -> wood, stone returned
  for (const [level, expected] of Object.entries(counted)) {
    assert.deepEqual(hammer.map(r => model.backAt(r, Number(level))), expected, `hammer broke at Q${level}`);
  }
});

test("Refund on a break: Spinesnap, from the game data", () => {
  const spinesnap = model.parseCosts("Finewood: 10/5/10/20\nBone Fragments: 40/20/40/80\nRefined Eitr: 10/-/-/-").rows;
  assert.deepEqual(spinesnap.map(r => model.backAt(r, 4)), [11, 42, 4]);
  assert.deepEqual(spinesnap.map(r => model.backAt(r, 5)), [12, 46, 4]);
  assert.deepEqual(spinesnap.map(r => model.backAt(r, 6)), [13, 49, 4]);
});

test("Ingredients marked (no refund) are never returned", () => {
  const rows = model.parseCosts("Bloodgold: 20/10/20/40\nLiquid Frost: 5/-/-/- (no refund)").rows;
  assert.equal(rows[1].name, "Liquid Frost");
  assert.equal(rows[1].refund, false);
  assert.equal(model.backAt(rows[1], 3), 0);
  assert.equal(model.backAt(rows[0], 3), 14);
});

test("First attempts at consecutive levels are linked: a fresh seed almost never gives 5 successes in a row", () => {
  // Independent 65% rolls would give 5 in a row 11.6% of the time; the game's first rolls give about 0.03%.
  let five = 0;
  const N = 200000;
  for (let i = 0; i < N; i++) {
    const base = Math.imul(i + 1, 2654435761) >>> 0;
    let run = 0;
    while (run < 5 && model.unityRoll((base + run) >>> 0) <= model.P_SUCCESS) run++;
    if (run === 5) five++;
  }
  assert.ok(five / N < 0.002, `share with 5 successes in a row: ${five / N}`);
});

test("Simulation: Spinesnap example gives the published numbers and the same result every time", () => {
  const rows = model.parseCosts("Finewood: 10/5/10/20\nBone Fragments: 40/20/40/80\nRefined Eitr: 10/-/-/-").rows;
  const sup = model.supply(rows, 4, { "Finewood": 200, "Bone Fragments": 1000, "Refined Eitr": 100 });
  assert.equal(sup.recrafts, 5);
  const mats = {
    craft: Float64Array.from(sup.list, s => s.craft),
    stock: Float64Array.from(sup.list, s => s.stock),
    back: Array.from({ length: 13 }, (_, level) => Float64Array.from(rows, r => model.backAt(r, level)))
  };
  const q6 = model.simulate(4, 4, 6, 15, mats, false, 0);
  assert.deepEqual(q6, [0.974475, 0.025525, 0, 3.8074, 40000]);
  assert.deepEqual(model.simulate(4, 4, 6, 15, mats, false, 0), q6);
  const q10 = model.simulate(4, 4, 10, 15, mats, false, 0);
  assert.deepEqual(q10, [0.220275, 0.2492, 0.530525, 13.6214, 40000]);
});

test("Every item preset can be read", () => {
  for (const it of ITEMS) {
    assert.ok(ITEM_TYPES.includes(it.type), `${it.name}: unknown type "${it.type}"`);
    assert.notEqual(biomeOf(it), "", `${it.name}: no biome for idol "${it.idol}"`);
    const { rows, bad } = model.parseCosts(it.costs);
    assert.deepEqual(bad, [], `${it.name}: unreadable cost lines`);
    assert.ok(rows.length > 0, `${it.name}: no ingredients`);
    for (const r of rows) assert.ok(r.amounts.length >= it.maxq, `${it.name}: ${r.name} has no amount for Q${it.maxq}`);
  }
});
