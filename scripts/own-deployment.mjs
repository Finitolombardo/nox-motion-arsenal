#!/usr/bin/env node
// Richtet diesen Checkout auf ein EIGENES Deployment-Ziel aus: eigenes GitHub-
// Repo (Fork) + eigenes Vercel-Projekt, statt auf die Baseline von
// `Finitolombardo/nox-motion-arsenal`.
//
//   node scripts/own-deployment.mjs check    Zeigt, was fehlt (aendert nichts)
//   node scripts/own-deployment.mjs adopt    Schreibt .nox/motion-foundry.local.json
//
// `adopt` liest die Wahrheit aus dem Checkout selbst — Git-Remote und
// `.vercel/project.json` —, erfindet also keine IDs. Der Publish-Guard in
// scripts/motion-foundry/lib.mjs vergleicht anschliessend gegen diese Werte.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = join(ROOT, '.nox', 'motion-foundry.json');
const LOCAL = join(ROOT, '.nox', 'motion-foundry.local.json');
const VERCEL_LINK = join(ROOT, '.vercel', 'project.json');

// --- Git ohne Verlass auf PATH ---------------------------------------------
// Die Git-for-Windows-Installation kann `cmd\git.exe` verlieren (Antivirus-
// Quarantaene ist der haeufigste Grund), waehrend das echte Binary unter
// libexec liegt. Ohne diesen Fallback bricht jeder Foundry-Lauf ab.

const GIT_CANDIDATES = [
  'git',
  'C:/Program Files/Git/cmd/git.exe',
  'C:/Program Files/Git/mingw64/bin/git.exe',
  'C:/Program Files/Git/mingw64/libexec/git-core/git.exe',
];

