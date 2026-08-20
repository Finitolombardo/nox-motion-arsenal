import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');

const systems = [
  {
    source: 'src/motion-arsenal/effects/cursor/PointerInteractionField.tsx',
    catalog: 'src/motion-arsenal/effects/cursor/catalog.ts',
    id: 'cursor-pointer-interaction-field',
    name: 'PointerInteractionField',
    legacyIds: ['cursor-light-field', 'cursor-hover-distortion', 'cursor-pointer-parallax-stage', 'cursor-spotlight-reveal', 'cursor-interactive-symbol-drift'],
  },
  {
    source: 'src/motion-arsenal/effects/overlays/OverlaySurfaceSystem.tsx',
    catalog: 'src/motion-arsenal/effects/overlays/catalog.ts',
    id: 'overlays-surface-system',
    name: 'OverlaySurfaceSystem',
    legacyIds: ['overlays-modal-iris-reveal', 'overlays-glass-sheet'],
  },
  {
    source: 'src/motion-arsenal/effects/system/ProgressFeedbackSystem.tsx',
    catalog: 'src/motion-arsenal/effects/system/catalog.ts',
    id: 'system-progress-feedback',
    name: 'ProgressFeedbackSystem',
    legacyIds: ['system-scan-complete-pulse', 'system-progress-ring-charge', 'system-xp-fill-surge'],
  },
  {
    source: 'src/motion-arsenal/effects/transitions/RouteTransitionSystem.tsx',
    catalog: 'src/motion-arsenal/effects/transitions/catalog.ts',
    id: 'transitions-route-system',
    name: 'RouteTransitionSystem',
    legacyIds: ['transitions-smooth-section-wipe', 'transitions-masked-route', 'transitions-clip-path-reveal', 'transitions-layered-page-enter', 'transitions-panel-shift'],
  },
];

for (const system of systems) {
  const source = read(system.source);
  const catalog = read(system.catalog);
  assert.match(source, new RegExp(`export function ${system.name}`), `${system.name} must stay directly importable`);
  assert.match(source, /export default/, `${system.name} must expose a default export for lazy catalog loading`);
  assert.ok(catalog.includes(`id: '${system.id}'`), `${system.name} canonical catalog id missing`);
  assert.ok(catalog.includes(`name: '${system.name}'`), `${system.name} canonical catalog entry missing`);
  assert.ok(catalog.includes(`legacyIds: [${system.legacyIds.map((id) => `'${id}'`).join(', ')}]`), `${system.name} must own its complete legacy id list`);
  for (const legacyId of system.legacyIds) assert.ok(catalog.includes(`id: '${legacyId}'`), `${legacyId} source entry must remain for compatibility metadata`);
}

const effectsCatalog = read('src/motion-arsenal/data/effectsCatalog.ts');
const registry = read('src/motion-arsenal/data/effectRegistry.ts');
assert.match(effectsCatalog, /LEGACY_IDS_HIDDEN_FROM_ACTIVE/, 'active catalog must hide aliases without deleting source entries');
assert.match(registry, /legacy effect id is still active/, 'registry must reject aliases left active');

console.log('effect system consolidation contract: OK');
