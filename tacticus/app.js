import { clone, key, makeTiles, attack, performCombatAction, advanceTurn, occupiedHexes, isOccupied, offsetToAxial, axialToOffset } from './engine.js';
const $ = id => document.getElementById(id);
const storageKey = 'tacticus-raid-lab-v1';
let state, initial, history = [], selectedId = 'trajann', selectedTile = null, tool = 'move';
const fields = ['health', 'armour', 'damage', 'xpLevel', 'activeLevel', 'passiveLevel'];
const attackFields = {
    meleeHits: ['melee', 'hits'],
    meleePierce: ['melee', 'pierce'],
    rangedHits: ['ranged', 'hits'],
    rangedPierce: ['ranged', 'pierce']
};
async function boot() {
    try {
        const [characters, bosses] = await Promise.all(['./data/characters.json', './data/bosses.json'].map(url => fetch(url).then(r => { if (!r.ok)
            throw Error(`Could not load ${url}`); return r.json(); })));
        initial = { units: [...characters, ...bosses], tiles: makeTiles(), turn: 1, log: [] };
        try {
            const saved = JSON.parse(localStorage.getItem(storageKey));
            state = validState(saved) ? migrateState(saved) : clone(initial);
        }
        catch {
            state = clone(initial);
        }
        bind();
        render();
    }
    catch (err) {
        document.body.insertAdjacentHTML('beforeend', `<p style="padding:20px;color:salmon">Unable to load data: ${escapeHTML(err.message)}. Serve this directory using GitHub Pages or a local HTTP server, not file://.</p>`);
    }
}
function validState(s) { return s && Array.isArray(s.units) && Array.isArray(s.tiles) && Array.isArray(s.log) && Number.isInteger(s.turn) && s.units.some(u => u.id === 'screamer-killer'); }
function migrateState(saved) {
    // Existing local saves intentionally override the new JSON reference defaults.
    // Extend old 9 × 6 saves without erasing stats, positions or combat logs.
    const existing = new Set(saved.tiles.map(key));
    for (const tile of makeTiles(9, 11)) {
        if (!existing.has(key(tile)))
            saved.tiles.push(tile);
    }
    for (const unit of saved.units) {
        const reference = initial.units.find(item => item.id === unit.id);
        if (reference) {
            unit.progression ??= clone(reference.progression);
            unit.difficulty ??= reference.difficulty;
            unit.attacks ??= clone(reference.attacks);
            for (const mode of ['melee', 'ranged']) {
                const current = unit.attacks?.[mode];
                const expected = reference.attacks?.[mode];
                if (!current || !expected) {
                    continue;
                }
                // Upgrade unset placeholder profiles, but preserve edited values.
                if (!current.damageType && (current.pierce == null || current.pierce === 0 ||
                    (unit.id === 'trajann' && current.pierce === 100))) {
                    unit.attacks[mode] = clone(expected);
                }
            }
            unit.activeAttack ??= clone(reference.activeAttack);
            // Old saves only had a single hit count. Preserve its edited melee values.
            if (unit.attacks?.melee && unit.stats.hits != null && !unit.attacksMigrated) {
                unit.attacks.melee.hits = unit.stats.hits;
                unit.attacks.melee.pierce = unit.stats.pierce;
                unit.attacksMigrated = true;
            }
        }
        if (unit.type === 'boss' && !unit.footprint) {
            unit.footprint = clone(initial.units.find(item => item.id === unit.id)?.footprint || [{ q: 0, r: 0 }]);
        }
    }
    return saved;
}
function escapeHTML(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function unit(id) { return state.units.find(u => u.id === id); }
function tile(q, r) { return state.tiles.find(t => t.q === q && t.r === r); }
function snapshot() { history.push(clone(state)); if (history.length > 100)
    history.shift(); }
function render() {
    renderBoard();
    renderSelects();
    renderInspector();
    renderLog();
    renderTurnSummary();
    $('undoBtn').disabled = !history.length;
}

function renderTurnSummary() {
    const combat = state.combat || {};
    const contributions = combat.laviscusLocked?.contributions || combat.highestHitByUnit || {};
    const total = Object.values(contributions).reduce((sum, value) => sum + value, 0);
    const rows = Object.entries(contributions).map(([id, amount]) => {
        const name = unit(id)?.name || id;
        return `${escapeHTML(name)}: ${Number(amount).toLocaleString()}`;
    });
    const status = combat.laviscusLocked ? 'Locked after Laviscus acted' : 'Live before Laviscus acts';
    $('turnSummary').innerHTML = `<strong>Laviscus: ${total.toLocaleString()} (${status})</strong>` +
        `<small style="display:block">${rows.join(' · ') || 'No qualifying hits yet'}</small>` +
        `<small style="display:block">Provisional application to damage; actual ability scaling unverified.</small>`;
}

function renderSelects() {
    const unitOpts = state.units.map(u => `<option value="${escapeHTML(u.id)}">${escapeHTML(u.name)}</option>`).join('');
    $('unitSelect').innerHTML = unitOpts;
    $('unitSelect').value = selectedId;
    const attacker = $('attackerSelect').value, target = $('targetSelect').value;
    $('attackerSelect').innerHTML = state.units.filter(u => u.team === 'ally').map(u => `<option value="${u.id}">${escapeHTML(u.name)}</option>`).join('');
    $('targetSelect').innerHTML = state.units.filter(u => u.team === 'enemy').map(u => `<option value="${u.id}">${escapeHTML(u.name)}</option>`).join('');
    $('attackerSelect').value = state.units.some(u => u.id === attacker && u.team === 'ally') ? attacker : (unit(selectedId)?.team === 'ally' ? selectedId : 'trajann');
    $('targetSelect').value = target || 'screamer-killer';
}
function renderInspector() {
    const selectedUnit = unit(selectedId);
    if (!selectedUnit) return;

    const progression = selectedUnit.progression;
    $('progressionInfo').textContent = selectedUnit.type === 'boss'
        ? `Raid difficulty: ${selectedUnit.difficulty || 'Custom'}`
        : `${progression?.rank || 'Custom'} · ${progression?.rarity || 'Custom'} · ${progression?.stars || 'Custom'} · XP ${selectedUnit.stats.xpLevel}`;

    for (const field of fields) {
        $(field).value = selectedUnit.stats[field] ?? 0;
    }

    for (const [id, [mode, property]] of Object.entries(attackFields)) {
        $(id).value = selectedUnit.attacks?.[mode]?.[property] ?? '';
    }

    $('notes').value = selectedUnit.notes || '';
    $('footprintField').hidden = selectedUnit.type !== 'boss';
    $('footprintInput').value = JSON.stringify(selectedUnit.footprint || [{ q: 0, r: 0 }], null, 2);

    const selected = selectedTile ? tile(selectedTile.q, selectedTile.r) : null;
    $('elevationInput').value = selected?.elevation ?? 0;
    $('elevationInput').disabled = !selected;
    $('tileInfo').textContent = selected
        ? `Hex (${selected.q}, ${selected.r}) · elevation ${selected.elevation}`
        : 'Select a tile';

    $('moveTool').classList.toggle('active', tool === 'move');
    $('heightTool').classList.toggle('active', tool === 'elevation');
}

function renderBoard() {
    const svg = $('board');
    svg.replaceChildren();
    const ns = 'http://www.w3.org/2000/svg', radius = 43, xStep = Math.sqrt(3) * radius, yStep = radius * 1.5, ox = 70, oy = 68;
    svg.setAttribute('viewBox', `0 0 ${ox + 9 * xStep + radius} ${oy + 10 * yStep + radius}`);
    const node = (name, attrs, parent = svg) => { const el = document.createElementNS(ns, name); for (const [k, v] of Object.entries(attrs))
        el.setAttribute(k, v); parent.appendChild(el); return el; };
    const xy = (q, r) => ({ x: ox + q * xStep + (r % 2) * xStep / 2, y: oy + r * yStep });
    for (const t of state.tiles) {
        const { x, y } = xy(t.q, t.r), points = Array.from({ length: 6 }, (_, i) => { const a = (60 * i - 30) * Math.PI / 180; return `${x + radius * Math.cos(a)},${y + radius * Math.sin(a)}`; }).join(' ');
        const p = node('polygon', { points, fill: t.elevation > 0 ? '#34463b' : t.elevation < 0 ? '#1a2835' : '#253747', class: `hex ${selectedTile && key(selectedTile) === key(t) ? 'selected' : ''}` });
        p.addEventListener('click', () => onHex(t));
        if (t.elevation !== 0) {
            const l = node('text', { x, y: y + 29, class: 'tile-label' });
            l.textContent = `${t.elevation > 0 ? '+' : ''}${t.elevation}`;
        }
    }
    for (const u of state.units) {
        if (u.type === 'boss') {
            for (const position of occupiedHexes(u)) {
                const { x, y } = xy(position.q, position.r);
                const points = Array.from({ length: 6 }, (_, i) => { const angle = (60 * i - 30) * Math.PI / 180; return `${x + radius * .91 * Math.cos(angle)},${y + radius * .91 * Math.sin(angle)}`; }).join(' ');
                const hex = node('polygon', { points, fill: '#b55a57', opacity: '0.72', class: 'boss-footprint' });
                hex.addEventListener('click', () => { selectedId = u.id; selectedTile = { ...position }; render(); });
            }
        }
        const { x, y } = xy(u.position.q, u.position.r), g = node('g', { class: `unit-token ${u.team === 'enemy' ? 'boss' : ''} ${u.id === selectedId ? 'selected' : ''}` });
        node('circle', { cx: x, cy: y, r: u.team === 'enemy' ? 25 : 21, fill: u.team === 'enemy' ? '#b55a57' : '#64c9ba' }, g);
        const txt = node('text', { x, y: y + 1 }, g);
        txt.textContent = u.short;
        g.addEventListener('click', () => { selectedId = u.id; selectedTile = { ...u.position }; render(); });
        const title = node('title', {}, g);
        title.textContent = u.name;
    }
}
function onHex(t) { selectedTile = { q: t.q, r: t.r }; if (tool === 'move') {
    const u = unit(selectedId);
    if (u && u.team === 'ally' && !isOccupied(state, t, u.id)) {
        snapshot();
        u.position = { q: t.q, r: t.r };
    }
}
else if (tool === 'elevation') {
    $('elevationInput').focus();
} render(); }
function renderLog() {
    const attackCount = state.log.filter(entry => entry.kind === 'attack').length;
    $('turnLabel').textContent = `Turn ${state.turn} • ${attackCount} attacks`;

    if (!state.log.length) {
        $('log').innerHTML = '<div class="empty">No attacks yet. Set damage and boss health, then resolve an attack.</div>';
        return;
    }

    $('log').innerHTML = state.log.map(entry => {
        if (entry.kind === 'event') {
            return `<div class="log-entry"><strong>${escapeHTML(entry.type)}</strong><small>${escapeHTML(entry.detail || '')}</small></div>`;
        }
        if (entry.kind === 'turn') {
            return `<div class="log-entry"><strong>Turn ${entry.turn} started</strong></div>`;
        }

        return `<div class="log-entry">
            <strong>Turn ${entry.turn}: ${escapeHTML(entry.attacker)} → ${escapeHTML(entry.target)} · ${entry.damage.toLocaleString()} damage</strong>
            <small>${entry.attackType || 'melee'}: ${entry.hits} hits × ${entry.perHit.toLocaleString()} effective damage; raw ${entry.rawPerHit.toLocaleString()}/hit, armour ${entry.armour.toLocaleString()}, pierce ${entry.pierce}%. Target HP remaining: ${entry.remaining.toLocaleString()}.</small>
            <small>Provisional armour formula; no range, elevation, critical, blocks or ability effects applied.</small>
        </div>`;
    }).join('');
}

function bind() {
    $('unitSelect').addEventListener('change', e => { selectedId = e.target.value; selectedTile = { ...unit(selectedId).position }; render(); });
    fields.forEach(f => $(f).addEventListener('change', e => { const n = Number(e.target.value); if (!Number.isFinite(n))
        return; snapshot(); unit(selectedId).stats[f] = Math.max(0, n); render(); }));
    for (const [id, [mode, property]] of Object.entries(attackFields)) {
        $(id).addEventListener('change', e => { const raw = e.target.value.trim(); const n = raw === '' ? null : Number(raw); if (n !== null && !Number.isFinite(n))
            return; snapshot(); const u = unit(selectedId); u.attacks ??= {}; u.attacks[mode] ??= {}; u.attacks[mode][property] = n === null ? null : Math.max(0, n); render(); });
    }
    $('notes').addEventListener('change', e => { snapshot(); unit(selectedId).notes = e.target.value; });
    $('footprintInput').addEventListener('change', e => {
        const boss = unit(selectedId);
        if (boss?.type !== 'boss')
            return;
        try {
            const offsets = JSON.parse(e.target.value);
            if (!Array.isArray(offsets) || offsets.length < 1 || offsets.length > 20 || !offsets.every(p => Number.isInteger(p.q) && Number.isInteger(p.r)))
                throw Error('Use an array of {"q": integer, "r": integer} offsets (1–20 hexes).');
            if (!offsets.some(p => p.q === 0 && p.r === 0))
                throw Error('The footprint must include {"q":0,"r":0} as its anchor.');
            const positions = offsets.map(offset => {
                const anchor = offsetToAxial(boss.position);
                return axialToOffset({ q: anchor.q + offset.q, r: anchor.r + offset.r });
            });
            if (positions.some(pos => !tile(pos.q, pos.r)))
                throw Error('Footprint extends outside the battlefield.');
            if (new Set(positions.map(key)).size !== positions.length)
                throw Error('Duplicate footprint hexes.');
            if (positions.some(pos => isOccupied({ units: state.units.filter(u => u.id !== boss.id) }, pos)))
                throw Error('Footprint overlaps another unit.');
            snapshot();
            boss.footprint = offsets;
            render();
        }
        catch (err) {
            alert(err.message);
            renderInspector();
        }
    });
    $('moveTool').onclick = () => { tool = 'move'; renderInspector(); };
    $('heightTool').onclick = () => { tool = 'elevation'; renderInspector(); };
    $('elevationInput').onchange = e => { if (!selectedTile)
        return; snapshot(); tile(selectedTile.q, selectedTile.r).elevation = Math.max(-3, Math.min(3, Math.round(Number(e.target.value) || 0))); render(); };
    $('attackBtn').onclick = () => {
        try {
            const next = performCombatAction(state, {
                attackerId: $('attackerSelect').value,
                targetId: $('targetSelect').value,
                kind: $('actionKind').value,
                attackType: $('attackType').value,
                flatBonus: Number($('bonusInput').value) || 0
            });
            snapshot();
            state = next;
            render();
        } catch (error) {
            alert(error.message);
        }
    };
    $('undoBtn').onclick = () => { if (history.length) {
        state = history.pop();
        render();
    } };
    $('nextTurnBtn').onclick = () => { snapshot(); state = advanceTurn(state); render(); };
    $('resetBattleBtn').onclick = () => { if (!confirm('Reset combat history and turn counter? Unit stats and positions will remain.'))
        return; snapshot(); state.log = []; state.turn = 1; state.combat = undefined; state.battle = undefined; render(); };
    $('clearLogBtn').onclick = () => { snapshot(); state.log = []; render(); };
    $('loadStatsBtn').onclick = () => { if (!confirm('Replace character and boss stats with bundled reference values? Positions and combat log will be kept.'))
        return; snapshot(); for (const u of state.units) {
        const ref = initial.units.find(x => x.id === u.id);
        if (ref) {
            u.stats = clone(ref.stats);
            u.attacks = clone(ref.attacks);
            u.progression = clone(ref.progression);
            u.difficulty = ref.difficulty;
            u.attacksMigrated = true;
        }
    } render(); };
    $('resetDefaultsBtn').onclick = () => { if (!confirm('Replace all units, stats, positions and combat history with reference defaults? Your current browser configuration will be lost.'))
        return; snapshot(); state = clone(initial); selectedId = 'trajann'; selectedTile = null; localStorage.removeItem(storageKey); render(); };
    $('resetPositions').onclick = () => { snapshot(); for (const u of state.units) {
        const orig = initial.units.find(v => v.id === u.id);
        if (orig)
            u.position = clone(orig.position);
    } render(); };
    $('saveBtn').onclick = () => { try {
        localStorage.setItem(storageKey, JSON.stringify(state));
        $('saveBtn').textContent = 'Saved ✓';
        setTimeout(() => $('saveBtn').textContent = 'Save locally', 1500);
    }
    catch (e) {
        alert('Save failed: ' + e.message);
    } };
    $('exportBtn').onclick = () => { const blob = new Blob([JSON.stringify({ schemaVersion: 1, ...state }, null, 2)], { type: 'application/json' }), url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = 'tacticus-raid-lab.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); };
    $('importFile').onchange = async (e) => { const file = e.target.files?.[0]; if (!file)
        return; try {
        const loaded = JSON.parse(await file.text());
        if (!validState(loaded))
            throw Error('Invalid raid lab save file');
        snapshot();
        state = migrateState({ units: loaded.units, tiles: loaded.tiles, turn: loaded.turn, log: loaded.log });
        selectedId = state.units[0].id;
        render();
    }
    catch (err) {
        alert('Import failed: ' + err.message);
    } e.target.value = ''; };
}
boot();
