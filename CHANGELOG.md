# Changelog

All notable changes to this project are listed here. Version numbers follow [Semantic Versioning](https://semver.org).

## 0.4.0-beta (2026-10-27)

### Changed
- The item list is split into three tabs: Weapons, Armor and Tools.
- In each tab, items are grouped by biome (Meadows, Black Forest, Swamp, Mountains, Plains, Mistlands, Ashlands, Deep North). The biome comes from the tier of the item's idol, so the list shows together the items that use the same idol. For example, Draugr Fang is listed under Swamp because it uses the Iron Battle Idol.
- "Other item (paste costs)" is no longer an entry in the list. It is now the link "Enter the costs of another item" under the list.
- In `js/items.js`, the `group` field is replaced by `type` (Weapons, Armor or Tools).

### Unchanged
- The calculation rules and results are the same as in 0.3.2-beta: every preset gives exactly the same table as before.

## 0.3.2-beta (2026-10-27)

### Added
- Item presets for the Ask armor set: Hood of Ask, Breastplate of Ask and Trousers of Ask (Black Forge, Flametal Protection Idol), and the Asksvin Cloak (Galdr Table, Flametal Protection Idol). Costs are from the Valheim 1.0.20 game data.
- This changelog.

## 0.3.1-beta (2026-10-27)

First public release.

### Calculator
- Chance to reach each level above the normal maximum, chance to lose the item, chance to keep an item below the wanted level, and average idols used.
- Plays out the game's own Forge of Potential rules (patch 1.0.20) for 40,000 simulated players with unknown names: seeded rolls, linked first attempts at consecutive levels, a new stored seed after every attempt, and a 65% success chance.
- Recrafts after a break, limited by the materials entered, with the exact refund: 35% of the base recipe plus the cost of the level the item had, rounded up; ingredients marked "(no refund)" are never returned.
- Inputs for the item's current, wanted and normal maximum level, idols, materials, the highest level already tried at the Forge, and whether to risk the last copy.
- Presets: bows (Crude Bow, Finewood Bow, Huntsman Bow, Draugr Fang, Spinesnap, Ash Fang, Nord Bow), tools (Hammer, Hoe, Cultivator), Troll armor and Lox armor. Any other item can be pasted in.
- Never reads character files or uses character names.

### Guide
- "What the percentages mean": a short explanation for players who do not work with statistics, including the in-game hammer test.

### Project
- Separate HTML, CSS, JavaScript, image and font files; no build step.
- Fonts stored in the repository (SIL Open Font License), so the pages make no requests to other websites.
- Version number read from the `VERSION` file.
- Tests for the game rules, checked against real in-game results.
