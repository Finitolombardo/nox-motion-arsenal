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

export type EffectMode = 'reference-lab' | 'nox-adapted' | 'nox-concept';
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

export type EffectPresetPerformanceProfile = 'lite' | 'balanced' | 'cinematic';
export type EffectPresetMobileProfile = 'compact' | 'balanced' | 'full';
export type EffectCatalogState = 'active' | 'deprecated' | 'alias';
export type EffectTemplateSurface = 'website' | 'dashboard';
export type EffectTemplateRole = 'background' | 'hero' | 'surface' | 'scroll' | 'transition' | 'form' | 'overlay' | 'cursor' | 'system';

export interface EffectNichePreset {
  id: string;
  label: string;
  niche: string;
  description?: string;
  props: Record<string, number | string | boolean>;
  tags?: string[];
  performanceProfile?: EffectPresetPerformanceProfile;
  mobileProfile?: EffectPresetMobileProfile;
  templateSurfaces?: EffectTemplateSurface[];
  templateRoles?: EffectTemplateRole[];
  templatePriority?: number;
}

export interface EffectMeta {
  id: string;
  // Export-/Komponentenname für Copy-Import und interne Wiederverwendung.
  name: string;
  // Optionaler, menschenlesbarer Titel im Arsenal.
  displayName?: string;
  category: EffectCategory;
  // Which reference site the mechanic was extracted from (or 'nox-original').
  sourceWebsite: 'krank-lusion' | 'active-theory' | 'shopify-editions' | 'oryzo-screenshot' | 'nox-original' | 'nox-consolidated' | 'originkit' | 'canvas-ui' | 'img2threejs';
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
  presets?: EffectNichePreset[];
  // Legacy handoff shape; normalized by the dashboard resolver when present.
  nichePresets?: Array<Record<string, unknown>>;
  legacyIds?: string[];
  supersedes?: string[];
  deprecationNotes?: string;
  catalogState?: EffectCatalogState;
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

// ---------------------------------------------------------------------------
// Core canon layer — the product surface of a fused canonical core.
//
// Every field below must bind to something the component genuinely supports:
// a `modeControl` names a real `select` prop, a module names a real `boolean`
// prop, and preset/profile overrides only carry keys that exist in `props`.
// `scripts/test-core-canon-contract.mjs` enforces exactly that, so the UI can
// never advertise a mode or module the runtime cannot honour.
// ---------------------------------------------------------------------------

export type CoreRuntimeTier = 'light' | 'standard' | 'heavy' | 'gpu';

export type NicheId =
  | 'restaurant'
  | 'beauty'
  | 'fitness'
  | 'local-service'
  | 'real-estate'
  | 'automotive'
  | 'healthcare'
  | 'finance'
  | 'saas'
  | 'ecommerce'
  | 'luxury'
  | 'creator';

export interface CoreModeDefinition {
  /** Value written into the mode control prop. */
  value: string;
  label: string;
  description: string;
  /** Legacy static IDs this mode replaces. */
  absorbs?: string[];
}

export interface CoreModuleDefinition {
  /** Prop key toggled by the module switch. */
  key: string;
  label: string;
  description: string;
  absorbs?: string[];
  /**
   * Non-boolean props (e.g. an `atmosphere` enum) still make honest module
   * switches as long as both states are named explicitly. Boolean props may
   * omit these and default to true/false.
   */
  onValue?: number | string | boolean;
  offValue?: number | string | boolean;
}

export interface CorePerformanceProfile {
  id: EffectPresetPerformanceProfile;
  label: string;
  /** Real prop overrides — a profile must change configuration, not styling. */
  overrides: Record<string, number | string | boolean>;
  note: string;
}

export interface CoreCanonEntry {
  id: string;
  /** One-line functional description shown on the core card. */
  summary: string;
  /** Product role, e.g. 'Atmosphere', 'Pointer', 'Route'. */
  role: string;
  runtimeTier: CoreRuntimeTier;
  /** Prop key of the select control that switches modes, when the core has modes. */
  modeControl?: string;
  modes?: CoreModeDefinition[];
  modules?: CoreModuleDefinition[];
  /** The 5–10 props surfaced before ADVANCED. */
  coreControls: string[];
  profiles?: CorePerformanceProfile[];
  templateSurfaces: EffectTemplateSurface[];
  templateRoles: EffectTemplateRole[];
  /** Higher wins when two cores compete for one template slot. */
  templatePriority: number;
  /** Legacy static IDs folded into this core. */
  absorbs: string[];
  migrationNotes?: string;
}
