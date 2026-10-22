// Intentionally provisional combat model. NOT a verified Tacticus damage formula.
export const clone = (value) => structuredClone(value);
export const key = ({ q, r }) => `${q},${r}`;
export function makeTiles(cols = 9, rows = 6) {
    return Array.from({ length: cols * rows }, (_, i) => ({ q: i % cols, r: Math.floor(i / cols), elevation: 0 }));
}
export function attack(state, attackerId, targetId, flatBonus = 0) {
    const next = clone(state),
        a = next.units.find((u) => u.id === attackerId),
        t = next.units.find((u) => u.id === targetId);
    if (!a || !t || a.team === t.team) throw Error('Select an attacker and an opposing target.');
    if (a.stats.damage <= 0) throw Error('Enter a positive Damage / hit value for the attacker first.');
    if (t.stats.health <= 0) throw Error('Enter the target’s current health first.');
    const hits = Math.max(1, Math.floor(a.stats.hits)),
        pierce = Math.max(0, Math.min(1, a.stats.pierce / 100));
    const rawPerHit = Math.max(0, a.stats.damage + flatBonus);
    // Simplified approximation: armour cannot reduce damage below pierce-protected portion.
    const afterArmour = Math.max(rawPerHit - t.stats.armour, rawPerHit * pierce, 0);
    const perHit = Math.floor(afterArmour),
        damage = Math.min(t.stats.health, perHit * hits);
    t.stats.health -= damage;
    const entry = {
        turn: next.turn,
        attacker: a.name,
        target: t.name,
        hits,
        rawPerHit,
        armour: t.stats.armour,
        pierce: a.stats.pierce,
        perHit,
        damage,
        remaining: t.stats.health,
        kind: 'attack',
    };
    next.log.unshift(entry);
    return next;
}
