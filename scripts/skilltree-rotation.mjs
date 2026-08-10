#!/usr/bin/env node
// Skilltree-Rotation: waehlt die Effekte des Tages und fuehrt Buch darueber.
//
//   node scripts/skilltree-rotation.mjs pick [--count 4] [--json]
//   node scripts/skilltree-rotation.mjs complete --ids a,b,c,d [--notes "..."]
//   node scripts/skilltree-rotation.mjs status
//
// Jeder Effekt kommt genau einmal pro Runde dran. Ist die Runde durch, beginnt
// eine neue und alle Effekte steigen ein Level. So bekommt der 159. Effekt
// dieselbe Aufmerksamkeit wie der erste, statt dass die Automation immer
// wieder an denselben populaeren Effekten haengenbleibt.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { catalogFilesIn, readEffects, workingTreeReader } from './lib/catalog-parse.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const EFFECTS_DIR = join(ROOT, 'src', 'motion-arsenal', 'effects');
const STATE = join(ROOT, '.nox', 'skilltree-rotation.json');
const DEFAULT_COUNT = 4;

const args = process.argv.slice(2);
const command = args[0] || 'status';
function flag(name, fallback = null) {
  const i = args.indexOf(`--${name}`);
  return i === -1 || i === args.length - 1 ? fallback : args[i + 1];
}
const hasFlag = (name) => args.includes(`--${name}`);

function effects() {
  return readEffects({ files: catalogFilesIn(EFFECTS_DIR, ROOT), read: workingTreeReader(ROOT) });
}

function loadState() {
  if (!existsSync(STATE)) {
    return { schemaVersion: '1.0.0', round: 1, doneThisRound: [], effects: {}, history: [] };
  }
  return JSON.parse(readFileSync(STATE, 'utf8'));
}

function saveState(state) {
  writeFileSync(STATE, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
}

// Reihenfolge innerhalb einer Runde: zuerst was am wenigsten kann.
// Wenig Props heisst wenig Einstellmoeglichkeiten — dort bringt ein Level-up
// am meisten. Bei Gleichstand entscheidet die ID, damit der Lauf reproduzierbar
// bleibt und zwei Maschinen dieselbe Auswahl treffen.
function rank(a, b) {
  if (a.level !== b.level) return a.level - b.level;
  if (a.props !== b.props) return a.props - b.props;
  return a.id.localeCompare(b.id);
}

function candidates(state, all) {
  const done = new Set(state.doneThisRound);
  return all
    .filter((e) => !done.has(e.id))
    .map((e) => ({
      id: e.id,
      displayName: e.displayName,
      category: e.category,
      file: e.file,
      importPath: e.importPath,
      props: e.props.length,
      propKeys: e.props.map((p) => p.key),
      selects: e.props.filter((p) => p.type === 'select').map((p) => ({ key: p.key, options: p.options ?? [] })),
      colors: e.props.filter((p) => p.type === 'color').map((p) => p.key),
      level: state.effects[e.id]?.level ?? 0,
      runs: state.effects[e.id]?.runs ?? 0,
      description: e.description,
    }))
    .sort(rank);
}

function pick() {
  const count = Number(flag('count', DEFAULT_COUNT));
  const all = effects();
  const state = loadState();

  let pool = candidates(state, all);
  // Runde durch: neue Runde, alle steigen ein Level.
  if (pool.length === 0) {
    state.round += 1;
    state.doneThisRound = [];
    for (const id of Object.keys(state.effects)) state.effects[id].level = (state.effects[id].level ?? 0) + 1;
    saveState(state);
    pool = candidates(state, all);
  }

  const chosen = pool.slice(0, count);

  if (hasFlag('json')) {
    console.log(JSON.stringify({ round: state.round, remaining: pool.length, chosen }, null, 2));
    return;
  }

  console.log(`\nSkilltree — Runde ${state.round}, noch ${pool.length} von ${all.length} Effekten offen\n`);
  console.log(`Heute dran (${chosen.length}):\n`);
  for (const e of chosen) {
    console.log(`  ${e.id}`);
    console.log(`    ${e.displayName} · ${e.category} · Level ${e.level} · ${e.props} Props`);
    console.log(`    ${e.file}`);
    if (e.selects.length) {
      for (const s of e.selects) console.log(`    select ${s.key}: ${s.options.join(', ') || '(keine)'}`);
    }
    if (e.colors.length) console.log(`    color: ${e.colors.join(', ')}`);
    console.log('');
  }
  console.log('Abschluss nach getaner Arbeit:');
  console.log(`  node scripts/skilltree-rotation.mjs complete --ids ${chosen.map((e) => e.id).join(',')}\n`);
}

function complete() {
  const ids = String(flag('ids', '')).split(',').map((s) => s.trim()).filter(Boolean);
  if (!ids.length) {
    console.error('Abbruch: --ids fehlt.');
    process.exit(1);
  }
  const known = new Set(effects().map((e) => e.id));
  const unknown = ids.filter((id) => !known.has(id));
  if (unknown.length) {
    console.error(`Abbruch: unbekannte Effekt-IDs: ${unknown.join(', ')}`);
    process.exit(1);
  }

  const state = loadState();
  const today = new Date().toISOString().slice(0, 10);
  for (const id of ids) {
    if (!state.doneThisRound.includes(id)) state.doneThisRound.push(id);
    const entry = state.effects[id] ?? { level: 0, runs: 0 };
    entry.runs += 1;
    entry.lastRun = today;
    state.effects[id] = entry;
  }
  state.history.push({ date: today, round: state.round, ids, notes: flag('notes', '') || undefined });
  saveState(state);

  const total = effects().length;
  console.log(`Eingetragen: ${ids.join(', ')}`);
  console.log(`Runde ${state.round}: ${state.doneThisRound.length}/${total} erledigt.`);
}

function status() {
  const all = effects();
  const state = loadState();
  const pool = candidates(state, all);
  const levels = new Map();
  for (const e of all) {
    const level = state.effects[e.id]?.level ?? 0;
    levels.set(level, (levels.get(level) ?? 0) + 1);
  }
  console.log(`\nSkilltree-Status\n`);
  console.log(`  Runde:            ${state.round}`);
  console.log(`  Effekte gesamt:   ${all.length}`);
  console.log(`  Diese Runde fertig: ${state.doneThisRound.length}`);
  console.log(`  Noch offen:       ${pool.length}`);
  console.log(`  Laeufe insgesamt: ${state.history.length}`);
  console.log(`  Level-Verteilung: ${[...levels.entries()].sort().map(([l, n]) => `L${l}:${n}`).join('  ')}`);
  if (state.history.length) {
    const last = state.history[state.history.length - 1];
    console.log(`  Letzter Lauf:     ${last.date} — ${last.ids.join(', ')}`);
  }
  const perDay = Number(flag('count', DEFAULT_COUNT));
  console.log(`\n  Bei ${perDay} Effekten/Tag ist die Runde in ${Math.ceil(pool.length / perDay)} Tagen durch.\n`);
}

if (command === 'pick') pick();
else if (command === 'complete') complete();
else if (command === 'status') status();
else {
  console.error(`Unbekanntes Kommando: ${command}. Erlaubt: pick, complete, status`);
  process.exit(1);
}
