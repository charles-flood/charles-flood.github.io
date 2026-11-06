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
assert.deepEqual(c.log.filter(x => x.type === 'DAMAGE_GROWTH' && x.attackerId === 'kariyan')
    .map(x => x.detail).reverse(), ['Attack 1: 1.000x', 'Attack 2: 1.100x']);
c = advanceTurn(c);
c = performCombatAction(c, { attackerId: 'kariyan', targetId: 'screamer-killer', kind: 'normal' });
assert.equal(c.battle.attacksByUnit.kariyan, 4);
assert.deepEqual(c.log.filter(x => x.type === 'DAMAGE_GROWTH' && x.attackerId === 'kariyan')
    .map(x => x.detail).slice(0, 2).reverse(), ['Attack 3: 1.200x', 'Attack 4: 1.300x']);

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
