import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registryPath = path.join(root, 'src', 'motion-arsenal', 'data', 'effectRegistry.ts');
const effectsCatalogPath = path.join(root, 'src', 'motion-arsenal', 'data', 'effectsCatalog.ts');
const effectsRoot = path.join(root, 'src', 'motion-arsenal', 'effects');

// Only compatibility wrappers/compositions are migrations. Selector systems keep
// their independently useful effects (for example LayeredPageEnter and
// HoverDistortionShader) active under their own static IDs.
const documentedFusionMigrations = {
  'bg-forge-energy-glyphs': 'bg-nox-interactive-glyph-field',
  'bg-nox-scribble-field': 'bg-nox-interactive-glyph-field',
  'bg-noise-fog-field': 'bg-atmosphere-field',
  'bg-depth-glow-stack': 'bg-atmosphere-field',
  'bg-radial-beam-atmosphere': 'bg-atmosphere-field',
};

const standaloneStaticIds = [
  'transitions-layered-page-enter',
  'cursor-hover-distortion',
  'cursor-interactive-symbol-drift',
];

function readCatalogEntries() {
  const entries = [];
  for (const category of fs.readdirSync(effectsRoot, { withFileTypes: true })) {
    if (!category.isDirectory()) continue;
    const catalogPath = path.join(effectsRoot, category.name, 'catalog.ts');
    if (!fs.existsSync(catalogPath)) continue;
    const source = ts.createSourceFile(catalogPath, fs.readFileSync(catalogPath, 'utf8'), ts.ScriptTarget.Latest, true);
    const visit = (node) => {
      if (ts.isObjectLiteralExpression(node)) {
        const meta = node.properties.find((property) => ts.isPropertyAssignment(property) && property.name.getText(source) === 'meta');
        if (meta && ts.isPropertyAssignment(meta) && ts.isObjectLiteralExpression(meta.initializer)) {
          const fields = new Map(meta.initializer.properties.filter(ts.isPropertyAssignment).map((property) => [property.name.getText(source).replace(/['"]/g, ''), property.initializer]));
          const id = fields.get('id');
          const legacyIds = fields.get('legacyIds');
          if (id && ts.isStringLiteral(id)) {
            entries.push({
              id: id.text,
              legacyIds: legacyIds && ts.isArrayLiteralExpression(legacyIds)
                ? legacyIds.elements.filter(ts.isStringLiteral).map((legacyId) => legacyId.text)
                : [],
            });
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  return entries;
}

const rawEntries = readCatalogEntries();
const rawIds = new Set(rawEntries.map((entry) => entry.id));
const actualMigrations = Object.fromEntries(rawEntries.flatMap((entry) => entry.legacyIds.map((legacyId) => [legacyId, entry.id])));
assert.deepEqual(actualMigrations, documentedFusionMigrations, 'only documented compatibility fusions may declare legacy IDs');

const activeIds = new Set(rawEntries.filter((entry) => !Object.hasOwn(documentedFusionMigrations, entry.id)).map((entry) => entry.id));
for (const [legacyId, canonicalId] of Object.entries(documentedFusionMigrations)) {
  assert.ok(rawIds.has(legacyId), `${legacyId} must be an actual static catalog ID`);
  assert.ok(!activeIds.has(legacyId), `${legacyId} must be absent from the active catalog`);
  assert.ok(activeIds.has(canonicalId), `${canonicalId} must remain active`);
}
for (const id of standaloneStaticIds) {
  assert.ok(rawIds.has(id), `${id} must remain a static catalog ID`);
  assert.ok(activeIds.has(id), `${id} is a standalone effect and must remain active`);
  assert.ok(!Object.hasOwn(documentedFusionMigrations, id), `${id} must not be a legacy alias`);
}

const effectsCatalogSource = fs.readFileSync(effectsCatalogPath, 'utf8');
assert.match(effectsCatalogSource, /LEGACY_IDS_HIDDEN_FROM_ACTIVE/, 'active catalog must derive its filter from declared legacy IDs');

const registrySource = fs.readFileSync(registryPath, 'utf8');
const compiledRegistry = ts.transpileModule(registrySource, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const registry = await import(`data:text/javascript;base64,${Buffer.from(compiledRegistry).toString('base64')}`);
const activeCatalog = rawEntries
  .filter((entry) => activeIds.has(entry.id))
  .map((entry) => ({ meta: entry }));
const aliases = registry.buildEffectAliasIndex(activeCatalog);
assert.deepEqual(Object.fromEntries([...aliases].sort()), documentedFusionMigrations, 'registry must resolve every documented static legacy ID to its canonical active entry');
for (const [legacyId, canonicalId] of Object.entries(documentedFusionMigrations)) {
  assert.equal(registry.resolveEffectId(legacyId, aliases), canonicalId, `${legacyId} must resolve to ${canonicalId}`);
}

const staleFavorites = ['bg-forge-energy-glyphs', 'bg-nox-interactive-glyph-field', 'nox-typewriter', 'unknown-effect'];
assert.deepEqual([...registry.normalizeEffectIds(staleFavorites, aliases)], ['bg-nox-interactive-glyph-field', 'nox-typewriter', 'unknown-effect'], 'only actual legacy IDs may canonicalize persisted effect sets');

console.log(`[effect-registry-migrations] PASS aliases=${aliases.size}`);