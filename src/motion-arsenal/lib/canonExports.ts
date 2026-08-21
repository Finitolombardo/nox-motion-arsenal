import type {
  CoreCanonEntry,
  EffectEntry,
  EffectNichePreset,
  EffectTemplateSurface,
  NicheId,
} from '../types';
import { CORE_CANON, coreNichePresets } from '../data/coreCanon';
import { defaultConfigValues, type ConfigValue, type EffectConfigValues } from './effectConfig';
import { resolveCoreState, type CoreBuilderState } from './coreState';
import type { RuntimeBudget, TemplateSlot } from './templateComposer';

// ---------------------------------------------------------------------------
// Canonical machine-readable export schemas (Drive canon D003 / D007 / D013).
//
// The human-facing text summaries are useful in chat, but the Drive canon
// specifies three *machine-readable* contracts so a later customer-template
// builder can consume them. D013 additionally requires normalized output:
// object keys ordered by schema, sets serialized as sorted arrays, undefined
// stripped — so the same logical selection always serializes byte-identically
// regardless of catalog iteration order.
// ---------------------------------------------------------------------------

export const EFFECT_CONFIG_SCHEMA = 'nox-arsenal-effect-config/v1';
export const NICHE_PACK_SCHEMA = 'nox-arsenal-niche-pack/v1';
export const TEMPLATE_BLUEPRINT_SCHEMA = 'nox-arsenal-template-blueprint/v1';

/**
 * Deterministic serialization: recursively sorts object keys and drops
 * undefined. Arrays keep their order, because slot and candidate order is
 * itself meaningful — only *sets* are pre-sorted by their producers.
 */
export function normalizeForExport<T>(value: T): T {
  if (Array.isArray(value)) return value.map((item) => normalizeForExport(item)) as unknown as T;
  if (value && typeof value === 'object') {
    const source = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(source).sort()) {
      if (source[key] === undefined) continue;
      out[key] = normalizeForExport(source[key]);
    }
    return out as unknown as T;
  }
  return value;
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(normalizeForExport(value), null, 2);
}

/** Only the values that genuinely differ from the core defaults. */
export function minimalOverrides(entry: EffectEntry, values: EffectConfigValues): EffectConfigValues {
  const defaults = defaultConfigValues(entry.meta);
  const out: EffectConfigValues = {};
  for (const key of Object.keys(values).sort()) {
    if (values[key] !== defaults[key]) out[key] = values[key];
  }
  return out;
}

export interface EffectConfigV1 {
  schema: typeof EFFECT_CONFIG_SCHEMA;
  effectId: string;
  component: string;
  category: string;
  importPath: string;
  complexity: string;
  runtimeTier: string;
  preset: string | null;
  niche: NicheId | null;
  runtimeProfile: string | null;
  mobileProfile: string | null;
  mode: string | null;
  modules: Record<string, boolean>;
  /** Only real overrides — never the full default surface. */
  overrides: EffectConfigValues;
  resolved: EffectConfigValues;
}

export function buildEffectConfigV1(
  entry: EffectEntry,
  core: CoreCanonEntry | undefined,
  state: CoreBuilderState,
  presets: readonly EffectNichePreset[],
): EffectConfigV1 {
  const resolved = resolveCoreState(entry.meta, core, state, presets);
  const modules: Record<string, boolean> = {};
  for (const mod of core?.modules ?? []) {
    const value = resolved.values[mod.key];
    modules[mod.key] = mod.onValue !== undefined ? value === mod.onValue : value === true;
  }
  return {
    schema: EFFECT_CONFIG_SCHEMA,
    effectId: entry.meta.id,
    component: entry.meta.name,
    category: entry.meta.category,
    importPath: entry.meta.importPath,
    complexity: entry.meta.complexity,
    runtimeTier: core?.runtimeTier ?? entry.meta.complexity,
    preset: resolved.preset?.id ?? null,
    niche: (resolved.preset?.niche as NicheId | undefined) ?? null,
    runtimeProfile: resolved.profile ?? null,
    mobileProfile: resolved.preset?.mobileProfile ?? null,
    mode: core?.modeControl ? String(resolved.values[core.modeControl]) : null,
    modules,
    overrides: minimalOverrides(entry, resolved.values),
    resolved: resolved.values,
  };
}

export interface NichePackEntryV1 {
  effectId: string;
  component: string;
  category: string;
  importPath: string;
  role: string;
  runtimeTier: string;
  presetId: string;
  presetLabel: string;
  whyItFits: string;
  overrides: EffectConfigValues;
  legacyIds: string[];
}

export interface NichePackV1 {
  schema: typeof NICHE_PACK_SCHEMA;
  niche: NicheId;
  coreCount: number;
  effects: NichePackEntryV1[];
}

