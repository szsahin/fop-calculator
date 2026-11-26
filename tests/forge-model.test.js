// Tests for js/forge-model.js, the rule files in js/rules/ and js/items.js. Run from the repository root with:
//   node --test tests/
// Needs Node.js 18 or newer and no npm packages.
//
// The expected values do not come from this code:
//  - the Unity random generator values match the published reference implementations,
//  - Valheim 1.0.20: the CHATU replay is a test character's real Forge attempts, read from its save file, and the
//    hammer refunds were counted in game after real breaks,
//  - Valheim 1.0.30: the refunds come from ValheimSaveParser's code for 1.0.30 (not yet checked in game).
// If a test fails after a game patch, check the game first; only then change the expected values. New game
// behaviour goes into a new rule file with its own tests; the tests of older rule files stay as they are.

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const model = require("../js/forge-model.js");
const R20 = require("../js/rules/valheim-1.0.20.js");
const R30 = require("../js/rules/valheim-1.0.30.js");
const RULE_FILES = fs.readdirSync(path.join(__dirname, "../js/rules")).filter(f => f.endsWith(".js"));
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
      got += model.unityRoll(seed) <= R20.successChance ? "S" : "F";
      seed = model.nextSeed();
    }
    assert.equal(got, results, `results at Q${level}`);
    assert.equal(seed, storedSeed, `stored seed at Q${level}`);
  }
});

test("1.0.20 refund on a break: hammer, counted in game", () => {
  const hammer = model.parseCosts("Wood: 3/1/2\nStone: 2/1/2").rows;
  const counted = { 3: [2, 2], 4: [3, 3], 5: [3, 3], 7: [3, 3] };   // level the hammer had -> wood, stone returned
  for (const [level, expected] of Object.entries(counted)) {
    assert.deepEqual(hammer.map(r => model.backAt(r, Number(level), R20)), expected, `hammer broke at Q${level}`);
  }
});

test("1.0.20 refund on a break: Spinesnap, from the game data", () => {
  const spinesnap = model.parseCosts("Finewood: 10/5/10/20\nBone Fragments: 40/20/40/80\nRefined Eitr: 10/-/-/-").rows;
  assert.deepEqual(spinesnap.map(r => model.backAt(r, 4, R20)), [11, 42, 4]);
  assert.deepEqual(spinesnap.map(r => model.backAt(r, 5, R20)), [12, 46, 4]);
  assert.deepEqual(spinesnap.map(r => model.backAt(r, 6, R20)), [13, 49, 4]);
});

test("1.0.30 refund on a break: hammer and Spinesnap, as ValheimSaveParser's 1.0.30 code gives them", () => {
  // Level the item had: 3, 4, 5, 6, 7. A break at a high level can return more than a new copy costs, because the
  // refund counts the upgrade amounts of every level, also those reached at the Forge with idols only.
  const hammer = model.parseCosts("Wood: 3/1/2\nStone: 2/1/2").rows;
  const spinesnap = model.parseCosts("Finewood: 10/5/10/20\nBone Fragments: 40/20/40/80\nRefined Eitr: 10/-/-/-").rows;
  const at = (rows, levels) => rows.map(r => levels.map(L => model.backAt(r, L, R30)));
  assert.deepEqual(at(hammer, [3, 4, 5, 6, 7]), [[4, 6, 9, 12, 16], [3, 6, 8, 12, 15]]);
  assert.deepEqual(at(spinesnap, [3, 4, 5, 6, 7]), [[16, 29, 44, 60, 77], [65, 117, 176, 240, 312], [6, 6, 6, 6, 6]]);
});

test("A single trophy always comes back, in every rule set", () => {
  // Fenris Hood (1 Cultist Trophy), Headdress of the Bear (1 Bear Trophy): checked in game for 1.0.20.
  const trophy = model.parseCosts("Bear Trophy: 1/-/-/-").rows[0];
  for (const rules of [R20, R30]) {
    for (let level = 1; level <= 12; level++) assert.equal(model.backAt(trophy, level, rules), 1, `${rules.id}, Q${level}`);
  }
});

test("Ingredients marked (no refund) are never returned", () => {
  const rows = model.parseCosts("Bloodgold: 20/10/20/40\nLiquid Frost: 5/-/-/- (no refund)").rows;
  assert.equal(rows[1].name, "Liquid Frost");
  assert.equal(rows[1].refund, false);
  for (const rules of [R20, R30]) assert.equal(model.backAt(rows[1], 3, rules), 0, rules.id);
  assert.equal(model.backAt(rows[0], 3, R20), 14);
  assert.equal(model.backAt(rows[0], 3, R30), 32);                           // 0.65 x (20 + 10 + 20) = 32.5: half to even
});

