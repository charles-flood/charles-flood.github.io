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

## Milestone 3 — generic ability-event foundation

- Ability definitions register handlers for `BEFORE_ATTACK`, `BEFORE_HIT`, `HIT_RESOLVED`, `ACTIVE_COMPLETED` and `ATTACK_COMPLETED`; follow-up attacks enter a shared FIFO queue (100-attack safety cap).
- Kariyan's battle-long attack counter includes normal, active and passive attacks; the next attack gets a provisional additive multiplier. Counters persist across turns and reset on Reset Battle.
- Kariyan's passive follow-up now also triggers after a normal attack against a Big Target.
- Trajann's bonus is only consumed when actually granted; normal attacks do not consume it.
- Laviscus's snapshot adds a **percentage** of each ally's highest resolved hit, not the full sum. This is still a provisional **flat pre-armour damage-per-hit** interpretation, not a verified in-game formula.
- Normal melee attacks require adjacency to any occupied boss hex; normal ranged attacks use `attacks.ranged.range` (fallback 3). Active ability range is not yet modelled.
- Kariyan's provisional three-hit active profile is configured in `data/characters.json` as `activeAttack`.

**Unverified example parameters** in `abilities.js`: `kariyanGrowthPerAttack: 0.10`, `laviscusHighestHitPercentage: 0.20`, `trajannExtraHits: 2`. These are **test placeholders, not verified game values**. Override with `state.rules` when scripting tests, e.g. `{ laviscusHighestHitPercentage: 0.25 }`. The formula, rounding, attack eligibility, active profiles and actual percentages still need validation against footage.

The event dispatcher is extensible, but **not every champion ability is implemented**. Position-sensitive buffs beyond Trajann, elevation, per-hit dynamic damage modifiers, healing, crits, armour rules and Gulgortz/Vitruvius effects remain pending.

This archive is based on the previously supplied Milestone 2 ZIP, not a live checkout of Git commit `83c0483`. Compare with your branch before copying; any edits made after that archive are not included.

### Damage profiles (Milestone 4)

Damage-type pierce ratios are centralised in `engine.js` and mirrored in
`data/damage-types.json` for reference. Each normal or triggered attack uses its
own damage type, pierce ratio, hit count and (where applicable) range.

Normal ranged attacks must be more than one hex away and within the profile
range, measured to the nearest hex of a multi-hex target. The data file now
includes melee and ranged profiles for the five starting characters.

Existing browser saves can override bundled defaults. Use **Load reference
stats** to adopt new profiles if you previously edited or saved attack values.
Ability scaling, crits, elevation and other damage effects remain provisional.
