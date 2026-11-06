import assert from 'node:assert/strict';
import fs from 'node:fs';
import { performCombatAction, advanceTurn } from './engine.js';
const chars = JSON.parse(fs.readFileSync(new URL('./data/characters.json', import.meta.url)));
const boss = JSON.parse(fs.readFileSync(new URL('./data/bosses.json', import.meta.url)));
const make = () => {
    const units = structuredClone([...chars, ...boss]);
    const target = units.find(u => u.id === 'screamer-killer');
    target.stats.health = 30000000;
    target.stats.armour = 0;
    target.position = { q: 5, r: 2 };
    units.find(u => u.id === 'trajann').position = { q: 4, r: 2 };
    units.find(u => u.id === 'kariyan').position = { q: 4, r: 3 };
    units.find(u => u.id === 'vitruvius').position = { q: 5, r: 4 };
    units.find(u => u.id === 'laviscus').position = { q: 6, r: 3 };
    return { units, tiles: [], turn: 1, log: [] };
};
let a = performCombatAction(make(), { attackerId: 'kariyan', targetId: 'screamer-killer', kind: 'active' });
assert.equal(a.log.filter(x => x.type === 'BONUS_HITS').length, 1);
assert.equal(a.log.filter(x => x.type === 'HIT_RESOLVED' && x.source?.includes('Kariyan follow-up')).length, 3);
assert.equal(a.log.filter(x => x.type === 'HIT_RESOLVED' && x.source?.includes('active')).length, 3);
let b = performCombatAction(make(), { attackerId: 'vitruvius', targetId: 'screamer-killer', kind: 'active' });
b = performCombatAction(b, { attackerId: 'kariyan', targetId: 'screamer-killer', kind: 'active' });
assert.equal(b.log.filter(x => x.type === 'HIT_RESOLVED' && x.source?.includes('Kariyan follow-up')).length, 1);
assert.equal(b.log.filter(x => x.type === 'HIT_RESOLVED' && x.source?.includes('Kariyan Helsates active')).length, 5);
const highest = b.combat.highestHitByUnit.kariyan;
assert.ok(highest > 0);
b = performCombatAction(b, { attackerId: 'laviscus', targetId: 'screamer-killer', kind: 'normal' });
assert.equal(b.combat.laviscusLocked.contributions.kariyan, highest);
assert.ok(b.combat.laviscusLocked.total >= highest);
assert.throws(() => performCombatAction(b, { attackerId: 'laviscus', targetId: 'screamer-killer', kind: 'normal' }));
b = advanceTurn(b);
assert.equal(b.combat.laviscusLocked, null);
console.log('All event ordering and snapshot tests passed');

// Normal attack must not consume Trajann's bonus; the queued passive receives it.
let c = performCombatAction(make(), { attackerId: 'vitruvius', targetId: 'screamer-killer', kind: 'active' });
c = performCombatAction(c, { attackerId: 'kariyan', targetId: 'screamer-killer', kind: 'normal' });
assert.equal(c.log.filter(x => x.type === 'HIT_RESOLVED' && x.source?.includes('follow-up')).length, 3);
assert.equal(c.battle.attacksByUnit.kariyan, 2);
assert.equal(c.log.filter(x => x.type === 'DAMAGE_GROWTH' && x.attackerId === 'kariyan').length, 0);
c = advanceTurn(c);
c = performCombatAction(c, { attackerId: 'kariyan', targetId: 'screamer-killer', kind: 'normal' });
assert.equal(c.battle.attacksByUnit.kariyan, 4);
assert.equal(c.log.filter(x => x.type === 'DAMAGE_GROWTH' && x.attackerId === 'kariyan').length, 0);

