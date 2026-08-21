import type {
  CoreCanonEntry,
  CoreModuleDefinition,
  EffectMeta,
  EffectNichePreset,
  EffectPresetPerformanceProfile,
  EffectPropControl,
} from '../types';
import { componentIdentifier, defaultConfigValues, normalizeControlValue, type ConfigValue, type EffectConfigValues } from './effectConfig';

// ---------------------------------------------------------------------------
// Core Builder state model.
//
// The builder never mutates a single flat config bag. It keeps the *reasons*
// for a value — mode, niche preset, performance profile, explicit edits — and
// resolves them in a fixed precedence every render:
//
//   CORE DEFAULT -> MODE DEFAULT -> NICHE PRESET -> PERFORMANCE PROFILE -> USER
//
// The profile layer only applies when the operator explicitly picks one. A
// preset merely *reports* which profile its curated values correspond to; if
// that label were applied as overrides it would overwrite the preset's own
// tuning. Only `overrides` is user-authored, which is what makes RESET TO
// PRESET and RESET TO CORE exact rather than approximate.
// ---------------------------------------------------------------------------

export interface CoreBuilderState {
  /** Value of the core's mode control, when it has one. */
  mode: string | null;
  /** Selected niche preset id, or null for the bare core. */
  presetId: string | null;
  /** Selected performance profile, or null to inherit whatever the preset set. */
  profileId: EffectPresetPerformanceProfile | null;
  /** Explicit operator edits — the only user-authored layer. */
  overrides: EffectConfigValues;
}

export interface ResolvedCoreState {
  values: EffectConfigValues;
  /** Which layer each key's final value came from, for the export preview. */
  provenance: Record<string, 'core' | 'mode' | 'preset' | 'profile' | 'user'>;
  preset: EffectNichePreset | null;
  profile: EffectPresetPerformanceProfile | null;
}

export function emptyCoreState(core: CoreCanonEntry | undefined, meta: EffectMeta): CoreBuilderState {
  const modeControl = core?.modeControl;
  const control = modeControl ? meta.props.find((p) => p.key === modeControl) : undefined;
  return {
    mode: control ? String(control.default) : null,
    presetId: null,
    profileId: null,
    overrides: {},
  };
}

function applyLayer(
  target: EffectConfigValues,
  provenance: ResolvedCoreState['provenance'],
  source: Record<string, unknown>,
  layer: ResolvedCoreState['provenance'][string],
  controls: Map<string, EffectPropControl>,
) {
  for (const [key, raw] of Object.entries(source)) {
    const control = controls.get(key);
    // A layer may only write props the core actually exposes; anything else
    // would be a prop the preview cannot render and the export would lie about.
    if (!control || raw === undefined || raw === null) continue;
    target[key] = normalizeControlValue(control, raw);
    provenance[key] = layer;
  }
}

export function resolveCoreState(
  meta: EffectMeta,
  core: CoreCanonEntry | undefined,
  state: CoreBuilderState,
  presets: readonly EffectNichePreset[],
): ResolvedCoreState {
  const controls = new Map(meta.props.map((control) => [control.key, control]));
  const values = defaultConfigValues(meta);
  const provenance: ResolvedCoreState['provenance'] = {};
  for (const key of Object.keys(values)) provenance[key] = 'core';

  if (core?.modeControl && state.mode !== null) {
    applyLayer(values, provenance, { [core.modeControl]: state.mode }, 'mode', controls);
  }

  const preset = presets.find((item) => item.id === state.presetId) ?? null;
  if (preset) applyLayer(values, provenance, preset.props, 'preset', controls);

  // A preset's `performanceProfile` is a *label* describing the cost of the
  // state it already curates — re-applying that profile's overrides on top
  // would clobber the very values the preset chose (two presets tagged
  // "cinematic" would then collapse onto the same density). Only an explicit
  // operator pick actually writes profile overrides.
  const profile = state.profileId
    ? core?.profiles?.find((item) => item.id === state.profileId) ?? null
    : null;
  if (profile) applyLayer(values, provenance, profile.overrides, 'profile', controls);
  const highlightedProfile = state.profileId ?? preset?.performanceProfile ?? null;

  applyLayer(values, provenance, state.overrides, 'user', controls);

  return { values, provenance, preset, profile: highlightedProfile };
}

