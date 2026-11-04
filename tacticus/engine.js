// Intentionally provisional combat model. NOT a verified Tacticus damage formula.
export const clone = value => structuredClone(value);
export const key = ({ q, r }) => `${q},${r}`;
export function makeTiles(cols = 9, rows = 11) { return Array.from({ length: cols * rows }, (_, i) => ({ q: i % cols, r: Math.floor(i / cols), elevation: 0 })); }
export function attack(state, attackerId, targetId, flatBonus = 0, attackType = 'melee') {
    const next = clone(state), a = next.units.find(u => u.id === attackerId), t = next.units.find(u => u.id === targetId);
    if (!a || !t || a.team === t.team)
        throw Error('Select an attacker and an opposing target.');
    if (a.stats.damage <= 0)
        throw Error('Enter a positive Damage / hit value for the attacker first.');
    if (t.stats.health <= 0)
        throw Error('Enter the target’s current health first.');
    const profile = a.attacks?.[attackType];
    if (!profile || !Number.isFinite(profile.hits) || profile.hits < 1)
        throw Error(`No ${attackType} attack configured for ${a.name}.`);
    if (!Number.isFinite(profile.pierce))
        throw Error(`Set the ${attackType} pierce percentage for ${a.name} first.`);
    const hits = Math.floor(profile.hits), pierce = Math.max(0, Math.min(1, profile.pierce / 100));
    const rawPerHit = Math.max(0, a.stats.damage + flatBonus);
    // Simplified approximation: armour cannot reduce damage below pierce-protected portion.
    const afterArmour = Math.max(rawPerHit - t.stats.armour, rawPerHit * pierce, 0);
    const perHit = Math.floor(afterArmour), damage = Math.min(t.stats.health, perHit * hits);
    t.stats.health -= damage;
    const entry = { turn: next.turn, attacker: a.name, target: t.name, hits, rawPerHit, armour: t.stats.armour, pierce: profile.pierce, attackType, perHit, damage, remaining: t.stats.health, kind: 'attack' };
    next.log.unshift(entry);
    return next;
}
// Footprints are offsets in the board's odd-row offset coordinate system.
// Convert through cube/axial coordinates so shapes stay consistent across rows.
export function offsetToAxial({ q, r }) {
    return { q: q - (r - (r & 1)) / 2, r };
}
export function axialToOffset({ q, r }) {
    return { q: q + (r - (r & 1)) / 2, r };
}
export function occupiedHexes(unit) {
    const anchor = offsetToAxial(unit.position);
    const footprint = unit.footprint?.length ? unit.footprint : [{ q: 0, r: 0 }];
    return footprint.map(offset => axialToOffset({
        q: anchor.q + offset.q,
        r: anchor.r + offset.r
    }));
}
export function isOccupied(state, hex, exceptId = null) {
    return state.units.some(unit => unit.id !== exceptId &&
        occupiedHexes(unit).some(position => key(position) === key(hex)));
}

// The existing attack() is retained for backwards compatibility. The event-driven
// action resolver below is used by the UI for all new attacks and abilities.
import {
    ensureTurnState,
    resetTurnState,
    recordResolvedHit,
    laviscusSnapshot,
    completedActive
} from './abilities.js';

export function hexDistance(a, b) {
    const first = offsetToAxial(a);
    const second = offsetToAxial(b);
    const dq = first.q - second.q;
    const dr = first.r - second.r;
    return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
}

export function adjacentToUnit(first, second) {
    return occupiedHexes(first).some(a =>
        occupiedHexes(second).some(b => hexDistance(a, b) === 1)
    );
}

function addEvent(state, event) {
    const turn = ensureTurnState(state);
    const record = { turn: state.turn, ...event };
    turn.events.push(record);
    state.log.unshift({ kind: 'event', ...record });
}

