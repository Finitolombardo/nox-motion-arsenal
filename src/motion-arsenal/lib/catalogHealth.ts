import type { EffectEntry } from '../types';

export interface CatalogHealth {
  activeCount: number;
  duplicateIds: string[];
  orphanedAliases: string[];
}

/**
 * Read-only health facts for the effective runtime catalog. Alias conflicts are
 * deliberately left to effectRegistry, which is the canonical resolver.
 */
export function inspectCatalogHealth(catalog: readonly EffectEntry[]): CatalogHealth {
  const activeIds = new Set<string>();
  const duplicateIds = new Set<string>();
  const orphanedAliases = new Set<string>();

  for (const entry of catalog) {
    const id = entry.meta.id;
    if (activeIds.has(id)) duplicateIds.add(id);
    activeIds.add(id);
  }

  for (const entry of catalog) {
    for (const alias of entry.meta.legacyIds ?? []) {
      if (!alias || alias === entry.meta.id || activeIds.has(alias)) orphanedAliases.add(alias || '(empty)');
    }
  }

  return {
    activeCount: catalog.length,
    duplicateIds: [...duplicateIds].sort(),
    orphanedAliases: [...orphanedAliases].sort(),
  };
}
