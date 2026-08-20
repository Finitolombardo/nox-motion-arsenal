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


for (const [category, id, component] of canonicalCores) {
  const catalog = read(category, 'catalog.ts');
  assert.match(catalog, new RegExp(`id: ['\"]${id}['\"]`), `${id} must be catalogued in ${category}`);
  assert.match(catalog, new RegExp(`importPath: ['\"][^'\"]*${component}['\"]`), `${id} must point at ${component}`);
  assert.ok(catalog.includes(`Component: lazy(() => import('./${component}'))`), `${id} must lazy-load ${component}`);
}

const registry = fs.readFileSync(path.join(root, 'src', 'motion-arsenal', 'data', 'effectRegistry.ts'), 'utf8');
assert.match(registry, /legacyIds/, 'registry must resolve explicitly documented legacy IDs');
assert.match(registry, /legacy effect id is still active/, 'registry must reject aliases that hide standalone mechanics');

console.log(`[source-ready-cores] PASS canonical=${canonicalCores.length}`);
