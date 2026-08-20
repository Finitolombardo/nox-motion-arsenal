import type { EffectEntry } from '../types';

export type EffectAliasIndex = ReadonlyMap<string, string>;

export function buildEffectAliasIndex(catalog: readonly EffectEntry[]): EffectAliasIndex {
  const active = new Set(catalog.map((entry) => entry.meta.id));
  const aliases = new Map<string, string>();

  for (const entry of catalog) {
    const canonicalId = entry.meta.id;
    for (const legacyId of entry.meta.legacyIds ?? []) {
      if (!legacyId || legacyId === canonicalId) {
        throw new Error(`invalid legacy effect id for ${canonicalId}`);
      }
      if (active.has(legacyId)) {
        throw new Error(`legacy effect id is still active: ${legacyId}`);
      }
      const existing = aliases.get(legacyId);
      if (existing && existing !== canonicalId) {
        throw new Error(`legacy effect id has conflicting targets: ${legacyId}`);
      }
      aliases.set(legacyId, canonicalId);
    }
  }

  for (const canonicalId of aliases.values()) {
    if (!active.has(canonicalId)) throw new Error(`legacy target is not active: ${canonicalId}`);
  }
  return aliases;
}

export function resolveEffectId(requestedId: string, aliases: EffectAliasIndex): string {
  return aliases.get(requestedId) ?? requestedId;
}

export function isLegacyEffectId(requestedId: string, aliases: EffectAliasIndex): boolean {
  return aliases.has(requestedId);
}

export function findEffectEntry(catalog: readonly EffectEntry[], requestedId: string, aliases = buildEffectAliasIndex(catalog)): EffectEntry | undefined {
  const canonicalId = resolveEffectId(requestedId, aliases);
  return catalog.find((entry) => entry.meta.id === canonicalId);
}