test("A material on two lines shares one stock, and each line keeps its own refund rule", () => {
  // Like an item made from another item: Flametal in its own recipe (returned) and in the base item (never returned).
  const rows = model.parseCosts("Flametal: 5/5/10/20\nCharred Bone: 15/-/-/- (no refund)\nFlametal: 24/-/-/- (no refund)").rows;
  const sup = model.supply(rows, 3, { "Flametal": 100, "Charred Bone": 40 }, R20);
  assert.deepEqual(sup.list.map(s => s.name), ["Flametal", "Charred Bone"]);
  const flametal = sup.list[0];
  assert.equal(flametal.craft, 5 + 5 + 10 + 24);                          // both lines, up to Q3
  assert.equal(flametal.back, Math.ceil(0.35 * (5 + 10)));                 // only the own-recipe line returns
  assert.equal(sup.list[1].back, 0);
  assert.equal(sup.recrafts, Math.min(Math.floor(100 / (44 - 6)), Math.floor(40 / 15)));
  const mats = model.simMaterials(sup, 6);
  assert.deepEqual(Array.from(mats.craft), [44, 15]);
  assert.deepEqual(Array.from(mats.back[5]), [Math.ceil(0.35 * (5 + 22)), 0]);   // Q5 cost: floor(4.5 x 5) = 22
});

test("First attempts at consecutive levels are linked: a fresh seed almost never gives 5 successes in a row", () => {
  // Independent 65% rolls would give 5 in a row 11.6% of the time; the game's first rolls give about 0.03%.
  let five = 0;
  const N = 200000;
  for (let i = 0; i < N; i++) {
    const base = Math.imul(i + 1, 2654435761) >>> 0;
    let run = 0;
    while (run < 5 && model.unityRoll((base + run) >>> 0) <= R20.successChance) run++;
    if (run === 5) five++;
  }
  assert.ok(five / N < 0.002, `share with 5 successes in a row: ${five / N}`);
});

test("1.0.20 simulation: Spinesnap example gives the published numbers and the same result every time", () => {
  const rows = model.parseCosts("Finewood: 10/5/10/20\nBone Fragments: 40/20/40/80\nRefined Eitr: 10/-/-/-").rows;
  const sup = model.supply(rows, 4, { "Finewood": 200, "Bone Fragments": 1000, "Refined Eitr": 100 }, R20);
  assert.equal(sup.recrafts, 5);
  const mats = model.simMaterials(sup, 12);
  const q6 = model.simulate(4, 4, 6, 15, mats, false, 0);
  assert.deepEqual(q6, [0.974475, 0.025525, 0, 3.8074, 40000]);
  assert.deepEqual(model.simulate(4, 4, 6, 15, mats, false, 0), q6);
  const q10 = model.simulate(4, 4, 10, 15, mats, false, 0);
  assert.deepEqual(q10, [0.220275, 0.2492, 0.530525, 13.6214, 40000]);
});

test("1.0.30 simulation: Spinesnap example, same inputs as the 1.0.20 test", () => {
  // Not checked in game: guards against unplanned changes. The larger refund allows more recrafts.
  const rows = model.parseCosts("Finewood: 10/5/10/20\nBone Fragments: 40/20/40/80\nRefined Eitr: 10/-/-/-").rows;
  const sup = model.supply(rows, 4, { "Finewood": 200, "Bone Fragments": 1000, "Refined Eitr": 100 }, R30);
  assert.equal(sup.recrafts, 12);
  const mats = model.simMaterials(sup, 12);
  assert.deepEqual(model.simulate(4, 4, 6, 15, mats, false, 0), [0.996275, 0, 0.003725, 3.8965, 40000]);
  assert.deepEqual(model.simulate(4, 4, 10, null, mats, false, 0), [0.889275, 0.110725, 0, 31.275825, 40000]);
});

test("Every rule file is complete", () => {
  const needed = { id: "string", label: "string", successChance: "number", refund: "function", firstSeedFrom: "string",
    refundText: "string", checked: "string", idols: "object", unavailable: "object" };
  const ids = new Set();
  for (const file of RULE_FILES) {
    const rules = require(path.join(__dirname, "../js/rules", file));
    for (const [field, type] of Object.entries(needed)) assert.equal(typeof rules[field], type, `${file}: ${field}`);
    assert.match(rules.id, /^\d+\.\d+\.\d+$/, `${file}: id`);
    assert.equal(file, `valheim-${rules.id}.js`, `${file}: file name and id`);
    assert.ok(!ids.has(rules.id), `${file}: id used twice`); ids.add(rules.id);
    assert.ok(rules.successChance > 0 && rules.successChance < 1, `${file}: successChance`);
    assert.ok(Array.isArray(rules.unavailable), `${file}: unavailable`);
    for (const [name, idol] of Object.entries(rules.idols)) {
      const it = ITEMS.find(x => x.name === name);
      assert.ok(it, `${file}: idol for unknown item "${name}"`);
      assert.notEqual(biomeOf({ ...it, idol }), "", `${file}: ${name}: no biome for idol "${idol}"`);
    }
    for (const name of rules.unavailable) assert.ok(ITEMS.some(x => x.name === name), `${file}: unknown item "${name}"`);
  }
  assert.ok(ids.has("1.0.20") && ids.has("1.0.30"));
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
