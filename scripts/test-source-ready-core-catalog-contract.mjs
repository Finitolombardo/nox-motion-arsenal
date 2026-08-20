import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const effects = (...parts) => path.join(root, 'src', 'motion-arsenal', 'effects', ...parts);
const read = (...parts) => fs.readFileSync(effects(...parts), 'utf8');

const canonicalCores = [
  ['originkit', 'originkit-text-mutation-system', 'TextMutationSystem'],
  ['originkit', 'originkit-text-signal-system', 'TextSignalSystem'],
  ['originkit', 'originkit-particle-text-transformation-system', 'ParticleTextTransformationSystem'],
  ['originkit', 'originkit-variable-weight-text', 'VariableWeightText'],
  ['canvas-ui', 'canvasui-particle-field-system', 'ParticleFieldSystem'],
  ['scroll', 'scroll-scene-system', 'ScrollSceneSystem'],
  ['forge-skilltree', 'skilltree-scene-system', 'SkilltreeSceneSystem'],
  ['forge-skilltree', 'skilltree-node-state-system', 'SkillNodeStateSystem'],
];

const documentedMigrations = [
  ['originkit', 'originkit-text-mutation-system', ['nox-scrambletext', 'nox-typewriter']],
  ['originkit', 'originkit-text-signal-system', ['nox-glitchtext', 'originkit-flickertext']],
  ['originkit', 'originkit-particle-text-transformation-system', ['nox-dusttextreveal', 'nox-textvaporize']],
  ['originkit', 'originkit-variable-weight-text', ['nox-weighthover', 'nox-dynamicweight']],
  ['canvas-ui', 'canvasui-particle-field-system', ['canvasui-particle-object', 'canvasui-particle-reveal']],
  ['scroll', 'scroll-scene-system', ['scroll-object-transform']],
  ['forge-skilltree', 'skilltree-scene-system', ['skilltree-astral-constellation', 'skilltree-floating-nodes', 'skilltree-locked-path-shadow', 'skilltree-forge-chamber-hard-mode']],
  ['forge-skilltree', 'skilltree-node-state-system', ['skilltree-active-pulse-ring', 'skilltree-recommended-focus-ring', 'skilltree-corrupted-risk-glitch']],
];

for (const [category, id, component] of canonicalCores) {
  const catalog = read(category, 'catalog.ts');
  assert.match(catalog, new RegExp(`id: ['\"]${id}['\"]`), `${id} must be catalogued in ${category}`);
  assert.match(catalog, new RegExp(`importPath: ['\"][^'\"]*${component}['\"]`), `${id} must point at ${component}`);
  assert.ok(catalog.includes(`Component: lazy(() => import('./${component}'))`), `${id} must lazy-load ${component}`);
}

for (const [category, canonicalId, legacyIds] of documentedMigrations) {
  const catalog = read(category, 'catalog.ts');
  assert.match(catalog, new RegExp(`id: ['\"]${canonicalId}['\"]`), `${canonicalId} must remain active`);
  assert.ok(catalog.includes(`legacyIds: [${legacyIds.map((id) => `'${id}'`).join(', ')}]`), `${canonicalId} must own its documented legacy IDs`);
  for (const legacyId of legacyIds) assert.match(catalog, new RegExp(`id: ['\"]${legacyId}['\"]`), `${legacyId} source entry must remain directly importable`);
}

const registry = fs.readFileSync(path.join(root, 'src', 'motion-arsenal', 'data', 'effectRegistry.ts'), 'utf8');
assert.match(registry, /legacyIds/, 'registry must resolve explicitly documented legacy IDs');
assert.match(registry, /legacy effect id is still active/, 'registry must reject aliases that hide standalone mechanics');

console.log(`[source-ready-cores] PASS canonical=${canonicalCores.length} migrations=${documentedMigrations.length}`);
