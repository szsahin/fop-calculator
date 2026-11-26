// Forge of Potential rules for Valheim 1.0.30 and later.
// Source: the 1.0.30 patch notes and the game code as read by ValheimSaveParser (update of 2026-11-25).
// Not yet checked in game. The fields are described in valheim-1.0.20.js.
//
// Changes from 1.0.20 – 1.0.29:
//   - A break returns 65% of everything the item took of an ingredient so far (the craft and every upgrade up to
//     the level it had), rounded to the nearest whole number, instead of 35% of the craft and the last level.
//   - A character's first-attempt seeds come from its creation date and time instead of its name. The seeds of
//     consecutive levels are still consecutive numbers, so first attempts are still linked; the engine is unchanged.
//   - 19 items use corrected idols, and the Helmet of the Protector can be upgraded (both in js/items.js).
//   - The game code has a branch where a failure lowers the level instead of breaking the item, but its chance is
//     set to 0, so every failure still destroys the item.

(function (rules) {
  if (typeof module !== "undefined") module.exports = rules;
  else (globalThis.RULESETS = globalThis.RULESETS || []).push(rules);
})({
  id: "1.0.30",
  label: "Valheim 1.0.30 and later",
  successChance: 0.65,

  // 65% of (craft amount + every upgrade amount up to the level the item had), in the game's 32-bit floats,
  // rounded with Mathf.RoundToInt: to the nearest whole number, an exact half to the even number.
  refund(r, level, amountAt) {
    if (!r.refund) return 0;
    let sum = 0;
    for (let q = 1; q <= level; q++) sum += amountAt(r, q);
    const x = Math.fround(Math.fround(sum) * Math.fround(0.65));
    const down = Math.floor(x), rest = x - down;
    return rest > 0.5 || (rest === 0.5 && down % 2 !== 0) ? down + 1 : down;
  },

  firstSeedFrom: "the character's creation date and time",
  refundText: "65% of everything the item took of that ingredient so far (the craft and every upgrade up to the level it had), rounded to the nearest whole number",
  checked: "From the game code as read by ValheimSaveParser; not yet checked in game.",

  idols: {},
  unavailable: []
});
