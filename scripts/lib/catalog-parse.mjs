// Gemeinsamer Parser fuer die Effekt-Kataloge.
//
// Die Kataloge sind TypeScript mit `lazy(() => import(...))`-Komponenten und
// lassen sich deshalb nicht einfach importieren. Statt eines TS-Compilers wird
// hier gezielt das `meta`-Objekt jedes Eintrags per Klammerzaehlung
// herausgeschnitten und ausgelesen. Bewusst konservativ: was nicht sicher
// erkannt wird, bleibt leer, statt geraten zu werden.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

export function catalogFilesIn(effectsDir, root) {
  const files = [];
  for (const family of readdirSync(effectsDir)) {
    const dir = join(effectsDir, family);
    if (!statSync(dir).isDirectory()) continue;
    for (const file of readdirSync(dir)) {
      if (/^[a-z]*catalog\.tsx?$/i.test(file)) {
        files.push(relative(root, join(dir, file)).replace(/\\/g, '/'));
      }
    }
  }
  return files.sort();
}

// Schneidet das umschliessende `{ ... }` ab einer Position heraus.
export function blockAt(source, index) {
  const open = source.lastIndexOf('{', index);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(open, i + 1);
    }
  }
  return source.slice(open);
}

function sliceArray(block, key) {
  const start = block.search(new RegExp(`\\b${key}:\\s*\\[`));
  if (start === -1) return null;
  const open = block.indexOf('[', start);
  let depth = 0;
  for (let i = open; i < block.length; i += 1) {
    if (block[i] === '[') depth += 1;
    else if (block[i] === ']') {
      depth -= 1;
      if (depth === 0) return block.slice(open + 1, i);
    }
  }
  return null;
}

export function field(block, key) {
  const m = block.match(new RegExp(`\\b${key}:\\s*'((?:[^'\\\\]|\\\\.)*)'`));
  return m ? m[1].replace(/\\'/g, "'").replace(/\\n/g, ' ') : '';
}

export function stringList(block, key) {
  const inner = sliceArray(block, key);
  if (inner === null) return [];
  return [...inner.matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((x) => x[1].replace(/\\'/g, "'"));
}

// Literalwert eines Prop-Schluessels: String, Zahl oder Boolean.
function literal(objectSource, key) {
  const m = objectSource.match(new RegExp(`\\b${key}:\\s*('(?:[^'\\\\]|\\\\.)*'|-?[\\d.]+|true|false)`));
  if (!m) return undefined;
  const raw = m[1];
  if (raw.startsWith("'")) return raw.slice(1, -1).replace(/\\'/g, "'");
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return Number(raw);
}

// Zerlegt den Inhalt des props-Arrays in die einzelnen `{ ... }`-Objekte.
function splitObjects(inner) {
  const out = [];
  let depth = 0;
  let start = -1;
  for (let i = 0; i < inner.length; i += 1) {
    if (inner[i] === '{') {
      if (depth === 0) start = i;
      depth += 1;
    } else if (inner[i] === '}') {
      depth -= 1;
      if (depth === 0 && start !== -1) {
        out.push(inner.slice(start, i + 1));
        start = -1;
      }
    }
  }
  return out;
}

export function parseProps(block) {
  const inner = sliceArray(block, 'props');
  if (inner === null) return [];
  return splitObjects(inner).map((object) => {
    const prop = {
      key: literal(object, 'key'),
      type: literal(object, 'type'),
      default: literal(object, 'default'),
    };
    for (const numeric of ['min', 'max', 'step']) {
      const value = literal(object, numeric);
      if (value !== undefined) prop[numeric] = value;
    }
    const options = stringList(object, 'options');
    if (options.length) prop.options = options;
    return prop;
  }).filter((p) => p.key !== undefined);
}

// Liest alle Effekt-Eintraege eines Checkouts.
// `read(file)` erlaubt es, statt der Platte auch `git show <ref>:<file>` zu lesen.
export function readEffects({ files, read }) {
  const entries = [];
  for (const file of files) {
    let source;
    try {
      source = read(file);
    } catch {
      continue;
    }
    for (const match of source.matchAll(/\bid:\s*'([a-z0-9-]+)'/g)) {
      const block = blockAt(source, match.index);
      if (!/\bcategory:\s*'/.test(block)) continue;
      entries.push({
        id: match[1],
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
        improvementVersion: field(block, 'improvementVersion'),
        lastImprovedAt: field(block, 'lastImprovedAt'),
        props: parseProps(block),
        productionSafe: /\bproductionSafe:\s*true/.test(block),
      });
    }
  }
  return entries.sort((a, b) => a.id.localeCompare(b.id));
}

export function workingTreeReader(root) {
  return (file) => readFileSync(join(root, file), 'utf8');
}
