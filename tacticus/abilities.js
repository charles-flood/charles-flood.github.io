// Provisional parameters. Replace with verified ability-level values after video testing.
// Every effect is an event listener; the combat engine does not branch on unit IDs.
export const DEFAULT_RULES = {
    kariyanGrowthPerTurn: 0.33,
    kariyanGrowthStacking: 'additive',
    laviscusHighestHitPercentage: 1.20,
    trajannExtraHits: 2,
    trajannDamageBonus: 1096,
    vitruviusExtraHitCap: 7477
};

export const ABILITY_DEFINITIONS = [
    { ownerId: 'kariyan', id: 'kariyanGrowth', event: 'BEFORE_ATTACK', handler: 'growth', kinds: ['active', 'passive'] },
    { ownerId: 'kariyan', id: 'kariyanFollowUp', event: 'ATTACK_COMPLETED', handler: 'followUp',
        attack: { hits: 1, damageType: 'piercing', pierce: 80, range: 1, damageRange: [4786, 5983] }, requiresTargetTrait: 'Big Target' },
    { ownerId: 'trajann', id: 'trajannDamageBonus', event: 'BEFORE_ATTACK', handler: 'damageBonus' },
    { ownerId: 'trajann', id: 'trajannExtraHits', event: 'BEFORE_ATTACK', handler: 'extraHits' },
    { ownerId: 'gulgortz', id: 'lightImUp', event: 'ATTACK_COMPLETED', handler: 'followUpNormal',
        attack: { hits: 3, damageType: 'projectile', pierce: 15, range: 3, damageRange: [1496, 1996] } },
    { ownerId: 'vitruvius', id: 'masterAnnihilator', event: 'BEFORE_ATTACK', handler: 'markedExtraHit' },
    { ownerId: 'vitruvius', id: 'masterAnnihilatorMark', event: 'ATTACK_COMPLETED', handler: 'markTarget' },
    { ownerId: 'laviscus', id: 'laviscusSnapshot', event: 'BEFORE_ATTACK', handler: 'snapshot' }
];

export function ensureBattleState(state) {
    state.battle ??= { attacksByUnit: {}, attackTurnsByUnit: {} };
    state.battle.attacksByUnit ??= {};
    state.battle.attackTurnsByUnit ??= {};
    state.battle.masterAnnihilatorTargetId ??= null;
    return state.battle;
}

export function ensureTurnState(state) {
    state.combat ??= {};
    state.combat.highestHitByUnit ??= {};
    state.combat.acted ??= {};
    state.combat.completedActives ??= [];
    state.combat.trajannConsumed ??= {};
    state.combat.laviscusLocked ??= null;
    state.combat.events ??= [];
    state.combat.kariyanActiveThisTurn ??= false;
    state.combat.kariyanFollowUpUsed ??= false;
    return state.combat;
}

export function resetTurnState(state) {
    state.combat = {
        highestHitByUnit: {},
        acted: {},
        completedActives: [],
        trajannConsumed: {},
        laviscusLocked: null,
        events: [],
        kariyanActiveThisTurn: false,
        kariyanFollowUpUsed: false
    };
}

export function recordResolvedHit(state, attackerId, damage) {
    const turn = ensureTurnState(state);
    if (turn.laviscusLocked !== null || state.units.find(unit => unit.id === attackerId)?.team !== 'ally') {
        return;
    }
    turn.highestHitByUnit[attackerId] = Math.max(turn.highestHitByUnit[attackerId] ?? 0, damage);
}

export function laviscusSnapshot(state, ownerId = 'laviscus') {
    const turn = ensureTurnState(state);
    if (turn.laviscusLocked === null) {
        const contributions = Object.fromEntries(
            Object.entries(turn.highestHitByUnit).filter(([id]) => id !== ownerId)
        );
        turn.laviscusLocked = {
            contributions,
            total: Object.values(contributions).reduce((sum, value) => sum + value, 0)
        };
    }
    return turn.laviscusLocked;
}

export function completedActive(state, actorId, targetId) {
    const turn = ensureTurnState(state);
    turn.completedActives.push({ actorId, targetId });
    if (actorId === 'kariyan') {
        turn.kariyanActiveThisTurn = true;
    }
}

