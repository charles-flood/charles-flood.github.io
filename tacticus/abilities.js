// Rules that are not fully verified are explicitly configurable.
// Events distinguish the owner of an attack from the unit whose ability caused it.

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
    if (attackerId === 'laviscus' || turn.laviscusLocked !== null) {
        return;
    }
    turn.highestHitByUnit[attackerId] = Math.max(
        turn.highestHitByUnit[attackerId] ?? 0,
        damage
    );
}

export function laviscusSnapshot(state) {
    const turn = ensureTurnState(state);
    if (turn.laviscusLocked === null) {
        const contributions = { ...turn.highestHitByUnit };
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
}
