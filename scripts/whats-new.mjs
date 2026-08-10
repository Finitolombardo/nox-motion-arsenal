#!/usr/bin/env node
// Baut `whats-new.html`: visueller Diff zwischen dem lokalen Katalog und dem
// zuletzt gesnapshotteten Production-Deployment. Reine Lese-/Report-Schicht —
// der Katalog in src/ bleibt die einzige Effekt-Wahrheit.
//
//   node scripts/whats-new.mjs
//
// Snapshot aktualisieren (nach einem Deploy): reports/prod-effect-ids.json
// neu befüllen, dann dieses Skript erneut laufen lassen.

import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const EFFECTS_DIR = join(ROOT, 'src', 'motion-arsenal', 'effects');
const SNAPSHOT = join(ROOT, 'reports', 'prod-effect-ids.json');
const OUT = join(ROOT, 'whats-new.html');

// --- Quellen ----------------------------------------------------------------
// Neue Effekte entstehen hier auf kurzlebigen `refine/*`-Branches und liegen oft
// noch uncommitted im Working Tree. Deshalb wird nicht nur der aktuelle
// Checkout gelesen, sondern jeder lokale Branch — sonst zeigt der Diff nur den
// gerade ausgecheckten Ausschnitt der Arbeit.

const git = (args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' });

const isCatalog = (name) => /(^|\/)[a-z]*catalog\.tsx?$/i.test(name);

function workingTreeSource() {
  const files = [];
  for (const family of readdirSync(EFFECTS_DIR)) {
    const dir = join(EFFECTS_DIR, family);
    if (!statSync(dir).isDirectory()) continue;
    for (const file of readdirSync(dir)) {
      if (isCatalog(file)) files.push(relative(ROOT, join(dir, file)).replace(/\\/g, '/'));
    }
  }
  let branch = 'detached HEAD';
  try {
    branch = git(['rev-parse', '--abbrev-ref', 'HEAD']).trim();
  } catch {
    /* kein git — Working Tree reicht */
  }
  return {
    label: `Working Tree (${branch})`,
    ref: null,
    files,
    read: (file) => readFileSync(join(ROOT, file), 'utf8'),
  };
}

function branchSources() {
  let branches = [];
  try {
    branches = git(['branch', '--format=%(refname:short)'])
      .split('\n')
      .map((b) => b.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
  return branches.map((ref) => ({
    label: ref,
    ref,
    files: git(['ls-tree', '-r', '--name-only', ref, '--', 'src/motion-arsenal/effects'])
      .split('\n')
      .map((f) => f.trim())
      .filter((f) => f && isCatalog(f)),
    read: (file) => git(['show', `${ref}:${file}`]),
  }));
}

// Schneidet das `meta: { ... }`-Objekt eines Eintrags per Klammerzählung heraus.
function metaBlockAt(source, idIndex) {
  const open = source.lastIndexOf('{', idIndex);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(open, i + 1);
    }
  }
  return source.slice(open);
}

function field(block, key) {
  const m = block.match(new RegExp(`\\b${key}:\\s*'((?:[^'\\\\]|\\\\.)*)'`));
  return m ? m[1].replace(/\\'/g, "'").replace(/\\n/g, ' ') : '';
}

function stringList(block, key) {
  const m = block.match(new RegExp(`\\b${key}:\\s*\\[([\\s\\S]*?)\\]`));
  if (!m) return [];
  return [...m[1].matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((x) => x[1].replace(/\\'/g, "'"));
}

function propCount(block) {
  const m = block.match(/\bprops:\s*\[([\s\S]*?)\n\s*\],/);
  if (!m) return 0;
  return (m[1].match(/\{\s*key:/g) || []).length;
}

function readCatalog(source) {
  const entries = [];
  for (const file of source.files) {
    let text;
    try {
      text = source.read(file);
    } catch {
      continue;
    }
    for (const match of text.matchAll(/\bid:\s*'([a-z0-9-]+)'/g)) {
      const block = metaBlockAt(text, match.index);
      if (!/\bcategory:\s*'/.test(block)) continue; // kein Effekt-Meta-Block
      entries.push({
        id: match[1],
        origin: source.label,
        file,
        name: field(block, 'name'),
        displayName: field(block, 'displayName') || field(block, 'name'),
        category: field(block, 'category'),
        mode: field(block, 'mode'),
        complexity: field(block, 'complexity'),
        description: field(block, 'description'),
        performanceNotes: field(block, 'performanceNotes'),
        mobileNotes: field(block, 'mobileNotes'),
        reducedMotionNotes: field(block, 'reducedMotionNotes'),
        importPath: field(block, 'importPath'),
        usageJsx: field(block, 'usageJsx'),
        bestFor: stringList(block, 'bestFor'),
        dependencies: stringList(block, 'dependencies'),
        props: propCount(block),
        productionSafe: /\bproductionSafe:\s*true/.test(block),
      });
    }
  }
  return entries.sort((a, b) => a.id.localeCompare(b.id));
}

// --- Zusatzdaten ------------------------------------------------------------

function gitCommitFor(entry) {
  try {
    const line = git([
      'log', '-1', '--format=%h%ad%s', '--date=short', '--all',
      '-S', entry.id, '--', entry.file,
    ]).trim();
    if (!line) return null;
    const [hash, date, subject] = line.split('');
    return { hash, date, subject };
  } catch {
    return null;
  }
}

// Alle Quellen zu einem Katalog verschmelzen. Die erste Fundstelle gewinnt,
// weitere Branches werden nur als zusaetzliche Herkunft vermerkt.
function mergeSources(sources) {
  const byId = new Map();
  for (const source of sources) {
    for (const entry of readCatalog(source)) {
      const known = byId.get(entry.id);
      if (known) {
        if (!known.origins.includes(entry.origin)) known.origins.push(entry.origin);
      } else {
        byId.set(entry.id, { ...entry, origins: [entry.origin] });
      }
    }
  }
  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
}

const SHOTS = {
  'system-gauge-needle-sweep': ['reports/qa-gauge-full.png', 'reports/qa-gauge-t1.png'],
  'hero-gold-outline-fill-text': ['reports/qa-gold-full.png', 'reports/qa-gold-after.png'],
};

// --- Rendern ----------------------------------------------------------------

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function newCard(entry, commit) {
  const shots = (SHOTS[entry.id] || []).filter((p) => existsSync(join(ROOT, p)));
  return `
  <article class="card" id="${esc(entry.id)}">
    <header class="card-head">
      <div>
        <p class="eyebrow">${esc(entry.category)} · neu</p>
        <h3>${esc(entry.displayName)}</h3>
        <code class="id">${esc(entry.id)}</code>
      </div>
      <div class="badges">
        <span class="badge">${esc(entry.complexity)}</span>
        <span class="badge">${esc(entry.mode)}</span>
        <span class="badge">${entry.props} Controls</span>
        ${entry.productionSafe ? '<span class="badge badge-ok">production-safe</span>' : ''}
        ${entry.dependencies.length === 0 ? '<span class="badge">0 Dependencies</span>' : ''}
      </div>
    </header>

    <p class="origin">Liegt in: ${entry.origins.map((o) => `<span class="badge">${esc(o)}</span>`).join(' ')}</p>

    <p class="desc">${esc(entry.description)}</p>

    ${
      shots.length
        ? `<div class="shots">${shots
            .map((p) => `<a href="${p}" target="_blank"><img src="${p}" alt="${esc(entry.displayName)} QA-Screenshot" loading="lazy" /></a>`)
            .join('')}</div>
           <p class="shot-note">QA-Screenshots aus dem Preview-Harness. Live &amp; interaktiv: Buttons unten.</p>`
        : ''
    }

    <div class="live">
      <a class="btn btn-primary" href="http://localhost:5195/#/effect/${esc(entry.id)}">Live im lokalen Arsenal</a>
      <a class="btn" href="https://nox-motion-arsenal.vercel.app/#/effect/${esc(entry.id)}">In Production (noch nicht da)</a>
    </div>

    <div class="grid2">
      <section>
        <h4>Best for</h4>
        <ul>${entry.bestFor.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
      </section>
      <section>
        <h4>Verhalten</h4>
        <dl>
          <dt>Performance</dt><dd>${esc(entry.performanceNotes)}</dd>
          <dt>Mobile</dt><dd>${esc(entry.mobileNotes)}</dd>
          <dt>Reduced Motion</dt><dd>${esc(entry.reducedMotionNotes)}</dd>
        </dl>
      </section>
    </div>

    <div class="code">
      <span class="code-label">Usage</span>
      <pre>${esc(entry.usageJsx)}</pre>
      <span class="code-label">Import</span>
      <pre>import ${esc(entry.name)} from '${esc(entry.importPath)}'</pre>
    </div>

    <footer class="card-foot">
      <span>${esc(entry.file)}</span>
      ${commit ? `<span>${esc(commit.hash)} · ${esc(commit.date)} · ${esc(commit.subject)}</span>` : ''}
    </footer>
  </article>`;
}

function build() {
  const sources = [workingTreeSource(), ...branchSources()];
  const entries = mergeSources(sources);
  const snapshot = JSON.parse(readFileSync(SNAPSHOT, 'utf8'));
  const prod = new Set(snapshot.effectIds);
  const localIds = new Set(entries.map((e) => e.id));

  const added = entries.filter((e) => !prod.has(e.id));
  const removed = snapshot.effectIds.filter((id) => !localIds.has(id));
  const shared = entries.filter((e) => prod.has(e.id));

  const byCategory = new Map();
  for (const e of entries) byCategory.set(e.category, (byCategory.get(e.category) || 0) + 1);

  const html = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>NOX Motion Arsenal — Was ist neu</title>
<style>
  :root {
    --bg: #080708; --panel: #100e10; --panel2: #161316; --line: #2a2429;
    --gold: #d4a24a; --gold-soft: #f7e8a4; --text: #ece7e2; --muted: #8d8489; --ok: #6ad48a;
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--text);
    font: 15px/1.6 ui-sans-serif, system-ui, "Segoe UI", sans-serif; }
  a { color: var(--gold); }
  .wrap { max-width: 1080px; margin: 0 auto; padding: 48px 20px 96px; }
  header.top { border-bottom: 1px solid var(--line); padding-bottom: 28px; margin-bottom: 36px; }
  .eyebrow { text-transform: uppercase; letter-spacing: .18em; font-size: 11px;
    color: var(--muted); margin: 0 0 8px; }
  h1 { margin: 0 0 10px; font-size: clamp(1.9rem, 5vw, 3rem); letter-spacing: .01em;
    background: linear-gradient(100deg, var(--gold) 10%, var(--gold-soft) 45%, var(--gold) 80%);
    -webkit-background-clip: text; background-clip: text; color: transparent; }
  .lede { color: var(--muted); max-width: 62ch; margin: 0; }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px; margin: 28px 0 0; }
  .stat { background: var(--panel); border: 1px solid var(--line); border-radius: 12px; padding: 14px 16px; }
  .stat b { display: block; font-size: 26px; color: var(--gold); font-weight: 700; line-height: 1.2; }
  .stat span { font-size: 12px; color: var(--muted); }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: .18em; color: var(--muted);
    margin: 48px 0 16px; font-weight: 600; }
  .card { background: var(--panel); border: 1px solid var(--line); border-radius: 16px;
    padding: 24px; margin-bottom: 24px; }
  .card-head { display: flex; flex-wrap: wrap; gap: 12px; justify-content: space-between;
    align-items: flex-start; }
  .card-head h3 { margin: 0 0 6px; font-size: 24px; }
  .id { color: var(--muted); font-size: 12px; }
  .badges { display: flex; flex-wrap: wrap; gap: 6px; }
  .badge { font-size: 11px; border: 1px solid var(--line); border-radius: 999px;
    padding: 3px 10px; color: var(--muted); background: var(--panel2); }
  .badge-ok { color: var(--ok); border-color: #24462f; }
  .origin { margin: 16px 0 0; font-size: 12px; color: var(--muted); }
  .desc { margin: 16px 0 20px; }
  .shots { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px; }
  .shots img { width: 100%; display: block; border: 1px solid var(--line); border-radius: 10px; }
  .shot-note { font-size: 12px; color: var(--muted); margin: 8px 0 0; }
  .live { display: flex; flex-wrap: wrap; gap: 10px; margin: 20px 0 4px; }
  .btn { display: inline-block; text-decoration: none; font-size: 13px; padding: 9px 16px;
    border-radius: 999px; border: 1px solid var(--line); color: var(--text); background: var(--panel2); }
  .btn-primary { border-color: var(--gold); color: #120e07;
    background: linear-gradient(100deg, var(--gold), var(--gold-soft)); font-weight: 600; }
  .grid2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 24px; margin-top: 24px; }
  .grid2 h4 { margin: 0 0 8px; font-size: 12px; text-transform: uppercase;
    letter-spacing: .14em; color: var(--gold); }
  .grid2 ul { margin: 0; padding-left: 18px; color: var(--muted); }
  dl { margin: 0; } dt { font-size: 12px; color: var(--text); margin-top: 10px; }
  dt:first-child { margin-top: 0; } dd { margin: 2px 0 0; color: var(--muted); font-size: 13px; }
  .code { margin-top: 22px; }
  .code-label { font-size: 11px; text-transform: uppercase; letter-spacing: .14em; color: var(--muted); }
  pre { background: #0b0a0b; border: 1px solid var(--line); border-radius: 10px;
    padding: 12px 14px; overflow-x: auto; margin: 6px 0 14px; font-size: 13px; color: var(--gold-soft); }
  .card-foot { display: flex; flex-wrap: wrap; gap: 12px; justify-content: space-between;
    border-top: 1px solid var(--line); margin-top: 8px; padding-top: 14px;
    font-size: 12px; color: var(--muted); }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--line); }
  th { color: var(--muted); font-weight: 600; font-size: 11px; text-transform: uppercase;
    letter-spacing: .12em; }
  .pill-row { display: flex; flex-wrap: wrap; gap: 6px; }
  .note { color: var(--muted); font-size: 13px; }
  details { background: var(--panel); border: 1px solid var(--line); border-radius: 12px; padding: 14px 18px; }
  summary { cursor: pointer; color: var(--gold); }
  .idlist { columns: 3 200px; column-gap: 24px; font-size: 12px; color: var(--muted);
    margin: 14px 0 0; padding: 0; list-style: none; }
</style>
</head>
<body>
<div class="wrap">

  <header class="top">
    <p class="eyebrow">NOX Motion Arsenal · Katalog-Diff</p>
    <h1>Was ist neu</h1>
    <p class="lede">Vergleich des lokalen Katalogs gegen das ausgelieferte Production-Deployment
      (<a href="${esc(snapshot.source)}">${esc(snapshot.source)}</a>, Snapshot vom ${esc(snapshot.capturedAt)}).
      Alles, was hier unter „Neu“ steht, existiert lokal, aber noch nicht in Production.</p>
    <div class="stats">
      <div class="stat"><b>${entries.length}</b><span>Effekte lokal</span></div>
      <div class="stat"><b>${snapshot.effectIds.length}</b><span>Effekte in Production</span></div>
      <div class="stat"><b>+${added.length}</b><span>neu hinzugefügt</span></div>
      <div class="stat"><b>${removed.length}</b><span>lokal entfernt</span></div>
      <div class="stat"><b>${byCategory.size}</b><span>Kategorien</span></div>
    </div>
    <p class="note" style="margin-top:18px">Gelesen aus ${sources.length} Quellen:
      ${sources.map((s) => `<span class="badge">${esc(s.label)}</span>`).join(' ')}</p>
  </header>

  <h2>Neu hinzugefügt (${added.length})</h2>
  ${added.length ? added.map((e) => newCard(e, gitCommitFor(e))).join('\n') : '<p class="note">Keine neuen Effekte gegenüber dem Snapshot.</p>'}

  ${
    removed.length
      ? `<h2>Nur in Production, lokal nicht mehr vorhanden (${removed.length})</h2>
         <div class="card"><div class="pill-row">${removed.map((id) => `<span class="badge">${esc(id)}</span>`).join('')}</div></div>`
      : ''
  }

  <h2>Katalog nach Kategorie</h2>
  <div class="card">
    <table>
      <thead><tr><th>Kategorie</th><th>Effekte</th><th>davon neu</th></tr></thead>
      <tbody>
      ${[...byCategory.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(
          ([cat, count]) =>
            `<tr><td>${esc(cat)}</td><td>${count}</td><td>${added.filter((e) => e.category === cat).length || '—'}</td></tr>`,
        )
        .join('')}
      </tbody>
    </table>
  </div>

  <h2>Unverändert gegenüber Production (${shared.length})</h2>
  <details>
    <summary>Alle ${shared.length} IDs anzeigen</summary>
    <ul class="idlist">${shared.map((e) => `<li>${esc(e.id)}</li>`).join('')}</ul>
  </details>

  <h2>So aktualisierst du diese Seite</h2>
  <div class="card">
    <pre>npm run whats-new</pre>
    <p class="note">Liest die Kataloge unter <code>src/motion-arsenal/effects/*/catalog.ts</code>,
      vergleicht sie mit <code>reports/prod-effect-ids.json</code> und schreibt diese Datei neu.
      Nach einem Deploy den Snapshot erneuern, dann sind die bisher „neuen“ Effekte automatisch
      im unveränderten Block.</p>
  </div>

  <p class="note" style="margin-top:36px">Generiert ${new Date().toISOString().slice(0, 10)} ·
    Live-Previews brauchen den lokalen Dev-Server (<code>npm run dev</code> → http://localhost:5195).</p>
</div>
</body>
</html>
`;

  writeFileSync(OUT, html, 'utf8');
  console.log(`whats-new.html geschrieben — lokal ${entries.length}, production ${snapshot.effectIds.length}, neu ${added.length}, entfernt ${removed.length}`);
  for (const e of added) console.log(`  + ${e.id} (${e.category})`);
}

build();