// Laviscus receives a percentage, not the entire accumulated hit sum.
let d = make();
d.rules = { laviscusHighestHitPercentage: 0.25 };
d = performCombatAction(d, { attackerId: 'kariyan', targetId: 'screamer-killer', kind: 'active' });
const largest = d.combat.highestHitByUnit.kariyan;
d = performCombatAction(d, { attackerId: 'laviscus', targetId: 'screamer-killer', kind: 'normal' });
assert.equal(d.combat.laviscusLocked.contributions.kariyan, largest);
assert.ok(d.log.some(x => x.type === 'LAVISCUS_SNAPSHOT' && x.detail.includes('25.0%')));

// A melee normal attack cannot be made from a distant hex.
const distant = make();
distant.units.find(u => u.id === 'kariyan').position = { q: 0, r: 10 };
assert.throws(() => performCombatAction(distant, {
    attackerId: 'kariyan', targetId: 'screamer-killer', kind: 'normal'
}), /adjacency/);
console.log('Growth, passive follow-up, Laviscus percentage and positioning tests passed');

// Normal and triggered profiles retain their own piercing properties.
import { DAMAGE_TYPES, getProfilePierce } from './engine.js';
assert.equal(DAMAGE_TYPES.piercing, 80);
assert.equal(getProfilePierce({ damageType: 'molecular' }), 60);
assert.equal(getProfilePierce({ damageType: 'molecular', pierce: 55 }), 55);
const ranged = make();
ranged.units.find(u => u.id === 'gulgortz').position = { q: 2, r: 2 };
const rangedResult = performCombatAction(ranged, {
    attackerId: 'gulgortz', targetId: 'screamer-killer', kind: 'normal', attackType: 'ranged'
});
assert.ok(rangedResult.log.some(x => x.type === 'ATTACK_STARTED' && x.detail.includes('15% pierce')));
assert.throws(() => performCombatAction(ranged, {
    attackerId: 'gulgortz', targetId: 'screamer-killer', kind: 'normal', attackType: 'melee'
}), /adjacency/);
const passive = performCombatAction(make(), {
    attackerId: 'kariyan', targetId: 'screamer-killer', kind: 'normal'
});
assert.ok(passive.log.some(x => x.type === 'ATTACK_STARTED' && x.detail.includes('80% pierce')));
console.log('Damage-type registry, ranged reach and passive pierce tests passed');

// Ability-specific damage ranges and the independent Trajann damage bonus.
let e = performCombatAction(make(), {
    attackerId: 'kariyan', targetId: 'screamer-killer', kind: 'active'
});
const activeHits = e.log.filter(item => item.type === 'HIT_RESOLVED' &&
    item.source?.includes('Kariyan Helsates active'));
const passiveHits = e.log.filter(item => item.type === 'HIT_RESOLVED' &&
    item.source?.includes('Kariyan follow-up'));
assert.equal(activeHits.length, 3);
assert.equal(activeHits[0].damage, 3290);
assert.equal(passiveHits.length, 3);
assert.equal(passiveHits[0].damage, 6480);
assert.ok(e.log.some(item => item.type === 'DAMAGE_BONUS' && item.attackerId === 'kariyan'));
assert.ok(e.log.some(item => item.type === 'BONUS_HITS' && item.attackerId === 'kariyan'));

let f = performCombatAction(make(), {
    attackerId: 'kariyan', targetId: 'screamer-killer', kind: 'active'
});
f = advanceTurn(f);
f = performCombatAction(f, {
    attackerId: 'kariyan', targetId: 'screamer-killer', kind: 'active'
});
assert.ok(f.log.some(item => item.type === 'DAMAGE_GROWTH' &&
    item.detail.includes('1 previous attacking turns: 1.330x')));

// The pierce floor is a minimum, not additive armour penetration.
const armour = make();
armour.units.find(unit => unit.id === 'trajann').stats.damage = 5000;
armour.units.find(unit => unit.id === 'trajann').attacks.melee.pierce = 50;
armour.units.find(unit => unit.id === 'screamer-killer').stats.armour = 3000;
const armourResult = performCombatAction(armour, {
    attackerId: 'trajann', targetId: 'screamer-killer', kind: 'normal'
});
assert.equal(armourResult.log.find(item => item.type === 'HIT_RESOLVED').damage, 2500);
console.log('Ability ranges, Trajann damage bonus, turn growth and armour tests passed');

