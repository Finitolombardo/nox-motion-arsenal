import ledger from 'virtual:drive-canon-ledger';
import type { EffectEntry } from '../types';

export type CanonDisposition =
  | 'ACTIVE_CANONICAL'
  | 'ACTIVE_STANDALONE'
  | 'LEGACY_WRAPPER'
  | 'PRESET_OR_MODE'
  | 'INTERNAL_RUNTIME'
  | 'REVIEW_UNRESOLVED';

interface LedgerRow {
  static_id: string;
  disposition: CanonDisposition;
  confidence: 'EXACT' | 'STRONG' | 'REVIEW';
  rationale: string;
}

interface DriveCanonLedger {
  static_id_ledger: LedgerRow[];
}

/** The Library is intentionally limited to source-approved, independently usable cores. */
export const CORE_LIBRARY_DISPOSITIONS = new Set<CanonDisposition>([
  'ACTIVE_CANONICAL',
  'ACTIVE_STANDALONE',
]);

const rows = (ledger as DriveCanonLedger).static_id_ledger;
const dispositionByStaticId = new Map(rows.map((row) => [row.static_id, row]));

export function coreLibraryEntries(catalog: readonly EffectEntry[]): EffectEntry[] {
  return catalog.filter((entry) => CORE_LIBRARY_DISPOSITIONS.has(dispositionByStaticId.get(entry.meta.id)?.disposition ?? 'REVIEW_UNRESOLVED'));
}

export function canonReviewRows(catalog: readonly EffectEntry[]) {
  const names = new Map(catalog.map((entry) => [entry.meta.id, entry.meta.displayName ?? entry.meta.name]));
  return rows
    .filter((row) => !CORE_LIBRARY_DISPOSITIONS.has(row.disposition))
    .map((row) => ({ ...row, name: names.get(row.static_id) ?? row.static_id }));
}

export function canonDispositionCounts() {
  return rows.reduce<Partial<Record<CanonDisposition, number>>>((counts, row) => {
    counts[row.disposition] = (counts[row.disposition] ?? 0) + 1;
    return counts;
  }, {});
}
