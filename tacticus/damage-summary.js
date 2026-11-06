/** Aggregate actual resolved hit damage, never attack estimates or bonus announcements. */
export function summarizeDamage(log = [], currentTurn = 1) {
    const byTurn = {};
    const byCharacter = {};
    let battleTotal = 0;

    for (const entry of log) {
        if (entry.type !== 'HIT_RESOLVED' || !Number.isFinite(entry.damage)) {
            continue;
        }

        const amount = Math.max(0, entry.damage);
        battleTotal += amount;
        byTurn[entry.turn] = (byTurn[entry.turn] ?? 0) + amount;
        byCharacter[entry.attackerId] = (byCharacter[entry.attackerId] ?? 0) + amount;
    }

    return {
        battleTotal,
        currentTurnTotal: byTurn[currentTurn] ?? 0,
        byTurn,
        byCharacter
    };
}