// Master Annihilator marks only after Vitruvius's normal attack, persists across turns,
// and the extra hit is capped after armour/pierce.
let mark = make();
mark = performCombatAction(mark, { attackerId: 'vitruvius', targetId: 'screamer-killer', kind: 'normal' });
assert.equal(mark.battle.masterAnnihilatorTargetId, 'screamer-killer');
assert.equal(mark.log.filter(x => x.type === 'HIT_RESOLVED' && x.attackerId === 'vitruvius').length, 1);
mark = performCombatAction(mark, { attackerId: 'trajann', targetId: 'screamer-killer', kind: 'normal' });
assert.equal(mark.log.filter(x => x.type === 'HIT_RESOLVED' && x.attackerId === 'trajann').length, 4);
assert.ok(mark.log.some(x => x.source === 'masterAnnihilator' && x.type === 'HIT_RESOLVED'));
mark = advanceTurn(mark);
mark = performCombatAction(mark, { attackerId: 'kariyan', targetId: 'screamer-killer', kind: 'normal' });
assert.equal(mark.log.filter(x => x.source === 'masterAnnihilator' && x.type === 'HIT_RESOLVED').length, 3);
let capped = make();
capped.units.find(x => x.id === 'trajann').stats.damage = 20000;
capped = performCombatAction(capped, { attackerId: 'vitruvius', targetId: 'screamer-killer', kind: 'normal' });
capped = performCombatAction(capped, { attackerId: 'trajann', targetId: 'screamer-killer', kind: 'normal' });
assert.equal(capped.log.find(x => x.type === 'HIT_RESOLVED' && x.source === 'masterAnnihilator').damage, 7477);
console.log('Master Annihilator persistence, extra-hit timing and cap tests passed');

let g = make();
g.units.find(x => x.id === 'gulgortz').position = { q: 4, r: 2 };
g = performCombatAction(g, { attackerId: 'gulgortz', targetId: 'screamer-killer', kind: 'normal' });
assert.equal(g.log.filter(x => x.type === 'HIT_RESOLVED' && x.source === 'Light Im Up').length, 3);
assert.equal(g.log.find(x => x.type === 'HIT_RESOLVED' && x.source === 'Light Im Up').damage, 1746);

let defensive = make();
defensive = performCombatAction(defensive, { attackerId: 'trajann', targetId: 'screamer-killer', kind: 'active' });
assert.equal(defensive.log.filter(x => x.type === 'HIT_RESOLVED' && x.attackerId === 'trajann').length, 0);
assert.ok(defensive.log.some(x => x.type === 'DEFENSIVE_ACTIVE'));
console.log('Gulgortz passive and defensive Trajann active tests passed');

// Damage summary counts each resolved hit once, including bonus hits and triggered attacks.
import { summarizeDamage } from './damage-summary.js';
const summary = summarizeDamage(a.log, a.turn);
const hitTotal = a.log.filter(entry => entry.type === 'HIT_RESOLVED')
    .reduce((total, entry) => total + entry.damage, 0);
assert.equal(summary.battleTotal, hitTotal);
assert.equal(summary.currentTurnTotal, hitTotal);
assert.equal(Object.values(summary.byCharacter).reduce((total, value) => total + value, 0), hitTotal);
const secondTurnSummary = summarizeDamage([
    { type: 'HIT_RESOLVED', turn: 1, attackerId: 'a', damage: 100 },
    { type: 'HIT_RESOLVED', turn: 2, attackerId: 'b', damage: 50 },
    { type: 'ATTACK_COMPLETED', turn: 2, attackerId: 'b', damage: 50 }
], 2);
assert.deepEqual(secondTurnSummary.byTurn, { 1: 100, 2: 50 });
assert.equal(secondTurnSummary.battleTotal, 150);
assert.equal(secondTurnSummary.currentTurnTotal, 50);
console.log('Damage summary tests passed');
