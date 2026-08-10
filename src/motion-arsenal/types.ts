import type { ComponentType, LazyExoticComponent } from 'react';

export type EffectCategory =
  | 'premium'
  | 'forge-skilltree'
  | 'backgrounds'
  | 'hero'
  | 'transitions'
  | 'scroll'
  | 'cursor'
  | 'cards'
  | 'system'
  | 'forms'
  | 'overlays'
  | 'originkit'
  | 'canvas-ui'
  | 'img2threejs'
  | 'concepts';

export type EffectMode = 'reference-lab' | 'nox-adapted' | 'nox-concept' | 'nox-original';
export type EffectComplexity = 'low' | 'medium' | 'high' | 'heavy';
export type EffectImprovementStatus = 'pending' | 'in-progress' | 'improved' | 'needs-review';

export type PropControlType = 'range' | 'select' | 'color' | 'boolean' | 'text';

// A tweakable prop exposed in the gallery's props panel. `key` must match the
// component's prop name so PropsPanel can spread values straight in.
export interface EffectPropControl {
  key: string;
  label: string;
  type: PropControlType;
  default: number | string | boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  // Optional section header (e.g. 'Random', 'Colors', 'Typography') the
  // control is grouped under in PropsPanel. Controls without a group render
  // in an ungrouped leading section.
  group?: string;
}

export interface EffectMeta {
  id: string;
  // Export-/Komponentenname für Copy-Import und interne Wiederverwendung.
  name: string;
  // Optionaler, menschenlesbarer Titel im Arsenal.
  displayName?: string;
  category: EffectCategory;
  // Which reference site the mechanic was extracted from (or 'nox-original').
  sourceWebsite: 'krank-lusion' | 'active-theory' | 'shopify-editions' | 'oryzo-screenshot' | 'nox-original' | 'originkit' | 'canvas-ui' | 'img2threejs' | 'codrops';
  // Concrete files/anchors in the local reference capture the mechanic came from.
  sourceFiles: string[];
  mode: EffectMode;
  complexity: EffectComplexity;
  dependencies: string[];
  bestFor: string[];
  performanceNotes: string;
  mobileNotes: string;
  reducedMotionNotes: string;
  description: string;
  // Explizite Herkunft und technische Einordnung für übernommene Presets.
  currentUsage?: string[];
  technicalBasis?: string;
  // Import + usage snippets shown (and copied) in the detail view.
  importPath: string;
  usageJsx: string;
  props: EffectPropControl[];
  // Injected from the component's latest Git commit, with filesystem mtime as
  // a fallback while this Arsenal remains untracked in its parent checkout.
  updatedAt?: string;
  // Machine-readable autonomous improvement tracking.
  improvementStatus?: EffectImprovementStatus;
  lastImprovedAt?: string;
  lastImprovedBy?: string;
  improvementVersion?: string;
  improvementChangelog?: string[];
  productionSafe: boolean;
  // Reifegrad für Design-Entscheidungen: experimental → candidate → production-safe.
  status?: 'experimental' | 'candidate' | 'production-safe';
  // Heavy previews are click-to-run in the gallery instead of auto-mounting.
  clickToRun?: boolean;
  // Preview wants full height (backgrounds/atmosphere).
  fullBleed?: boolean;
}

export interface EffectEntry {
  meta: EffectMeta;
  Component: LazyExoticComponent<ComponentType<any>> | ComponentType<any>;
}
