# Changelog

All notable changes to this project are listed here. Version numbers follow [Semantic Versioning](https://semver.org).

## 0.7.7-beta (2026-10-28)

### Added
- A color theme picker at the top right of both pages: **Auto** (follow the system setting, the default), **Light** or **Dark**. The choice is kept in the browser and applies to both pages. It is set before the page is drawn, so the page does not flash in the other theme.
- The new script `js/theme.js`. Without JavaScript the picker is hidden and the page follows the system setting, as before.

### Unchanged
- The calculation, all presets and the page text are the same as in 0.7.6-beta.

## 0.7.6-beta (2026-10-28)

### Changed
- On the live site the address bar shows short addresses: `…/fop-calculator/guide` instead of `guide.html`, and `…/fop-calculator/` instead of `index.html`. Links between the pages use the short form too, and section anchors are kept (for example `guide#single-trophy`).
- The pages keep `.html` in their own links, so a copy opened from disk or from a local web server works as before. The new script `js/links.js` changes the addresses only on github.io.

### Unchanged
- The calculation, all presets and the page text are the same as in 0.7.5-beta.

## 0.7.5-beta (2026-10-28)

### Added
- Guide: a "Contents" list under the title, with a link to each section.
- Guide: every section has a fixed anchor, so a link can point to it directly, for example `guide.html#single-trophy`. Anchors: `one-attempt`, `many-attempts`, `distribution`, `read-the-calculator`, `average`, `bad-luck-streaks`, `hammer-test`, `single-trophy`, `in-short`.

### Unchanged
- The guide text, the calculation and all presets are the same as in 0.7.4-beta.

## 0.7.4-beta (2026-10-28)

### Added
- Guide, step 8: an item that needs a single trophy or other single ingredient (for example the Fenris Hood or the Headdress of the Bear) always gets it back on a break, because 35% of 1, rounded up, is 1. Checked in game with the Headdress of the Bear.

### Unchanged
- The calculation and all presets are the same as in 0.7.3-beta.

## 0.7.3-beta (2026-10-28)

### Added
- The project logo in the guide page header, left of the title (above it on phones). The guide has no banner.
- A "MIT License" link in the footer of both pages. It opens the LICENSE file on GitHub.

### Unchanged
- The calculation and all presets are the same as in 0.7.2-beta.

## 0.7.2-beta (2026-10-28)

### Added
- A decorative rune band above the header and above the footer on both pages: the Elder Futhark row, drawn from the Noto Sans Runic font. It uses the accent color of the light or dark theme, is hidden from screen readers and is not printed.
- The band picture is stored inside `css/style.css`, so it also shows when the page is opened from disk.

### Unchanged
- The calculation and all presets are the same as in 0.7.1-beta.

## 0.7.1-beta (2026-10-28)

### Changed
- New banner files in a wider 10:3 shape (1600 × 480 and 2172 × 652 px), so less of the picture is cut at the top and bottom.
- The dark overlay behind the header text was adjusted, so the text is easier to read and the picture stays bright.

### Unchanged
- The calculation and all presets are the same as in 0.7.0-beta.

## 0.7.0-beta (2026-10-28)

### Added
- A header picture on the calculator page: a banner with the Forge scene and the project logo, created by szsahin with ChatGPT. The title stays real text on a dark overlay, so it can be read in the light and the dark theme. On phones the picture is shown behind the title with an even overlay.
- The banner is stored in two widths (1600 and 2172 px); the browser loads the one that fits the screen.

### Removed
- The text rune line under the title on both pages. The banner already shows runes. The Noto Sans Runic font stays in the repository for later use.

### Unchanged
- The calculation and all presets are the same as in 0.6.1-beta.

## 0.6.1-beta (2026-10-27)

### Added
- A decorative rune line under the page title on both pages: "Forge of Potential" in Elder Futhark runes. It is decoration only and hidden from screen readers.
- The Noto Sans Runic font (SIL Open Font License), stored in the repository like the other fonts.

### Unchanged
- The calculation and all presets are the same as in 0.6.0-beta.

## 0.6.0-beta (2026-10-27)

### Added
- **All 227 items** that the Forge of Potential can upgrade in Valheim 1.0.20 are now presets: 127 weapons, 73 armor pieces, 19 shields and 8 tools. Costs come from the 1.0.20 game data; a sample of 22 items, covering every special case below, was checked against the Valheim wiki.
- **Search field** above the tabs. It searches all tabs and finds items where each typed word starts a word of the name, for example "fang", "nord" or "frostfire sw". Results are grouped by type and biome.
- **Items made from other gear** (45 items, for example the Frostfire Sword from a Nord Sword, or Klossen from a Flametal Mace): the recraft cost includes the base item's materials, which are never returned on a break.
- Notes under the item list for special cases: items made from other gear, items cast at the Frost Foundry, items whose normal maximum is limited because the needed station level is not in the game yet, and the Pointy Hat, which can only be crafted during the Halloween event.

### Changed
- A material can now appear on two cost lines, for example in an item's own recipe and in the base item it is made from. Both lines use the same stock, and each line keeps its own refund rule.

### Known limitation
- The Nord Knucklechains' crafting recipe uses no Timberwood, but the game data lists 10 Timberwood as the recipe's base amount. The game may count those 10 when returning materials on a break; the calculator does not. This changes the Timberwood returned by a few units for this one item.

### Unchanged
- The calculation rules are the same. Every earlier preset gives exactly the same table as before.

## 0.5.0-beta (2026-10-27)

### Added
- A fourth tab, **Shields**, with all 19 shields that the Forge of Potential can upgrade, from the Wood Shield to the Nord Greatshield. Shields use Protection idols, like armor. Their normal maximum is Q3.
- The three Nord shields include the 5 Liquid Frost per craft for the Frost Foundry, marked "(no refund)".

### Checked
- All presets, old and new, were compared with the Valheim 1.0.20 game data: every cost and every normal maximum level matches.

### Unchanged
- The calculation rules and results are the same as in 0.4.0-beta: every earlier preset gives exactly the same table as before.

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
