// Intentionally provisional combat model. NOT a verified Tacticus damage formula.
export const clone = value => structuredClone(value);

// Central registry: an attack's damage type supplies its pierce ratio.
// An explicit profile.pierce is retained as an editable override.
export const DAMAGE_TYPES = Object.freeze({
    physical: 1,
    power: 40,
    piercing: 80,
    eviscerating: 50,
    bolter: 20,
    plasma: 65,
    psychic: 100,
    direct: 100,
    projectile: 15,
    molecular: 60,
    toxic: 70
});

export function getProfilePierce(profile) {
    if (Number.isFinite(profile?.pierce)) {
        return profile.pierce;
    }
    return DAMAGE_TYPES[profile?.damageType] ?? null;
}

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
    if (!Number.isFinite(getProfilePierce(profile)))
        throw Error(`Set the ${attackType} pierce percentage for ${a.name} first.`);
    const hits = Math.floor(profile.hits), pierce = Math.max(0, Math.min(1, getProfilePierce(profile) / 100));
    const rawPerHit = Math.max(0, a.stats.damage + flatBonus);
    // Simplified approximation: armour cannot reduce damage below pierce-protected portion.
    const afterArmour = Math.max(rawPerHit - t.stats.armour, rawPerHit * pierce, 0);
    const perHit = Math.floor(afterArmour), damage = Math.min(t.stats.health, perHit * hits);
    t.stats.health -= damage;
    const entry = { turn: next.turn, attacker: a.name, target: t.name, hits, rawPerHit, armour: t.stats.armour, pierce: getProfilePierce(profile), damageType: profile.damageType ?? null, attackType, perHit, damage, remaining: t.stats.health, kind: 'attack' };
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
    DEFAULT_RULES,
    ensureBattleState,
    ensureTurnState,
    resetTurnState,
    recordResolvedHit,
    completedActive,
    dispatchAbilityEvent
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

export function distanceToUnit(first, second) {
    return Math.min(...occupiedHexes(first).flatMap(a =>
        occupiedHexes(second).map(b => hexDistance(a, b))
    ));
}

function addEvent(state, event) {
    const turn = ensureTurnState(state);
    const record = { turn: state.turn, ...event };
    turn.events.push(record);
    state.log.unshift({ kind: 'event', ...record });
}

function resolveAttack(state, spec, queue, rules) {
    const attacker = state.units.find(unit => unit.id === spec.attackerId);
    const target = state.units.find(unit => unit.id === spec.targetId);

    if (!attacker || !target || attacker.team === target.team) {
        throw Error('Choose an attacker and an opposing target.');
    }
    if (target.stats.health <= 0) {
        throw Error('Target has no health remaining.');
    }

    const attackType = spec.attackType ?? 'melee';
    const profile = spec.profile ?? attacker.attacks?.[attackType];
    if (!profile || !Number.isFinite(profile.hits) || profile.hits < 1 || !Number.isFinite(getProfilePierce(profile))) {
        throw Error('Configure the attack hits and pierce before resolving this attack.');
    }

    // The selected attack profile determines range; multi-hex footprints count in full.
    if (spec.kind === 'normal' && attackType === 'melee' && !adjacentToUnit(attacker, target)) {
        throw Error('Melee attacks require adjacency to the target footprint.');
    }
    if (spec.kind === 'normal' && attackType === 'ranged') {
        const distance = distanceToUnit(attacker, target);
        if (distance <= 1) {
            throw Error('Adjacent targets must use the melee profile.');
        }
        if (distance > (profile.range ?? 3)) {
            throw Error('Target is outside the configured ranged attack distance.');
        }
    }

    const payload = {
        attacker,
        target,
        kind: spec.kind,
        hits: Math.floor(profile.hits),
        damageMultiplier: 1,
        flatDamageBonus: spec.flatBonus ?? 0
    };
    const context = {
        state,
        rules,
        adjacentToUnit,
        emit: event => addEvent(state, event),
        enqueue: attack => queue.push(attack)
    };

    dispatchAbilityEvent(context, 'BEFORE_ATTACK', payload);
    const pierce = Math.max(0, Math.min(1, getProfilePierce(profile) / 100));
    const rawPerHit = Math.max(0, (attacker.stats.damage + payload.flatDamageBonus) * payload.damageMultiplier);
    let damage = 0;
    const hitDamage = [];

    addEvent(state, { type: 'ATTACK_STARTED', attackerId: attacker.id,
        detail: `${spec.kind}, ${payload.hits} hits, ${profile.damageType ?? 'custom'} (${getProfilePierce(profile)}% pierce), ${payload.damageMultiplier.toFixed(3)}x` });

    for (let index = 0; index < payload.hits && target.stats.health > 0; index++) {
        dispatchAbilityEvent(context, 'BEFORE_HIT', { ...payload, hitIndex: index });
        const calculated = Math.floor(Math.max(rawPerHit - target.stats.armour, rawPerHit * pierce, 0));
        const actual = Math.min(calculated, target.stats.health);
        target.stats.health -= actual;
        damage += actual;
        hitDamage.push(actual);
        recordResolvedHit(state, attacker.id, actual);
        addEvent(state, { type: 'HIT_RESOLVED', attackerId: attacker.id, targetId: target.id,
            source: spec.source ?? spec.kind, hit: index + 1, damage: actual,
            detail: `${actual.toLocaleString()} damage (hit ${index + 1}/${payload.hits}; ${profile.damageType ?? 'custom'}, ${getProfilePierce(profile)}% pierce; raw ${rawPerHit.toFixed(0)}, armour ${target.stats.armour})` });
        dispatchAbilityEvent(context, 'HIT_RESOLVED', { ...payload, hitIndex: index, damage: actual });
    }

    ensureBattleState(state).attacksByUnit[attacker.id] =
        (state.battle.attacksByUnit[attacker.id] ?? 0) + 1;

    if (spec.kind === 'active') {
        completedActive(state, attacker.id, target.id);
        addEvent(state, { type: 'ACTIVE_COMPLETED', attackerId: attacker.id,
            detail: `${attacker.name} active completed` });
        dispatchAbilityEvent(context, 'ACTIVE_COMPLETED', payload);
    }

    addEvent(state, { type: 'ATTACK_COMPLETED', attackerId: attacker.id,
        detail: `${damage.toLocaleString()} total damage` });
    dispatchAbilityEvent(context, 'ATTACK_COMPLETED', payload);
    return { damage, hits: hitDamage.length, hitDamage };
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
    const queue = [{
        ...options,
        kind: active ? 'active' : 'normal',
        source: active ? `${actor.name} active (provisional)` : 'Normal attack',
        profile: active && actor.activeAttack
            ? { ...actor.activeAttack }
            : undefined
    }];
    const rules = { ...DEFAULT_RULES, ...state.rules };
    let processed = 0;

    while (queue.length > 0) {
        if (++processed > 100) {
            throw Error('Triggered attack safety limit exceeded.');
        }
        resolveAttack(state, queue.shift(), queue, rules);
    }

    turn.acted[actor.id] = true;
    addEvent(state, { type: 'ACTION_COMPLETED', attackerId: actor.id,
        detail: `${actor.name} finished their action` });
    return state;
}

export function advanceTurn(previous) {
    const state = clone(previous);
    state.turn++;
    resetTurnState(state);
    state.log.unshift({ kind: 'turn', turn: state.turn });
    return state;
}