/**
 * D003/D013: only active, production-safe canonical cores with a real preset
 * for this niche. Legacy ids ride along as migration metadata, never as extra
 * effects. Ordering is deterministic: category, then core id.
 */
export function buildNichePackV1(niche: NicheId, catalog: readonly EffectEntry[]): NichePackV1 {
  const entryById = new Map(catalog.map((entry) => [entry.meta.id, entry]));
  const effects: NichePackEntryV1[] = [];

  for (const core of CORE_CANON) {
    const entry = entryById.get(core.id);
    if (!entry) continue;
    // Reference-lab / non-production entries stay out of customer packs.
    if (!entry.meta.productionSafe || entry.meta.mode === 'reference-lab') continue;
    const presets = coreNichePresets(core.id);
    const preset = presets.find((item) => item.niche === niche);
    if (!preset) continue;
    const resolved = resolveCoreState(entry.meta, core, {
      mode: null, presetId: preset.id, profileId: null, overrides: {},
    }, presets);
    effects.push({
      effectId: core.id,
      component: entry.meta.name,
      category: entry.meta.category,
      importPath: entry.meta.importPath,
      role: core.role,
      runtimeTier: core.runtimeTier,
      presetId: preset.id,
      presetLabel: preset.label,
      whyItFits: preset.description ?? '',
      overrides: minimalOverrides(entry, resolved.values),
      legacyIds: [...core.absorbs].sort(),
    });
  }

  effects.sort((a, b) => a.category.localeCompare(b.category) || a.effectId.localeCompare(b.effectId));
  return { schema: NICHE_PACK_SCHEMA, niche, coreCount: effects.length, effects };
}

export interface BlueprintSlotV1 {
  role: string;
  status: 'selected' | 'open';
  effectId?: string;
  component?: string;
  presetId?: string;
  score?: number;
  runtimeTier?: string;
  runtimeCost?: number;
  reasons?: string[];
  alternatives?: Array<{ effectId: string; score: number }>;
  openReason?: string;
}

export interface TemplateBlueprintV1 {
  schema: typeof TEMPLATE_BLUEPRINT_SCHEMA;
  surface: EffectTemplateSurface;
  niche: NicheId;
  slots: BlueprintSlotV1[];
  runtimeBudget: {
    runtime: number;
    runtimeMax: number;
    heavy: number;
    heavyMax: number;
    gpu: number;
    gpuMax: number;
    clickToRun: number;
    fullBleed: number;
    mobileRisk: string[];
  };
  /** Structural weights per runtime tier — never a measured frame rate. */
  costModel: 'structural-runtime-tier-weights';
}

export function buildTemplateBlueprintV1(
  surface: EffectTemplateSurface,
  niche: NicheId,
  slots: readonly TemplateSlot[],
  budget: RuntimeBudget,
): TemplateBlueprintV1 {
  return {
    schema: TEMPLATE_BLUEPRINT_SCHEMA,
    surface,
    niche,
    slots: slots.map((slot): BlueprintSlotV1 => {
      if (!slot.chosen) {
        return { role: slot.role, status: 'open', openReason: slot.openReason };
      }
      return {
        role: slot.role,
        status: 'selected',
        effectId: slot.chosen.core.id,
        component: slot.chosen.entry.meta.name,
        presetId: slot.chosen.preset?.id,
        score: slot.chosen.score,
        runtimeTier: slot.chosen.core.runtimeTier,
        runtimeCost: slot.chosen.cost,
        reasons: slot.chosen.reasons,
        // D007 exports up to two alternatives per role.
        alternatives: slot.alternatives.slice(0, 2).map((alt) => ({ effectId: alt.core.id, score: alt.score })),
      };
    }),
    runtimeBudget: {
      runtime: budget.runtime,
      runtimeMax: budget.runtimeMax,
      heavy: budget.heavy,
      heavyMax: budget.heavyMax,
      gpu: budget.gpu,
      gpuMax: budget.gpuMax,
      clickToRun: budget.clickToRun,
      fullBleed: budget.fullBleed,
      mobileRisk: [...budget.mobileRisk].sort(),
    },
    costModel: 'structural-runtime-tier-weights',
  };
}

/**
 * D020.5: a fingerprint over the canonical normalized payload plus schema
 * version, so an export can detect that the preview it was generated from is
 * stale. Deliberately a cheap stable hash — this guards staleness, not
 * security.
 */
export function payloadFingerprint(payload: unknown): string {
  const text = stableStringify(payload);
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ code, 0x01000193) >>> 0;
    h2 = Math.imul(h2 + code, 0x85ebca6b) >>> 0;
  }
  return `${h1.toString(16).padStart(8, '0')}${h2.toString(16).padStart(8, '0')}`;
}

export function configValueLabel(value: ConfigValue | undefined): string {
  return value === undefined ? '—' : String(value);
}
