// Provisional parameters. Replace with verified ability-level values after video testing.
// Every effect is an event listener; the combat engine does not branch on unit IDs.
export const DEFAULT_RULES = {
    kariyanGrowthPerAttack: 0.10,
    kariyanGrowthStacking: 'additive',
    laviscusHighestHitPercentage: 0.20,
    trajannExtraHits: 2
};

export const ABILITY_DEFINITIONS = [
    { ownerId: 'kariyan', id: 'kariyanGrowth', event: 'BEFORE_ATTACK', handler: 'growth' },
    { ownerId: 'kariyan', id: 'kariyanFollowUp', event: 'ATTACK_COMPLETED', handler: 'followUp',
        attack: { hits: 1, damageType: 'piercing', pierce: 80, range: 1 }, requiresTargetTrait: 'Big Target' },
    { ownerId: 'trajann', id: 'trajannExtraHits', event: 'BEFORE_ATTACK', handler: 'extraHits' },
    { ownerId: 'laviscus', id: 'laviscusSnapshot', event: 'BEFORE_ATTACK', handler: 'snapshot' }
];

export function ensureBattleState(state) {
    state.battle ??= { attacksByUnit: {} };
    state.battle.attacksByUnit ??= {};
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
    return state.combat;
}

export function resetTurnState(state) {
    state.combat = {
        highestHitByUnit: {},
        acted: {},
        completedActives: [],
        trajannConsumed: {},
        laviscusLocked: null,
        events: []
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
    ensureTurnState(state).completedActives.push({ actorId, targetId });
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

        if (definition.handler === 'growth' && payload.attacker.id === owner.id) {
            const previous = battle.attacksByUnit[owner.id] ?? 0;
            const rate = rules.kariyanGrowthPerAttack;
            const multiplier = rules.kariyanGrowthStacking === 'multiplicative'
                ? Math.pow(1 + rate, previous)
                : 1 + rate * previous;
            payload.damageMultiplier *= multiplier;
            emit({ type: 'DAMAGE_GROWTH', attackerId: owner.id, detail: `Attack ${previous + 1}: ${multiplier.toFixed(3)}x` });
        }

        if (definition.handler === 'extraHits' && payload.kind !== 'normal' &&
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

        if (definition.handler === 'snapshot' && payload.attacker.id === owner.id) {
            const snapshot = laviscusSnapshot(state, owner.id);
            payload.flatDamageBonus += snapshot.total * rules.laviscusHighestHitPercentage;
            emit({ type: 'LAVISCUS_SNAPSHOT', attackerId: owner.id,
                detail: `Highest hits ${JSON.stringify(snapshot.contributions)}; ${
                    (rules.laviscusHighestHitPercentage * 100).toFixed(1)}% of ${snapshot.total}` });
        }

        if (definition.handler === 'followUp' && payload.attacker.id === owner.id &&
            payload.kind !== 'passive' && payload.target.stats.health > 0 &&
            payload.target.traits?.includes(definition.requiresTargetTrait)) {
            context.enqueue({ attackerId: owner.id, targetId: payload.target.id,
                kind: 'passive', source: 'Kariyan follow-up passive (provisional)',
                profile: { ...definition.attack } });
        }
    }
}
