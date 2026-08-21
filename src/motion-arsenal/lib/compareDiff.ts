import type { CoreCanonEntry, EffectEntry, EffectNichePreset, EffectPropControl } from '../types';
import type { ConfigValue } from './effectConfig';

// ---------------------------------------------------------------------------
// Semantic config diff.
//
// A raw JSON diff tells you `intensity: 0.92 vs 0.46`. That is data, not an
// answer. This reports the control's label, the direction, and how large the
// change is relative to the control's own range — so "Restaurant vs Luxury"
// reads as "Intensity: much higher" rather than as two numbers.
// ---------------------------------------------------------------------------

export type DiffDirection = 'higher' | 'lower' | 'changed' | 'enabled' | 'disabled';

export interface SemanticDiffRow {
  key: string;
  label: string;
  left: ConfigValue | undefined;
  right: ConfigValue | undefined;
  direction: DiffDirection;
  /** Plain-language magnitude, e.g. 'much higher', 'slightly lower'. */
  magnitude: string;
}

function magnitudeFor(control: EffectPropControl, left: number, right: number): string {
  if (control.type !== 'range' || control.min === undefined || control.max === undefined) return '';
  const span = control.max - control.min;
  if (span <= 0) return '';
  const delta = Math.abs(right - left) / span;
  if (delta >= 0.5) return 'much ';
  if (delta >= 0.2) return '';
  return 'slightly ';
}

export function semanticDiff(
  meta: EffectEntry['meta'],
  left: Record<string, ConfigValue>,
  right: Record<string, ConfigValue>,
): SemanticDiffRow[] {
  const rows: SemanticDiffRow[] = [];
  for (const control of meta.props) {
    const a = left[control.key];
    const b = right[control.key];
    if (a === b) continue;
    if (a === undefined && b === undefined) continue;

    let direction: DiffDirection = 'changed';
    let magnitude = '';
    if (control.type === 'boolean') {
      direction = b ? 'enabled' : 'disabled';
    } else if (control.type === 'range' && typeof a === 'number' && typeof b === 'number') {
      direction = b > a ? 'higher' : 'lower';
      magnitude = magnitudeFor(control, a, b);
    }
    rows.push({ key: control.key, label: control.label, left: a, right: b, direction, magnitude });
  }
  return rows;
}

export interface CoreComparisonFacts {
  id: string;
  name: string;
  role: string;
  mechanism: string;
  modes: string[];
  modules: string[];
  nichePresets: string[];
  runtimeTier: string;
  performanceNotes: string;
  mobileNotes: string;
  reducedMotionNotes: string;
  dependencies: string[];
  absorbed: string[];
  templateRoles: string[];
  sourceWebsite: string;
  sourceFiles: string[];
  version?: string;
  improvementChangelog: string[];
}

export function comparisonFacts(
  entry: EffectEntry,
  core: CoreCanonEntry | undefined,
  presets: readonly EffectNichePreset[],
): CoreComparisonFacts {
  const m = entry.meta;
  return {
    id: m.id,
    name: m.displayName ?? m.name,
    role: core?.role ?? m.category,
    mechanism: core?.summary ?? m.description,
    modes: (core?.modes ?? []).map((mode) => mode.label),
    modules: (core?.modules ?? []).map((mod) => mod.label),
    nichePresets: presets.map((preset) => preset.label),
    runtimeTier: core?.runtimeTier ?? m.complexity,
    performanceNotes: m.performanceNotes,
    mobileNotes: m.mobileNotes,
    reducedMotionNotes: m.reducedMotionNotes,
    dependencies: m.dependencies,
    absorbed: core?.absorbs ?? [],
    templateRoles: core?.templateRoles ?? [],
    sourceWebsite: m.sourceWebsite,
    sourceFiles: m.sourceFiles,
    version: m.improvementVersion,
    improvementChangelog: m.improvementChangelog ?? [],
  };
}