function resolveAttack(state, spec) {
    const attacker = state.units.find(unit => unit.id === spec.attackerId);
    const target = state.units.find(unit => unit.id === spec.targetId);
    if (!attacker || !target || attacker.team === target.team) {
        throw Error('Choose an attacker and an opposing target.');
    }
    if (target.stats.health <= 0) {
        throw Error('Target has no health remaining.');
    }
    const profile = spec.profile ?? attacker.attacks?.[spec.attackType ?? 'melee'];
    if (!profile || !Number.isFinite(profile.hits) || profile.hits < 1 || !Number.isFinite(profile.pierce)) {
        throw Error('Configure the attack hits and pierce before resolving this attack.');
    }

    const turn = ensureTurnState(state);
    let hits = Math.floor(profile.hits);
    const baseHits = hits;
    const trajann = state.units.find(unit => unit.id === 'trajann');
    const qualifyingActive = turn.completedActives.some(active => {
        const actor = state.units.find(unit => unit.id === active.actorId);
        return actor && adjacentToUnit(actor, target);
    });

    // Modelled as once per attacking unit, per turn, on the first eligible
    // non-normal attack. The two bonus hits are a provisional level-50 value.
    if (spec.kind !== 'normal' && !turn.trajannConsumed[attacker.id] && qualifyingActive) {
        turn.trajannConsumed[attacker.id] = true;
        if (trajann && adjacentToUnit(trajann, target)) {
            hits += 2;
            addEvent(state, {
                type: 'BONUS_HITS',
                attackerId: attacker.id,
                source: 'Trajann passive',
                detail: '+2 hits on this qualifying non-normal attack'
            });
        } else {
            addEvent(state, {
                type: 'CONDITION',
                attackerId: attacker.id,
                detail: 'Trajann not adjacent; no extra hits'
            });
        }
    }

    const laviscus = attacker.id === 'laviscus' ? laviscusSnapshot(state) : null;
    const extraDamage = laviscus?.total ?? 0;
    if (laviscus) {
        addEvent(state, {
            type: 'LAVISCUS_SNAPSHOT',
            attackerId: attacker.id,
            detail: `Highest hits locked: ${JSON.stringify(laviscus.contributions)}; sum ${extraDamage}`
        });
    }

    const pierce = Math.max(0, Math.min(1, profile.pierce / 100));
    const rawPerHit = Math.max(0, attacker.stats.damage + (spec.flatBonus ?? 0) + extraDamage);
    let damage = 0;
    const hitDamage = [];
    addEvent(state, { type: 'ATTACK_STARTED', attackerId: attacker.id, detail: `${spec.kind}, ${baseHits} base hits` });

    for (let index = 0; index < hits; index++) {
        const calculated = Math.floor(Math.max(rawPerHit - target.stats.armour, rawPerHit * pierce, 0));
        const actual = Math.min(calculated, target.stats.health);
        target.stats.health -= actual;
        damage += actual;
        hitDamage.push(actual);
        recordResolvedHit(state, attacker.id, actual);
        addEvent(state, {
            type: 'HIT_RESOLVED',
            attackerId: attacker.id,
            targetId: target.id,
            source: spec.source ?? spec.kind,
            hit: index + 1,
            damage: actual,
            detail: `${actual.toLocaleString()} damage (hit ${index + 1}/${hits})`
        });
    }

    addEvent(state, { type: 'ATTACK_COMPLETED', attackerId: attacker.id, detail: `${damage.toLocaleString()} total damage` });
    return { damage, hits, hitDamage };
}

export function performCombatAction(previous, options) {
    const state = clone(previous);
    const actor = state.units.find(unit => unit.id === options.attackerId);
    if (!actor || actor.team !== 'ally') {
        throw Error('Choose a friendly character.');
    }
    const turn = ensureTurnState(state);
    if (turn.acted[actor.id]) {
        throw Error(`${actor.name} has already acted this turn.`);
    }

    const active = options.kind === 'active';
    const profile = active && actor.id === 'kariyan'
        ? { hits: 3, pierce: options.activePierce ?? actor.attacks?.melee?.pierce }
        : null;
    const primary = resolveAttack(state, {
        ...options,
        profile,
        kind: active ? 'active' : 'normal',
        source: active ? `${actor.name} active (provisional)` : 'Normal attack'
    });

    if (active) {
        // An active completes before its after-attack passive can trigger.
        completedActive(state, actor.id, options.targetId);
        addEvent(state, { type: 'ACTIVE_COMPLETED', attackerId: actor.id, detail: `${actor.name} active completed` });

        if (actor.id === 'kariyan') {
            const target = state.units.find(unit => unit.id === options.targetId);
            if (target?.traits?.includes('Big Target') && target.stats.health > 0) {
                resolveAttack(state, {
                    attackerId: actor.id,
                    targetId: target.id,
                    kind: 'passive',
                    source: 'Kariyan follow-up passive (provisional)',
                    profile: { hits: 1, pierce: 100 },
                    flatBonus: options.passiveBonus ?? 0
                });
            }
        }
    }

    turn.acted[actor.id] = true;
    addEvent(state, { type: 'ACTION_COMPLETED', attackerId: actor.id, detail: `${actor.name} finished their action` });
    return state;
}

export function advanceTurn(previous) {
    const state = clone(previous);
    state.turn++;
    resetTurnState(state);
    state.log.unshift({ kind: 'turn', turn: state.turn });
    return state;
}
