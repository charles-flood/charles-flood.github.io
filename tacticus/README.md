# Tacticus Raid Lab — Milestone 2.0 (event-engine foundation)

Static, dependency-free prototype for GitHub Pages. Initial boss: Screamer-Killer. Initial team: Trajann Valoris, Kariyan Helsates, Laviscus, Boss Gulgortz and Vitruvius.

## Install on an existing GitHub Pages site

Copy the entire `tacticus/` folder into the root of your website repository. Commit and push. Visit `https://charles-flood.github.io/tacticus/`. **Do not add any link to your existing navigation or homepage.** The folder is publicly reachable by direct URL, but unlinked.

For local testing, run `python3 -m http.server 8000` from the repository root, then visit `http://localhost:8000/tacticus/`. Loading `index.html` with `file://` will not work because JSON is fetched using `fetch()`.

## What's new in this release

- Per-hit event processing, including attack ownership, active completion and after-attack passives.
- Each friendly character can act once per turn; Next Turn resets action and effect state.
- Multi-hex adjacency checks for the Trajann/Kariyan interaction.
- Kariyan active resolves before his follow-up passive. If another adjacent ally completed an active earlier, the bonus hits instead apply to Kariyan's active.
- Laviscus tracks the largest *actual resolved* hit per other ally, across normal, active and follow-up attacks. His snapshot locks when he attacks.
- The Actions panel now offers Normal Attack or Active Ability (provisional).
- Visible Laviscus per-unit contribution summary and detailed combat event log.
- `test-engine.mjs` is a zero-dependency Node.js regression test. Run `node test-engine.mjs` inside `tacticus/`.

## Explicit limitations

**This is a mechanics scaffold, not a verified Tacticus combat simulation.** The active attack profiles are placeholders: Kariyan's active is provisionally three hits, his passive one hit, and Trajann's qualifying bonus two hits. Other characters' active selections currently use their normal attack profile as a *placeholder*, not their real active abilities. Trajann's full eligibility and damage-stat buff, Laviscus's exact scaling and attack application, ability damage types, crits, blocks, armour, elevation and ranged targeting need verification. The old simplified armour formula is still used.

For Laviscus, the collected amount is **temporarily added to his raw damage per hit** solely to make the snapshot visible in an end-to-end test. This is not yet a verified in-game formula. Do not treat the displayed damage totals as accurate raid predictions.

The boss remains stationary and does not act. No adds or summons are simulated.

## Installation and save compatibility

Copy the `tacticus/` folder to your repository branch. No homepage changes. Existing local saves are retained and combat state is initialized on demand. Export saves before testing new mechanics. Undo snapshots include turn state and the event log.