export function dispatchAbilityEvent(context, event, payload) {
    const { state, rules, emit, adjacentToUnit } = context;
    const turn = ensureTurnState(state);
    const battle = ensureBattleState(state);

    for (const definition of ABILITY_DEFINITIONS) {
        if (definition.event !== event) {
            continue;
        }
        const owner = state.units.find(unit => unit.id === definition.ownerId);
        if (!owner || owner.stats.health <= 0) {
            continue;
        }

        if (definition.handler === 'growth' && payload.attacker.id === owner.id &&
            (payload.kind === 'active' || (payload.kind === 'passive' &&
                turn.kariyanActiveThisTurn))) {
            // Count previous turns in which this character attacked, not hits or
            // multiple follow-up attacks in the same turn.
            const previousTurns = (battle.attackTurnsByUnit[owner.id] ?? [])
                .filter(turnNumber => turnNumber < state.turn).length;
            const rate = rules.kariyanGrowthPerTurn;
            const multiplier = rules.kariyanGrowthStacking === 'multiplicative'
                ? Math.pow(1 + rate, previousTurns)
                : 1 + rate * previousTurns;
            payload.damageMultiplier *= multiplier;
            emit({ type: 'DAMAGE_GROWTH', attackerId: owner.id,
                detail: `${previousTurns} previous attacking turns: ${multiplier.toFixed(3)}x` });
        }

        if (definition.handler === 'followUpNormal' && payload.attacker.id === owner.id &&
            payload.kind === 'normal' && payload.target.stats.health > 0) {
            context.enqueue({ attackerId: owner.id, targetId: payload.target.id,
                kind: 'passive', source: 'Light Im Up', profile: { ...definition.attack } });
        }

        if (definition.handler === 'markedExtraHit' &&
            battle.masterAnnihilatorTargetId === payload.target.id &&
            payload.attacker.team === 'ally' && payload.damageType !== 'psychic' &&
            !payload.ignoresModifiers) {
            payload.extraHits.push({ source: definition.id, maxDamage: rules.vitruviusExtraHitCap });
            emit({ type: 'BONUS_HITS', attackerId: payload.attacker.id, source: definition.id,
                detail: `+1 hit, final damage cap ${rules.vitruviusExtraHitCap}` });
        }

        if (definition.handler === 'markTarget' && payload.attacker.id === owner.id &&
            payload.kind === 'normal') {
            battle.masterAnnihilatorTargetId = payload.target.id;
            emit({ type: 'TARGET_MARKED', attackerId: owner.id, targetId: payload.target.id,
                source: definition.id, detail: 'Master Annihilator applied after normal attack' });
        }

        if (definition.handler === 'damageBonus' && !payload.ignoresModifiers) {
            const activated = turn.completedActives.some(active => {
                const actor = state.units.find(unit => unit.id === active.actorId);
                return actor?.team === 'ally' && adjacentToUnit(actor, payload.target);
            });
            if (activated) {
                payload.flatDamageBonus += rules.trajannDamageBonus;
                emit({ type: 'DAMAGE_BONUS', attackerId: payload.attacker.id,
                    source: definition.id, detail: `+${rules.trajannDamageBonus} raw damage per hit` });
            }
        }

        if (definition.handler === 'extraHits' && !payload.ignoresModifiers &&
            payload.kind !== 'normal' &&
            !turn.trajannConsumed[payload.attacker.id] && adjacentToUnit(owner, payload.target)) {
            const activated = turn.completedActives.some(active => {
                const actor = state.units.find(unit => unit.id === active.actorId);
                return actor && adjacentToUnit(actor, payload.target);
            });
            if (activated) {
                payload.hits += rules.trajannExtraHits;
                turn.trajannConsumed[payload.attacker.id] = true;
                emit({ type: 'BONUS_HITS', attackerId: payload.attacker.id, source: definition.id,
                    detail: `+${rules.trajannExtraHits} hits` });
            }
        }

        if (definition.handler === 'snapshot' && payload.attacker.id === owner.id &&
            payload.kind === 'normal') {
            const snapshot = laviscusSnapshot(state, owner.id);
            payload.flatDamageBonus += snapshot.total * rules.laviscusHighestHitPercentage;
            emit({ type: 'LAVISCUS_SNAPSHOT', attackerId: owner.id,
                detail: `Highest hits ${JSON.stringify(snapshot.contributions)}; ${
                    (rules.laviscusHighestHitPercentage * 100).toFixed(1)}% of ${snapshot.total}` });
        }

        if (definition.handler === 'followUp' && payload.attacker.id === owner.id &&
            payload.kind !== 'passive' && !turn.kariyanFollowUpUsed && payload.target.stats.health > 0 &&
            payload.target.traits?.includes(definition.requiresTargetTrait)) {
            turn.kariyanFollowUpUsed = true;
            context.enqueue({ attackerId: owner.id, targetId: payload.target.id,
                kind: 'passive', source: 'Kariyan follow-up passive (provisional)',
                profile: { ...definition.attack } });
        }
    }
}