/** Controls the builder shows before ADVANCED, in the order the canon declares. */
export function splitCoreControls(meta: EffectMeta, core: CoreCanonEntry | undefined) {
  const moduleKeys = new Set((core?.modules ?? []).map((m) => m.key));
  const primaryKeys = new Set(core?.coreControls ?? meta.props.slice(0, 8).map((p) => p.key));
  const isMode = (key: string) => core?.modeControl === key;

  const primary: EffectPropControl[] = [];
  const advanced: EffectPropControl[] = [];
  for (const control of meta.props) {
    // Modes and modules get their own dedicated UI, so they never repeat as sliders.
    if (isMode(control.key) || moduleKeys.has(control.key)) continue;
    (primaryKeys.has(control.key) ? primary : advanced).push(control);
  }
  // Preserve the canon's declared order for the primary set.
  const order = core?.coreControls ?? [];
  primary.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
  return { primary, advanced };
}

export function isModuleOn(module: CoreModuleDefinition, value: ConfigValue | undefined): boolean {
  if (module.onValue !== undefined) return value === module.onValue;
  return value === true;
}

export function moduleToggleValue(module: CoreModuleDefinition, on: boolean): ConfigValue {
  if (module.onValue !== undefined) return (on ? module.onValue : module.offValue) as ConfigValue;
  return on;
}

function formatJsxValue(control: EffectPropControl, value: ConfigValue): string {
  if (control.type === 'boolean') return value ? '' : '{false}';
  if (control.type === 'range') return `{${value}}`;
  return `"${String(value).replace(/"/g, '&quot;')}"`;
}

/**
 * MINIMAL JSX: the component, the selected mode when it is not the core
 * default, and only the props that genuinely differ from the resolved core
 * defaults. Emitting the full prop set would bury the three values that matter
 * under a wall of defaults.
 */
export function buildMinimalJsx(
  meta: EffectMeta,
  core: CoreCanonEntry | undefined,
  resolved: ResolvedCoreState,
): string {
  const component = componentIdentifier(meta);
  const defaults = defaultConfigValues(meta);
  const controls = new Map(meta.props.map((control) => [control.key, control]));
  const parts: string[] = [];

  for (const [key, value] of Object.entries(resolved.values)) {
    if (resolved.provenance[key] === 'core') continue;
    if (defaults[key] === value) continue;
    const control = controls.get(key);
    if (!control) continue;
    const rendered = formatJsxValue(control, value);
    parts.push(rendered === '' ? key : `${key}=${rendered}`);
  }

  if (!parts.length) return `<${component} />`;
  if (parts.length <= 3) return `<${component} ${parts.join(' ')} />`;
  return [`<${component}`, ...parts.map((part) => `  ${part}`), '/>'].join('\n');
}

export function buildPresetLink(meta: EffectMeta, state: CoreBuilderState, origin?: string): string {
  const base = origin ?? (typeof window !== 'undefined' ? window.location.href.split('#')[0] : '');
  const params = new URLSearchParams();
  if (state.mode) params.set('mode', state.mode);
  if (state.presetId) params.set('preset', state.presetId);
  if (state.profileId) params.set('profile', state.profileId);
  const query = params.toString();
  return `${base}#/core/${meta.id}${query ? `?${query}` : ''}`;
}

export function readCoreStateFromQuery(
  query: string,
  meta: EffectMeta,
  core: CoreCanonEntry | undefined,
): CoreBuilderState {
  const params = new URLSearchParams(query);
  const base = emptyCoreState(core, meta);
  const mode = params.get('mode');
  const preset = params.get('preset');
  const profile = params.get('profile');
  return {
    ...base,
    mode: mode && core?.modes?.some((m) => m.value === mode) ? mode : base.mode,
    presetId: preset || null,
    profileId: (profile as EffectPresetPerformanceProfile | null) ?? null,
  };
}
