import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');

const migrations = [
  {
    catalog: 'src/motion-arsenal/effects/hero/catalog.ts',
    core: 'src/motion-arsenal/effects/hero/HeroTextReveal.tsx',
    legacy: 'src/motion-arsenal/effects/hero/MaskedTextReveal.tsx',
    canonicalId: 'hero-text-reveal',
    coreName: 'HeroTextReveal',
    legacyName: 'MaskedTextReveal',
  },
  {
    catalog: 'src/motion-arsenal/effects/cards/catalog.ts',
    core: 'src/motion-arsenal/effects/cards/InteractiveSurfaceCard.tsx',
    legacy: 'src/motion-arsenal/effects/cards/TiltParallaxCard.tsx',
    canonicalId: 'cards-interactive-surface-card',
    coreName: 'InteractiveSurfaceCard',
    legacyName: 'TiltParallaxCard',
  },
  {
    catalog: 'src/motion-arsenal/effects/forms/catalog.ts',
    core: 'src/motion-arsenal/effects/forms/FormSignalSystem.tsx',
    legacy: 'src/motion-arsenal/effects/forms/ValidationPulse.tsx',
    canonicalId: 'forms-signal-system',
    coreName: 'FormSignalSystem',
    legacyName: 'ValidationPulse',
  },
];

for (const migration of migrations) {
  const catalog = read(migration.catalog);
  const core = read(migration.core);
  const legacy = read(migration.legacy);

  assert.ok(catalog.includes(`id: '${migration.canonicalId}'`), `${migration.coreName} must be the active catalog entry`);
  assert.doesNotMatch(catalog, /legacyIds:/, `${migration.coreName} has no former static catalog ID to resolve through the registry`);
  assert.ok(catalog.includes(`import('./${migration.coreName}')`), `catalog must load ${migration.coreName}`);
  assert.match(core, new RegExp(`export (default )?function ${migration.coreName}|export \{ ${migration.coreName} \}`), `${migration.coreName} must remain directly importable`);
  assert.match(legacy, new RegExp(`export (default )?function ${migration.legacyName}|export \{ ${migration.legacyName} \}`), `${migration.legacyName} wrapper must remain directly importable`);
  assert.match(legacy, new RegExp(migration.coreName), `${migration.legacyName} must delegate to ${migration.coreName}`);
}

console.log('[catalog-migrations] PASS canonical entries preserve legacy wrappers and aliases');
