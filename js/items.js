// Item presets for the Forge of Potential Probability Calculator.
// Sources: the Valheim wiki item pages and the Valheim 1.0.20 game data in ValheimSaveParser.
//
// Each item:
//   type    the tab it is listed under: one of ITEM_TYPES
//   name    shown in the item list
//   station crafting station ("" if none)
//   idol    the Forge of Potential idol it uses; the biome group in the list comes from this (see IDOL_BIOMES)
//   maxq    the highest level its crafting station can reach
//   costs   one ingredient per line, then the amounts for Q1/Q2/Q3/Q4 ("-" for none);
//           add "(no refund)" after an ingredient the game never returns on a break
//   note    optional text shown under the item list

const ITEM_TYPES = ["Weapons", "Armor", "Tools"];

// Idol tier -> biome, in game order. The item list is grouped by these biomes.
const IDOL_BIOMES = [
  ["Wooden", "Meadows"],
  ["Bronze", "Black Forest"],
  ["Iron", "Swamp"],
  ["Silver", "Mountains"],
  ["Black Metal", "Plains"],
  ["Black Marble", "Mistlands"],
  ["Flametal", "Ashlands"],
  ["Bloodgold", "Deep North"]
];

// The biome of an item, from its idol ("Black Metal Protection Idol" -> "Plains"); "" if unknown.
function biomeOf(item) {
  const tier = IDOL_BIOMES.find(([t]) => item.idol.startsWith(t + " Battle") || item.idol.startsWith(t + " Protection"));
  return tier ? tier[1] : "";
}

const ITEMS = [
  { type: "Weapons", name: "Crude Bow", station: "Workbench", idol: "Wooden Battle Idol", maxq: 4,
    costs: "Wood: 10/5/10/20\nLeather Scraps: 8/4/8/16\nDeer Hide: -/1/2/4" },
  { type: "Weapons", name: "Finewood Bow", station: "Workbench", idol: "Bronze Battle Idol", maxq: 4,
    costs: "Finewood: 10/5/10/20\nCorewood: 10/5/10/20\nDeer Hide: 2/2/4/8" },
  { type: "Weapons", name: "Huntsman Bow", station: "Forge", idol: "Iron Battle Idol", maxq: 4,
    costs: "Finewood: 10/5/10/20\nIron: 20/10/20/40\nFeathers: 10/5/10/20\nDeer Hide: 2/2/4/8" },
  { type: "Weapons", name: "Draugr Fang", station: "Forge", idol: "Iron Battle Idol", maxq: 4,
    costs: "Ancient Bark: 10/5/10/20\nSilver: 20/10/20/40\nDeer Hide: 2/2/4/8\nGuck: 10/2/4/8" },
  { type: "Weapons", name: "Spinesnap", station: "Black Forge", idol: "Black Marble Battle Idol", maxq: 4,
    costs: "Finewood: 10/5/10/20\nBone Fragments: 40/20/40/80\nRefined Eitr: 10/-/-/-" },
  { type: "Weapons", name: "Ash Fang", station: "Black Forge", idol: "Flametal Battle Idol", maxq: 4,
    costs: "Ashwood: 10/5/10/20\nCharred Bone: 16/10/20/40\nFlametal: 5/5/10/20\nBonemaw Tooth: 5/5/10/20" },
  { type: "Weapons", name: "Nord Bow", station: "Black Forge", idol: "Bloodgold Battle Idol", maxq: 3,
    note: "Q4 needs Black Forge level 7, which is not in the game yet, so the normal max is set to 3.",
    costs: "Bloodgold: 20/10/20/40\nTimberwood: 10/5/10/20\nMould: Nord Bow: 1/-/-/-\nLiquid Frost: 5/-/-/- (no refund)" },
  { type: "Tools", name: "Hammer", station: "", idol: "Wooden Battle Idol", maxq: 3,
    costs: "Wood: 3/1/2\nStone: 2/1/2" },
  { type: "Tools", name: "Hoe", station: "Workbench", idol: "Wooden Battle Idol", maxq: 3,
    costs: "Wood: 5/1/2\nStone: 2/1/2" },
  { type: "Tools", name: "Cultivator", station: "Forge", idol: "Wooden Battle Idol", maxq: 3,
    costs: "Corewood: 5/1/2\nBronze: 5/1/2" },
  { type: "Armor", name: "Troll Leather Hood", station: "Workbench", idol: "Bronze Protection Idol", maxq: 4,
    costs: "Troll Hide: 5/2/4/8\nBone Fragments: 3/1/2/4" },
  { type: "Armor", name: "Troll Leather Tunic", station: "Workbench", idol: "Bronze Protection Idol", maxq: 4,
    costs: "Troll Hide: 5/2/4/8" },
  { type: "Armor", name: "Troll Leather Trousers", station: "Workbench", idol: "Bronze Protection Idol", maxq: 4,
    costs: "Troll Hide: 5/2/4/8" },
  { type: "Armor", name: "Troll Hide Cape", station: "Workbench", idol: "Bronze Protection Idol", maxq: 4,
    costs: "Troll Hide: 10/5/10/20\nBone Fragments: 10/5/10/20" },
  { type: "Armor", name: "Lox Fur Hood", station: "Workbench", idol: "Black Metal Protection Idol", maxq: 4,
    costs: "Lox Pelt: 4/2/4/8\nBone Fragments: 4/2/4/8\nWrithan Roots: 2/1/2/4" },
  { type: "Armor", name: "Lox Fur Jacket", station: "Workbench", idol: "Black Metal Protection Idol", maxq: 4,
    costs: "Lox Pelt: 5/6/12/24\nBone Fragments: 8/4/8/16\nRoot: 2/1/2/4" },
  { type: "Armor", name: "Lox Fur Trousers", station: "Workbench", idol: "Black Metal Protection Idol", maxq: 4,
    costs: "Lox Pelt: 5/3/6/12\nBone Fragments: 8/4/8/16\nRoot: 2/1/2/4" },
  { type: "Armor", name: "Lox Cape", station: "Workbench", idol: "Black Metal Protection Idol", maxq: 4,
    costs: "Lox Pelt: 6/2/4/8\nSilver: 2/-/-/-" },
  { type: "Armor", name: "Hood of Ask", station: "Black Forge", idol: "Flametal Protection Idol", maxq: 4,
    costs: "Linen Thread: 15/10/20/40\nLox Pelt: 4/2/4/8\nAsksvin Hide: 10/5/10/20" },
  { type: "Armor", name: "Breastplate of Ask", station: "Black Forge", idol: "Flametal Protection Idol", maxq: 4,
    costs: "Linen Thread: 15/10/20/40\nLox Pelt: 4/2/4/8\nAsksvin Hide: 10/5/10/20" },
  { type: "Armor", name: "Trousers of Ask", station: "Black Forge", idol: "Flametal Protection Idol", maxq: 4,
    costs: "Linen Thread: 15/10/20/40\nLox Pelt: 4/2/4/8\nAsksvin Hide: 10/5/10/20" },
  { type: "Armor", name: "Asksvin Cloak", station: "Galdr Table", idol: "Flametal Protection Idol", maxq: 4,
    costs: "Asksvin Hide: 6/2/4/8\nMorgen Sinew: 2/-/-/-" },
];
