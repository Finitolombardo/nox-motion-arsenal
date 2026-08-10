#!/usr/bin/env node
// Orchestriert den taeglichen Skilltree-Lauf. Alles Mechanische passiert hier,
// damit der Agent nur den kreativen Teil macht: die Effekte erweitern.
//
//   node scripts/skilltree-run.mjs preflight   Branch anlegen, Auswahl ausgeben
//   node scripts/skilltree-run.mjs finish      Pruefen, committen, deployen
//
// finish bricht bei der ersten roten Pruefung ab und laesst den Branch stehen.
// Nichts wird stillschweigend uebersprungen: was nicht lief, steht im Bericht.

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { git, gitBinary, isPathBroken } from './lib/git.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const STATE = join(ROOT, '.nox', 'skilltree-rotation.json');
const RUN_FILE = join(ROOT, '.nox', 'skilltree-current-run.json');
const BASELINE_CONFIG = join(ROOT, '.nox', 'motion-foundry.json');
const LOCAL_CONFIG = join(ROOT, '.nox', 'motion-foundry.local.json');

const args = process.argv.slice(2);
const command = args[0] || 'preflight';
const hasFlag = (n) => args.includes(`--${n}`);
function flag(name, fallback = null) {
  const i = args.indexOf(`--${name}`);
  return i === -1 || i === args.length - 1 ? fallback : args[i + 1];
}

const today = new Date().toISOString().slice(0, 10);
const g = (a, o) => git(a, { cwd: ROOT, ...o });

function run(command_, { label, env } = {}) {
  console.log(`\n> ${label ?? command_}`);
  try {
    const out = execSync(command_, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, ...env },
    });
    return { ok: true, out };
  } catch (error) {
    return { ok: false, out: `${error.stdout ?? ''}${error.stderr ?? ''}` };
  }
}

// --- preflight --------------------------------------------------------------

function preflight() {
  console.log(`\n=== Skilltree-Lauf ${today} — Preflight ===\n`);

  if (!gitBinary()) {
    console.error('ABBRUCH: kein git-Binary gefunden. Git for Windows reparieren.');
    process.exit(1);
  }
  if (isPathBroken()) {
    console.log(`Hinweis: git nicht im PATH, Fallback aktiv (${gitBinary()}).`);
  }

  const dirty = g(['status', '--porcelain']);
  if (dirty) {
    console.error('ABBRUCH: Arbeitsverzeichnis ist nicht sauber. Der Lauf startet nur auf sauberem Stand:');
    console.error(dirty);
    process.exit(1);
  }

  g(['checkout', 'main']);
  const fetched = g(['fetch', 'fork', 'main'], { allowFail: true });
  if (fetched === null) console.log('Hinweis: fetch von "fork" fehlgeschlagen — es wird auf lokalem main gearbeitet.');
  else g(['merge', '--ff-only', 'fork/main'], { allowFail: true });

  const branch = `skilltree/${today}`;
  const exists = g(['rev-parse', '--verify', branch], { allowFail: true });
  if (exists) {
    console.error(`ABBRUCH: Branch ${branch} existiert bereits — der heutige Lauf ist schon passiert.`);
    process.exit(1);
  }
  g(['checkout', '-b', branch]);
  console.log(`Branch angelegt: ${branch}`);

  const picked = execSync('node scripts/skilltree-rotation.mjs pick --json', { cwd: ROOT, encoding: 'utf8' });
  const plan = JSON.parse(picked);

  mkdirSync(dirname(RUN_FILE), { recursive: true });
  writeFileSync(RUN_FILE, `${JSON.stringify({ date: today, branch, ...plan }, null, 2)}\n`, 'utf8');

  console.log(`\nRunde ${plan.round}, noch ${plan.remaining} Effekte offen.`);
  console.log(`\nHeute zu erweitern:\n`);
  for (const e of plan.chosen) {
    console.log(`  ${e.id}  (Level ${e.level}, ${e.props} Props)`);
    console.log(`    Datei:  ${e.file}`);
    console.log(`    Import: ${e.importPath}`);
    if (e.selects.length) for (const s of e.selects) console.log(`    select ${s.key}: ${s.options.join(', ') || '(leer)'}`);
    if (e.colors.length) console.log(`    color:  ${e.colors.join(', ')}`);
    console.log('');
  }
  console.log('Auftrag steht in docs/SKILLTREE.md. Danach: node scripts/skilltree-run.mjs finish\n');
}

