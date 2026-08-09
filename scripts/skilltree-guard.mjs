#!/usr/bin/env node
// Skilltree-Vertrag: ein Effekt darf wachsen, nie schrumpfen.
//
//   node scripts/skilltree-guard.mjs snapshot   Friert den aktuellen Stand ein
//   node scripts/skilltree-guard.mjs verify     Prueft Arbeitsstand gegen Snapshot
//
// Erlaubt (Level-up):
//   - neue Effekte
//   - neue Props
//   - neue Optionen in einem select-Prop
//   - erweiterte range-Grenzen (min kleiner, max groesser)
//   - geaenderte Texte: description, bestFor, Notizen
//
// Verboten (Redesign / Rueckbau):
//   - Effekt entfernt oder umbenannt (id, name, importPath)
//   - Prop entfernt oder umbenannt
//   - Prop-Typ geaendert
//   - Default-Wert geaendert   <- haelt die Optik bestehender Einbauten stabil
//   - select-Option entfernt
//   - range-Grenzen enger gezogen
//
// Der letzte Punkt ist der wichtigste: solange kein Default wandert, sieht jede
// Website, die den Effekt heute einbindet, ihn morgen genauso. Neue Moeglich-
// keiten liegen daneben, statt das Bestehende zu ersetzen.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { catalogFilesIn, readEffects, workingTreeReader } from './lib/catalog-parse.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const EFFECTS_DIR = join(ROOT, 'src', 'motion-arsenal', 'effects');
const CONTRACTS = join(ROOT, '.nox', 'effect-contracts.json');

function currentEffects() {
  return readEffects({
    files: catalogFilesIn(EFFECTS_DIR, ROOT),
    read: workingTreeReader(ROOT),
  });
}

// Nur der oeffentliche Vertrag wird eingefroren, nicht die Beschreibungstexte —
// sonst schlaegt jede Textverbesserung als Verletzung an.
function contractOf(effect) {
  return {
    id: effect.id,
    name: effect.name,
    category: effect.category,
    importPath: effect.importPath,
    props: effect.props.map((p) => ({
      key: p.key,
      type: p.type,
      default: p.default,
      ...(p.min !== undefined ? { min: p.min } : {}),
      ...(p.max !== undefined ? { max: p.max } : {}),
      ...(p.options ? { options: p.options } : {}),
    })),
  };
}

function snapshot() {
  const effects = currentEffects();
  const payload = {
    schemaVersion: '1.0.0',
    capturedAt: new Date().toISOString(),
    note: 'Oeffentlicher Vertrag jedes Effekts. Der Skilltree-Guard prueft Aenderungen dagegen. Nur bewusst und mit Begruendung neu schreiben.',
    effects: Object.fromEntries(effects.map((e) => [e.id, contractOf(e)])),
  };
  writeFileSync(CONTRACTS, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`Snapshot geschrieben: ${effects.length} Effekte, ${effects.reduce((n, e) => n + e.props.length, 0)} Props`);
}

function verify() {
  if (!existsSync(CONTRACTS)) {
    console.error('Kein Snapshot vorhanden. Einmalig: node scripts/skilltree-guard.mjs snapshot');
    process.exit(2);
  }
  const baseline = JSON.parse(readFileSync(CONTRACTS, 'utf8'));
  const effects = currentEffects();
  const byId = new Map(effects.map((e) => [e.id, e]));

  const violations = [];
  const growth = [];

  for (const [id, before] of Object.entries(baseline.effects)) {
    const after = byId.get(id);
    if (!after) {
      violations.push(`${id}: Effekt fehlt im Katalog (entfernt oder ID umbenannt)`);
      continue;
    }
    if (after.name !== before.name) {
      violations.push(`${id}: Komponentenname geaendert (${before.name} -> ${after.name})`);
    }
    if (after.importPath !== before.importPath) {
      violations.push(`${id}: importPath geaendert (${before.importPath} -> ${after.importPath})`);
    }

    const afterProps = new Map(after.props.map((p) => [p.key, p]));
    for (const prop of before.props) {
      const now = afterProps.get(prop.key);
      if (!now) {
        violations.push(`${id}.${prop.key}: Prop entfernt oder umbenannt`);
        continue;
      }
      if (now.type !== prop.type) {
        violations.push(`${id}.${prop.key}: Typ geaendert (${prop.type} -> ${now.type})`);
      }
      if (now.default !== prop.default) {
        violations.push(
          `${id}.${prop.key}: Default geaendert (${JSON.stringify(prop.default)} -> ${JSON.stringify(now.default)}) — das veraendert bestehende Einbauten`,
        );
      }
      for (const option of prop.options ?? []) {
        if (!(now.options ?? []).includes(option)) {
          violations.push(`${id}.${prop.key}: Option "${option}" entfernt`);
        }
      }
      if (prop.min !== undefined && now.min !== undefined && now.min > prop.min) {
        violations.push(`${id}.${prop.key}: min enger gezogen (${prop.min} -> ${now.min})`);
      }
      if (prop.max !== undefined && now.max !== undefined && now.max < prop.max) {
        violations.push(`${id}.${prop.key}: max enger gezogen (${prop.max} -> ${now.max})`);
      }

      const newOptions = (now.options ?? []).filter((o) => !(prop.options ?? []).includes(o));
      if (newOptions.length) growth.push(`${id}.${prop.key}: +${newOptions.length} Option(en) — ${newOptions.join(', ')}`);
    }

    const beforeKeys = new Set(before.props.map((p) => p.key));
    const newProps = after.props.filter((p) => !beforeKeys.has(p.key));
    if (newProps.length) growth.push(`${id}: +${newProps.length} Prop(s) — ${newProps.map((p) => p.key).join(', ')}`);
  }

  for (const effect of effects) {
    if (!baseline.effects[effect.id]) growth.push(`${effect.id}: neuer Effekt (${effect.props.length} Props)`);
  }

  console.log(`\nSkilltree-Guard — ${effects.length} Effekte gegen Snapshot vom ${String(baseline.capturedAt).slice(0, 10)}\n`);

  if (growth.length) {
    console.log(`Level-ups (${growth.length}):`);
    for (const line of growth) console.log(`  +  ${line}`);
    console.log('');
  } else {
    console.log('Keine Erweiterungen gefunden.\n');
  }

  if (violations.length) {
    console.log(`VERTRAGSBRUCH (${violations.length}) — dieser Stand darf nicht gemerged werden:`);
    for (const line of violations) console.log(`  !  ${line}`);
    console.log('');
    process.exit(1);
  }

  console.log('Vertrag eingehalten: nichts entfernt, nichts umdesignt.\n');
}

const command = process.argv[2] || 'verify';
if (command === 'snapshot') snapshot();
else if (command === 'verify') verify();
else {
  console.error(`Unbekanntes Kommando: ${command}. Erlaubt: snapshot, verify`);
  process.exit(2);
}
