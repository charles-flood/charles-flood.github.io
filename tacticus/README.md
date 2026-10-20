# Tacticus Raid Lab — Milestone 1

Static, dependency-free prototype for GitHub Pages. Initial boss: Screamer-Killer. Initial team: Trajann Valoris, Kariyan Helsates, Laviscus, Boss Gulgortz and Vitruvius.

## Install on an existing GitHub Pages site

Copy the entire `tacticus/` folder into the root of your website repository. Commit and push. Visit `https://charles-flood.github.io/tacticus/`. **Do not add any link to your existing navigation or homepage.** The folder is publicly reachable by direct URL, but unlinked.

For local testing, run `python3 -m http.server 8000` from the repository root, then visit `http://localhost:8000/tacticus/`. Loading `index.html` with `file://` will not work because JSON is fetched using `fetch()`.

## Current features

- Responsive interactive hex grid, unit selection, click-to-reposition, tile elevation editing.
- Editable manual stats and notes for six entities; no fabricated in-game stats.
- Provisional deterministic per-hit attack model, target HP tracking, turn counter and event log.
- Undo (last 100 edits/actions), reset positions/combat, localStorage save, JSON import/export.
- No third-party dependencies, build process, API keys or external requests.

## Important limitations

**This is a scaffold, not a verified Tacticus combat simulator yet.** The armour calculation is a *placeholder approximation*, not a claim about Tacticus mechanics. Attack range, elevations, movement rules, crits, blocks, ability effects, triggered attacks, adds, summons and boss AI are not simulated. Flat bonus is simply added per hit. Initial health/damage/armour values are intentionally zero until entered by the user. The simulator does not automatically persist every change: click **Save locally** or **Export JSON**.

Next milestone: add verified damage mechanics and data-driven active/passive rules with regression cases from battle footage.
