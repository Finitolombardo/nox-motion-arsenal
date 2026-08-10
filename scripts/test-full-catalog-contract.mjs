import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const effectsRoot = path.join(root, 'src', 'motion-arsenal', 'effects');
const catalogSource = fs.readFileSync(path.join(root, 'src', 'motion-arsenal', 'data', 'effectsCatalog.ts'), 'utf8');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const catalogFiles = walk(effectsRoot).filter((file) => path.basename(file) === 'catalog.ts');
const ids = catalogFiles.flatMap((file) => {
  const source = fs.readFileSync(file, 'utf8');
  return [...source.matchAll(/\bid:\s*['"]([^'"]+)['"]/g)].map((match) => match[1]);
});
const uniqueIds = new Set(ids);
const fail = (message) => {
  throw new Error(`[full-catalog] ${message}`);
};

if (ids.length < 148) fail(`expected at least 148 static ids, found ${ids.length}`);
if (uniqueIds.size !== ids.length) fail(`duplicate static ids detected (${ids.length - uniqueIds.size})`);
if (!catalogSource.includes("import { LAB_CATALOG } from '../effects/lab/catalog'")) fail('LAB_CATALOG import missing');
if (!catalogSource.includes("import { ORIGINKIT_CATALOG } from '../effects/originkit/catalog'")) fail('ORIGINKIT_CATALOG import missing');
if (!catalogSource.includes('...LAB_CATALOG')) fail('LAB_CATALOG spread missing');
if (!catalogSource.includes('...ORIGINKIT_CATALOG')) fail('ORIGINKIT_CATALOG spread missing');

const labSource = fs.readFileSync(path.join(effectsRoot, 'lab', 'catalog.ts'), 'utf8');
const labIds = [...labSource.matchAll(/\bid:\s*['"]([^'"]+)['"]/g)].map((match) => match[1]);
const expectedLabIds = [
  'lab-oryzo-scribble-field',
  'lab-shopify-butterflies',
  'lab-shopify-coin-rain',
  'lab-krank-curl-particles',
  'lab-active-theory-trails',
];
if (labIds.length !== expectedLabIds.length || expectedLabIds.some((id) => !labIds.includes(id))) fail('LAB_CATALOG does not contain the exact five reference effects');

const originSource = fs.readFileSync(path.join(effectsRoot, 'originkit', 'catalog.ts'), 'utf8');
const originIds = [...originSource.matchAll(/\bid:\s*['"]([^'"]+)['"]/g)].map((match) => match[1]);
// Untergrenze statt fester Zahl: der Katalog darf wachsen, aber kein
// OriginKit-Effekt darf verschwinden. Dieselbe Regel wie bei den statischen
// IDs weiter oben.
if (originIds.length < 67) fail(`expected at least 67 ORIGINKIT_CATALOG ids, found ${originIds.length}`);

const requiredIds = [
  'premium-data-stream-journey', 'bg-depth-glow-stack', 'skilltree-glass-metal-panel',
  'premium-glass-distortion-cards', 'premium-signal-particles', 'forms-selection-energy-ripple',
  'hero-object-float', 'bg-forge-energy-glyphs', 'canvasui-particle-reveal',
  'skilltree-svg-energy-lines', 'scroll-pinned-product-stage',
  ...expectedLabIds, 'nox-pixelcard', 'nox-pixelunfold', 'nox-pixelateimage', 'nox-svgparticle',
];
for (const id of requiredIds) if (!uniqueIds.has(id)) fail(`required id missing: ${id}`);

console.log(`[full-catalog] PASS static=${ids.length} unique=${uniqueIds.size} lab=${labIds.length} originkit=${originIds.length}`);