let gitBin = null;
function git(args, { allowFail = false } = {}) {
  if (!gitBin) {
    for (const candidate of GIT_CANDIDATES) {
      try {
        const out = execFileSync(candidate, ['--version'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
        if (/^git version/.test(out)) {
          gitBin = candidate;
          break;
        }
      } catch {
        /* naechster Kandidat */
      }
    }
  }
  if (!gitBin) {
    if (allowFail) return null;
    throw new Error('Kein funktionierendes git-Binary gefunden.');
  }
  try {
    return execFileSync(gitBin, args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (error) {
    if (allowFail) return null;
    throw error;
  }
}

const ok = (m) => console.log(`  [ok]    ${m}`);
const warn = (m) => console.log(`  [offen] ${m}`);
const fail = (m) => console.log(`  [FEHLT] ${m}`);

// --- Erhebung ---------------------------------------------------------------

function remotes() {
  const raw = git(['remote', '-v'], { allowFail: true }) || '';
  const map = new Map();
  for (const line of raw.split('\n')) {
    const m = line.match(/^(\S+)\s+(\S+)\s+\(fetch\)$/);
    if (m) map.set(m[1], m[2]);
  }
  return map;
}

function repoSlug(url) {
  const m = String(url).match(/github\.com[/:]([^/]+)\/([^/.]+)/);
  return m ? `${m[1]}/${m[2]}` : null;
}

function collect() {
  const baseline = JSON.parse(readFileSync(BASELINE, 'utf8'));
  const local = existsSync(LOCAL) ? JSON.parse(readFileSync(LOCAL, 'utf8')) : null;
  const link = existsSync(VERCEL_LINK) ? JSON.parse(readFileSync(VERCEL_LINK, 'utf8')) : null;
  const remoteMap = remotes();

  // Das eigene Ziel ist der Remote, der NICHT das Baseline-Repository ist.
  const own = [...remoteMap.entries()]
    .map(([name, url]) => ({ name, url, slug: repoSlug(url) }))
    .filter((r) => r.slug && r.slug.toLowerCase() !== String(baseline.repository).toLowerCase());

  return {
    baseline,
    local,
    link,
    remoteMap,
    own,
    gitBin,
    ghToken: Boolean(process.env.GH_TOKEN || process.env.GITHUB_TOKEN),
    branch: git(['rev-parse', '--abbrev-ref', 'HEAD'], { allowFail: true }),
    dirty: (git(['status', '--porcelain'], { allowFail: true }) || '').length > 0,
  };
}

// --- check ------------------------------------------------------------------

function check(state) {
  console.log('\nNOX Motion Arsenal — eigenes Deployment-Ziel\n');

  console.log('Werkzeuge');
  if (state.gitBin === 'git') ok('git ist ueber PATH erreichbar');
  else if (state.gitBin) warn(`git NICHT im PATH, Fallback aktiv: ${state.gitBin}`);
  else fail('kein git-Binary gefunden — Git for Windows neu installieren');
  if (state.ghToken) ok('GH_TOKEN/GITHUB_TOKEN gesetzt (Gueltigkeit hier nicht geprueft)');
  else fail('kein GH_TOKEN — der Agent kann nicht pushen oder PRs oeffnen');

  console.log('\nGitHub');
  console.log(`  Baseline (fremd): ${state.baseline.repository}`);
  if (state.own.length) {
    for (const r of state.own) ok(`eigenes Repo ueber Remote "${r.name}": ${r.slug}`);
  } else {
    fail('kein eigener Remote — Fork anlegen und als Remote eintragen');
  }
  console.log(`  Branch: ${state.branch ?? 'unbekannt'}${state.dirty ? ' (uncommitted Aenderungen)' : ' (sauber)'}`);

  console.log('\nVercel');
  console.log(`  Baseline-Projekt: ${state.baseline.vercel.projectName} → ${state.baseline.vercel.productionDomain}`);
  if (state.link) {
    ok(`Checkout verlinkt: org ${state.link.orgId} / project ${state.link.projectId}`);
    if (state.link.projectId === state.baseline.vercel.projectId) {
      warn('verlinkt ist noch das FREMDE Projekt — dorthin kannst du nicht deployen');
    }
  } else {
    fail('.vercel/project.json fehlt — `npx vercel link` in diesem Ordner ausfuehren');
  }

  console.log('\nFoundry-Konfiguration');
  if (state.local) {
    ok('.nox/motion-foundry.local.json vorhanden');
    console.log(`     repository: ${state.local.repository ?? '(geerbt)'}`);
    console.log(`     vercel:     ${state.local.vercel?.projectName ?? '(geerbt)'} → ${state.local.vercel?.productionDomain ?? '(geerbt)'}`);
  } else {
    fail('.nox/motion-foundry.local.json fehlt — Publish-Guard zielt auf das fremde Projekt');
  }

  const blocking = [];
  if (!state.gitBin) blocking.push('git reparieren');
  if (!state.ghToken) blocking.push('GH_TOKEN setzen');
  if (!state.own.length) blocking.push('eigenen GitHub-Remote eintragen');
  if (!state.link || state.link.projectId === state.baseline.vercel.projectId) blocking.push('npx vercel link auf eigenes Projekt');
  if (!state.local) blocking.push('node scripts/own-deployment.mjs adopt');

  console.log('\nNaechster Schritt');
  if (!blocking.length) console.log('  Alles gesetzt — `npm run foundry:plan` und der Publish-Guard zielen auf dein eigenes Ziel.');
  else blocking.forEach((b, i) => console.log(`  ${i + 1}. ${b}`));
  console.log('');

  return blocking.length === 0;
}

// --- adopt ------------------------------------------------------------------

function adopt(state) {
  if (!state.own.length) {
    console.error('Abbruch: kein eigener GitHub-Remote gefunden. Erst Fork anlegen und als Remote eintragen.');
    process.exit(1);
  }
  if (!state.link) {
    console.error('Abbruch: .vercel/project.json fehlt. Erst `npx vercel link` in diesem Ordner ausfuehren.');
    process.exit(1);
  }
  if (state.link.projectId === state.baseline.vercel.projectId) {
    console.error('Abbruch: der Checkout ist noch mit dem fremden Vercel-Projekt verlinkt. `npx vercel link` erneut ausfuehren und ein eigenes Projekt waehlen.');
    process.exit(1);
  }

  const repository = state.own[0].slug;
  const projectName = state.link.projectName || 'nox-motion-arsenal';
  const config = {
    schemaVersion: '1.0.0',
    repository,
    vercel: {
      teamId: state.link.orgId,
      projectId: state.link.projectId,
      projectName,
      productionDomain: `https://${projectName}.vercel.app`,
    },
  };

  writeFileSync(LOCAL, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  console.log(`.nox/motion-foundry.local.json geschrieben:\n${JSON.stringify(config, null, 2)}`);
  console.log('\nProduktionsdomain pruefen — wenn Vercel eine andere Domain vergeben hat, den Wert hier korrigieren.');
}

const command = process.argv[2] || 'check';
const state = collect();
if (command === 'check') process.exit(check(state) ? 0 : 1);
else if (command === 'adopt') adopt(state);
else {
  console.error(`Unbekanntes Kommando: ${command}. Erlaubt: check, adopt`);
  process.exit(1);
}
