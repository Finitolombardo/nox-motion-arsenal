import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registryPath = path.join(root, 'src', 'motion-arsenal', 'data', 'effectRegistry.ts');
const effectsRoot = path.join(root, 'src', 'motion-arsenal', 'effects');

const documentedFusionMigrations = {
  'bg-forge-energy-glyphs': 'bg-nox-interactive-glyph-field',
  'bg-nox-scribble-field': 'bg-nox-interactive-glyph-field',
  'bg-noise-fog-field': 'bg-atmosphere-field',
  'bg-depth-glow-stack': 'bg-atmosphere-field',
  'bg-radial-beam-atmosphere': 'bg-atmosphere-field',
  'hero-masked-text-reveal': 'hero-text-reveal',
  'transitions-smooth-section-wipe': 'transitions-route-system',
  'transitions-masked-route': 'transitions-route-system',
  'transitions-clip-path-reveal': 'transitions-route-system',
  'transitions-layered-page-enter': 'transitions-route-system',
  'transitions-panel-shift': 'transitions-route-system',
  'scroll-object-transform': 'scroll-scene-system',
  'cursor-light-field': 'cursor-pointer-interaction-field',
  'cursor-hover-distortion': 'cursor-pointer-interaction-field',
  'cursor-pointer-parallax-stage': 'cursor-pointer-interaction-field',
  'cursor-spotlight-reveal': 'cursor-pointer-interaction-field',
  'cursor-interactive-symbol-drift': 'cursor-pointer-interaction-field',
  'cards-tilt-parallax': 'cards-interactive-surface-card',
  'system-scan-complete-pulse': 'system-progress-feedback',
  'system-progress-ring-charge': 'system-progress-feedback',
  'system-xp-fill-surge': 'system-progress-feedback',
  'forms-validation-pulse': 'forms-signal-system',
  'overlays-modal-iris-reveal': 'overlays-surface-system',
  'overlays-glass-sheet': 'overlays-surface-system',
  'canvasui-particle-object': 'canvasui-particle-field-system',
  'canvasui-particle-reveal': 'canvasui-particle-field-system',
  'skilltree-astral-constellation': 'skilltree-scene-system',
  'skilltree-floating-nodes': 'skilltree-scene-system',
  'skilltree-locked-path-shadow': 'skilltree-scene-system',
  'skilltree-forge-chamber-hard-mode': 'skilltree-scene-system',
  'skilltree-active-pulse-ring': 'skilltree-node-state-system',
  'skilltree-recommended-focus-ring': 'skilltree-node-state-system',
  'skilltree-corrupted-risk-glitch': 'skilltree-node-state-system',
  'nox-scrambletext': 'originkit-text-mutation-system',
  'nox-typewriter': 'originkit-text-mutation-system',
  'nox-glitchtext': 'originkit-text-signal-system',
  'originkit-flickertext': 'originkit-text-signal-system',
  'nox-dusttextreveal': 'originkit-particle-text-transformation-system',
  'nox-textvaporize': 'originkit-particle-text-transformation-system',
  'nox-weighthover': 'originkit-variable-weight-text',
  'nox-dynamicweight': 'originkit-variable-weight-text',
};

function readCatalogMigrations() {
  const migrations = new Map();
  for (const category of fs.readdirSync(effectsRoot, { withFileTypes: true })) {
    if (!category.isDirectory()) continue;
    const catalogPath = path.join(effectsRoot, category.name, 'catalog.ts');
    if (!fs.existsSync(catalogPath)) continue;
    const source = ts.createSourceFile(catalogPath, fs.readFileSync(catalogPath, 'utf8'), ts.ScriptTarget.Latest, true);
    const visit = (node) => {
      if (ts.isObjectLiteralExpression(node)) {
        const meta = node.properties.find((property) => ts.isPropertyAssignment(property) && ts.isIdentifier(property.name) && property.name.text === 'meta');
        if (meta && ts.isPropertyAssignment(meta) && ts.isObjectLiteralExpression(meta.initializer)) {
          const fields = new Map(meta.initializer.properties.filter(ts.isPropertyAssignment).map((property) => [property.name.getText(source).replace(/['"]/g, ''), property.initializer]));
          const id = fields.get('id');
          const legacyIds = fields.get('legacyIds');
          if (id && ts.isStringLiteral(id) && legacyIds && ts.isArrayLiteralExpression(legacyIds)) {
            for (const legacyId of legacyIds.elements) {
              if (ts.isStringLiteral(legacyId)) migrations.set(legacyId.text, id.text);
            }
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  return migrations;
}

const actualMigrations = readCatalogMigrations();
assert.deepEqual(Object.fromEntries([...actualMigrations].sort()), documentedFusionMigrations, 'the documented fusion migration map must be exhaustive and exact');

const registrySource = fs.readFileSync(registryPath, 'utf8');
const compiledRegistry = ts.transpileModule(registrySource, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const registry = await import(`data:text/javascript;base64,${Buffer.from(compiledRegistry).toString('base64')}`);

const catalog = [...new Set(Object.values(documentedFusionMigrations))].map((id) => ({ meta: { id, legacyIds: Object.entries(documentedFusionMigrations).filter(([, canonicalId]) => canonicalId === id).map(([legacyId]) => legacyId) } }));
const aliases = registry.buildEffectAliasIndex(catalog);
assert.deepEqual(Object.fromEntries([...aliases].sort()), documentedFusionMigrations, 'registry must resolve every documented fusion legacy ID');

const staleFavorites = ['bg-forge-energy-glyphs', 'bg-nox-interactive-glyph-field', 'nox-typewriter', 'unknown-effect'];
assert.deepEqual([...registry.normalizeEffectIds(staleFavorites, aliases)], ['bg-nox-interactive-glyph-field', 'originkit-text-mutation-system', 'unknown-effect'], 'persisted effect-id sets must canonicalize aliases and de-duplicate canonical IDs');
assert.deepEqual(registry.normalizeEffectCollectionIds(['nox-typewriter', 'originkit-text-mutation-system', 'unknown-effect'], aliases), ['originkit-text-mutation-system', 'unknown-effect'], 'collections must preserve order while canonicalizing aliases');

const textMutation = catalog.find((entry) => entry.meta.id === 'originkit-text-mutation-system');
assert.ok(registry.matchesEffectSearch(textMutation, 'nox-typewriter'), 'legacy IDs must remain searchable');
assert.ok(registry.matchesEffectSearch(textMutation, 'originkit-text-mutation-system'), 'canonical IDs must remain searchable');
assert.equal(registry.matchesEffectSearch(textMutation, 'not-a-real-effect'), false, 'unrelated search terms must not match');

console.log(`[effect-registry-migrations] PASS aliases=${aliases.size}`);