// --- finish -----------------------------------------------------------------

function deployTargetReady() {
  if (!existsSync(LOCAL_CONFIG)) return { ready: false, reason: '.nox/motion-foundry.local.json fehlt' };
  if (!existsSync(join(ROOT, '.vercel', 'project.json'))) return { ready: false, reason: '.vercel/project.json fehlt' };
  const local = JSON.parse(readFileSync(LOCAL_CONFIG, 'utf8'));
  const baseline = JSON.parse(readFileSync(BASELINE_CONFIG, 'utf8'));
  if (local.vercel?.projectId === baseline.vercel.projectId) {
    return { ready: false, reason: 'verlinkt ist noch das fremde Vercel-Projekt' };
  }
  return { ready: true, domain: local.vercel?.productionDomain };
}

function finish() {
  console.log(`\n=== Skilltree-Lauf ${today} — Abschluss ===\n`);

  if (!existsSync(RUN_FILE)) {
    console.error('ABBRUCH: kein laufender Skilltree-Lauf. Erst preflight ausfuehren.');
    process.exit(1);
  }
  const runInfo = JSON.parse(readFileSync(RUN_FILE, 'utf8'));
  const ids = runInfo.chosen.map((e) => e.id);

  // Nur echte Effektarbeit zaehlt. Die Steuer- und Buchhaltungsdateien unter
  // .nox/ schreibt der Lauf selbst — wuerden sie mitzaehlen, gaebe ein Lauf
  // ohne jede Verbesserung einen leeren Commit und ginge live.
  // Reine Pfade statt `status --porcelain`: dessen Statuspraefix ist zwei
  // Zeichen breit und die erste Zeile verliert ihr fuehrendes Leerzeichen,
  // sobald die Ausgabe getrimmt wird — das schnitt Pfade an.
  const changed = [
    ...(g(['diff', '--name-only', 'HEAD']) || '').split('\n'),
    ...(g(['ls-files', '--others', '--exclude-standard']) || '').split('\n'),
  ]
    .map((file) => file.trim())
    .filter(Boolean)
    .filter((file) => !file.startsWith('.nox/'));

  const touchedEffects = changed.filter((file) => file.startsWith('src/motion-arsenal/effects/'));
  if (touchedEffects.length === 0) {
    console.error('ABBRUCH: keine Aenderung unter src/motion-arsenal/effects/.');
    console.error('Ein Lauf ohne Verbesserung wird nicht committet und nicht deployt.');
    if (changed.length) console.error(`Geaendert waren nur: ${changed.join(', ')}`);
    process.exit(1);
  }

  // Gegenprobe: die geaenderten Dateien muessen zu den heute gezogenen
  // Effekten gehoeren. Sonst hat der Lauf an etwas anderem gearbeitet.
  const expectedDirs = new Set(runInfo.chosen.map((e) => dirname(e.file)));
  const strays = touchedEffects.filter((file) => !expectedDirs.has(dirname(file)));
  if (strays.length && !hasFlag('allow-strays')) {
    console.error('ABBRUCH: Aenderungen ausserhalb der heutigen Effekt-Familien:');
    for (const file of strays) console.error(`  ${file}`);
    console.error('Mit --allow-strays bewusst zulassen.');
    process.exit(1);
  }

  // Reihenfolge ist Absicht: der Vertragswaechter zuerst, weil er am
  // schnellsten laeuft und den teuersten Fehler findet.
  const gates = [
    { label: 'Skilltree-Vertrag', cmd: 'node scripts/skilltree-guard.mjs verify' },
    { label: 'Typecheck', cmd: 'npm run lint' },
    { label: 'Contract-Tests', cmd: 'npm test' },
    { label: 'Build', cmd: 'npm run build' },
  ];

  for (const gate of gates) {
    const result = run(gate.cmd, { label: gate.label });
    if (!result.ok) {
      console.error(`\nROT: ${gate.label}\n`);
      console.error(result.out.slice(-4000));
      console.error(`\nBranch ${runInfo.branch} bleibt stehen. Nichts wurde gemerged oder deployt.`);
      process.exit(1);
    }
    console.log(`  gruen: ${gate.label}`);
  }

  // Der Vertrag wandert mit: der neue Stand ist ab jetzt die Messlatte.
  run('node scripts/skilltree-guard.mjs snapshot', { label: 'Vertrag fortschreiben' });
  execSync(`node scripts/skilltree-rotation.mjs complete --ids ${ids.join(',')}`, { cwd: ROOT, stdio: 'inherit' });
  run('node scripts/whats-new.mjs', { label: 'Was-ist-neu-Report' });

  g(['add', '-A']);
  const subject = `skilltree: level up ${ids.length} effects (${today})`;
  const body = runInfo.chosen.map((e) => `- ${e.id} (Level ${e.level} -> ${e.level + 1})`).join('\n');
  g(['commit', '-m', `${subject}\n\n${body}\n\nAutomatischer Skilltree-Lauf. Nur additive Aenderungen, vom Vertragswaechter geprueft.`]);
  console.log(`\nCommit: ${subject}`);

  if (hasFlag('no-push')) {
    console.log('\n--no-push gesetzt: Branch bleibt lokal. Ende.');
    return;
  }

  const pushed = g(['push', '-u', 'fork', runInfo.branch], { allowFail: true });
  if (pushed === null) {
    console.error('\nPush nach "fork" fehlgeschlagen (GH_TOKEN pruefen). Branch liegt lokal, nichts ging live.');
    process.exit(1);
  }
  console.log(`Gepusht: fork/${runInfo.branch}`);

  g(['checkout', 'main']);
  g(['merge', '--no-ff', runInfo.branch, '-m', subject]);
  const mainPushed = g(['push', 'fork', 'main'], { allowFail: true });
  if (mainPushed === null) {
    console.error('\nPush von main fehlgeschlagen. Merge liegt lokal vor, nichts ging live.');
    process.exit(1);
  }
  console.log('main aktualisiert und gepusht.');

  const target = deployTargetReady();
  if (!target.ready) {
    console.log(`\nDeploy uebersprungen: ${target.reason}.`);
    console.log('Die Verbesserungen liegen auf main. Einrichtung: docs/OWN-DEPLOYMENT.md');
    return;
  }

  // Der Operator-GO-Gate wird hier bewusst gesetzt: der vollautomatische Modus
  // IST das GO. Alle anderen Guards (sauberer Tree, main, verlinktes Projekt,
  // Smoke-Test) greifen unveraendert.
  const deploy = run('npm run foundry:prod -- batches/example-motion-batch.json', {
    label: 'Production-Deploy',
    env: { NOX_MOTION_FOUNDRY_PROD_GO: 'GO' },
  });
  if (!deploy.ok) {
    console.error('\nDeploy fehlgeschlagen. main ist aktuell, Production laeuft auf dem alten Stand weiter:');
    console.error(deploy.out.slice(-2000));
    process.exit(1);
  }
  console.log(`\nLive: ${target.domain}`);
}

if (command === 'preflight') preflight();
else if (command === 'finish') finish();
else {
  console.error(`Unbekanntes Kommando: ${command}. Erlaubt: preflight, finish`);
  process.exit(1);
}
