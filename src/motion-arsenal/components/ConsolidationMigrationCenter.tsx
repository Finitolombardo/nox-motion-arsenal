import { useMemo } from 'react';
import { buildEffectAliasIndex } from '../data/effectRegistry';
import { inspectCatalogHealth } from '../lib/catalogHealth';
import type { EffectEntry } from '../types';

interface ConsolidationMigrationCenterProps {
  catalog: readonly EffectEntry[];
  onBack: () => void;
}

function HealthValue({ issues }: { issues: readonly string[] }) {
  return issues.length ? <strong className="migration-health migration-health--warn">{issues.length} NEED REVIEW</strong> : <strong className="migration-health">0 · HEALTHY</strong>;
}

/** Dashboard 008: factual, read-only catalog consolidation status. */
export function ConsolidationMigrationCenter({ catalog, onBack }: ConsolidationMigrationCenterProps) {
  const health = useMemo(() => inspectCatalogHealth(catalog), [catalog]);
  const registry = useMemo(() => {
    try {
      return { aliases: buildEffectAliasIndex(catalog), error: null as string | null };
    } catch (error) {
      return { aliases: new Map<string, string>(), error: error instanceof Error ? error.message : 'alias registry validation failed' };
    }
  }, [catalog]);

  const aliases = [...registry.aliases.entries()].sort(([left], [right]) => left.localeCompare(right));
  const registryIssues = registry.error ? [registry.error] : [];

  return (
    <div className="shell" style={{ gridTemplateColumns: '1fr' }}>
      <main className="main migration-center" data-testid="consolidation-migration-center">
        <button className="back-btn" onClick={onBack}>← ARSENAL</button>
        <header className="migration-center__header">
          <p className="migration-center__kicker">DASHBOARD 008 · REGISTRY GOVERNANCE</p>
          <h1>Consolidation &amp; Migration Center</h1>
          <p>Read-only registry facts from the active <code>EFFECTS_CATALOG</code>. This center does not mutate or delete catalog data.</p>
        </header>

        <section className="migration-center__metrics" aria-label="Catalog health summary">
          <article><span>ACTIVE EFFECTS</span><strong data-testid="active-effect-count">{health.activeCount}</strong></article>
          <article><span>LEGACY ALIASES</span><strong data-testid="legacy-alias-count">{aliases.length}</strong></article>
          <article><span>DUPLICATE IDS</span><HealthValue issues={health.duplicateIds} /></article>
          <article><span>ORPHANED ALIASES</span><HealthValue issues={[...health.orphanedAliases, ...registryIssues]} /></article>
        </section>

        <section className="migration-center__panel">
          <div className="migration-center__panel-heading">
            <div><p className="migration-center__kicker">MIGRATION MAP</p><h2>Legacy ID → active canonical ID</h2></div>
            <span className="migration-center__readonly">READ-ONLY · NO DELETE ACTIONS</span>
          </div>
          {registry.error ? (
            <p className="migration-center__issue" data-testid="alias-registry-error">Registry validation: {registry.error}</p>
          ) : aliases.length ? (
            <ul className="migration-center__alias-list" data-testid="alias-migration-map">
              {aliases.map(([legacyId, canonicalId]) => <li key={legacyId}><code>{legacyId}</code><span>→</span><code>{canonicalId}</code></li>)}
            </ul>
          ) : <p className="migration-center__empty">No legacy aliases are registered in the active catalog.</p>}
        </section>
      </main>
    </div>
  );
}
