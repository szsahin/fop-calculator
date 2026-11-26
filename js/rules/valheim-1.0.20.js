// Forge of Potential rules for Valheim 1.0.20 to 1.0.29.
// Confirmed in game with a test character (see tests/forge-model.test.js). Change this file only to fix a mistake;
// newer game behaviour goes into a new rule file.
//
// Each rule file describes only what can differ between game versions. The shared engine is js/forge-model.js.
//   id, label        the version as shown in the "Game version" choice; the highest id is the default
//   successChance    an attempt succeeds when the roll is at most this value; otherwise the item is destroyed
//   refund(r, level, amountAt)   what a break returns of one cost line r when the item was at quality `level`
//   firstSeedFrom    what the game uses for a character's first attempt at a level (shown in the notes)
//   refundText       the refund rule in words (shown in the notes)
//   checked          how these rules were checked
//   idols            items whose idol in this version differs from js/items.js (name -> idol)
//   unavailable      items in js/items.js that this version cannot upgrade at the Forge of Potential

(function (rules) {
  if (typeof module !== "undefined") module.exports = rules;
  else (globalThis.RULESETS = globalThis.RULESETS || []).push(rules);
})({
  id: "1.0.20",
  label: "Valheim 1.0.20 – 1.0.29",
  successChance: 0.65,

  // 35% of (craft amount + amount of the level the item had), in the game's 32-bit floats, rounded up.
  refund(r, level, amountAt) {
    if (!r.refund) return 0;
    const sum = Math.fround(amountAt(r, 1) + (level >= 2 ? amountAt(r, level) : 0));
    return Math.ceil(Math.fround(sum * Math.fround(0.35)));
  },

  firstSeedFrom: "the character's name",
  refundText: "35% of the base recipe plus the upgrade cost of the level the item had, rounded up",
  checked: "Checked in game with a test character: replayed attempts and counted refunds.",

  // 1.0.30 fixed these idols; this is what 1.0.20 to 1.0.29 used.
  idols: {
    "Nord Atgeir": "Bronze Battle Idol",
    "Bronze Axe": "Iron Battle Idol",
    "Early Axes": "Iron Battle Idol",
    "Flint Axe": "Bronze Battle Idol",
    "Nord Axe": "Black Metal Battle Idol",
    "Frostfire Axe": "Black Metal Battle Idol",
    "Iron Axe": "Silver Battle Idol",
    "Jotun Bane": "Black Metal Battle Idol",
    "Draugr Fang": "Iron Battle Idol",
    "Nord Knucklechains": "Iron Protection Idol",
    "Headdress of the Bear": "Black Marble Protection Idol",
    "Abyssal Razor": "Silver Battle Idol",
    "Skoll and Hati": "Black Metal Battle Idol",
    "Black Metal Pickaxe": "Black Metal Battle Idol",
    "Splitnir": "Black Marble Battle Idol",
    "Splitnir the Bleeding": "Black Marble Battle Idol",
    "Splitnir the Storming": "Black Marble Battle Idol",
    "Splitnir the Primal": "Black Marble Battle Idol",
    "Wooden Sword": "Bronze Battle Idol"
  },
  unavailable: ["Helmet of the Protector"]
});
