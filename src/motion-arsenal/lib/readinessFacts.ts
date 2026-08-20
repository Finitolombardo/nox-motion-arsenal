import type { EffectEntry, EffectNichePreset } from '../types';

export interface ReadinessFacts {
  totalEffects: number;
  effectsWithPresets: number;
  totalPresets: number;
  effectsWithoutPresets: EffectEntry[];
  presets: Array<{ effect: EffectEntry; preset: EffectNichePreset; invalidPropKeys: string[]; missingMetadata: string[] }>;
  runtime: Array<{ effect: EffectEntry; missingMetadata: string[] }>;
  integrations: Array<{ effect: EffectEntry; missingMetadata: string[] }>;
}

/** Read-only dashboard facts derived only from EFFECTS_CATALOG metadata. */
export function inspectReadinessFacts(catalog: readonly EffectEntry[]): ReadinessFacts {
  const presets = catalog.flatMap((effect) => (effect.meta.presets ?? []).map((preset) => {
    const propKeys = new Set(effect.meta.props.map((prop) => prop.key));
    const invalidPropKeys = Object.keys(preset.props).filter((key) => !propKeys.has(key)).sort();
    const missingMetadata = [
      !preset.description ? 'description' : null,
      !preset.tags?.length ? 'tags' : null,
      !preset.performanceProfile ? 'performance profile' : null,
      !preset.mobileProfile ? 'mobile profile' : null,
      !preset.templateSurfaces?.length ? 'template surfaces' : null,
      !preset.templateRoles?.length ? 'template roles' : null,
    ].filter((item): item is string => Boolean(item));
    return { effect, preset, invalidPropKeys, missingMetadata };
  }));

  const runtime = catalog.map((effect) => ({
    effect,
    missingMetadata: [
      !effect.meta.performanceNotes.trim() ? 'performance notes' : null,
      !effect.meta.mobileNotes.trim() ? 'mobile notes' : null,
      !effect.meta.reducedMotionNotes.trim() ? 'reduced-motion notes' : null,
    ].filter((item): item is string => Boolean(item)),
  }));

  const integrations = catalog.map((effect) => ({
    effect,
    missingMetadata: [
      !effect.meta.importPath.trim() ? 'import path' : null,
      !effect.meta.usageJsx.trim() ? 'usage JSX' : null,
      !effect.meta.sourceFiles.length ? 'source files' : null,
      !effect.meta.technicalBasis?.trim() ? 'technical basis' : null,
    ].filter((item): item is string => Boolean(item)),
  }));

  return {
    totalEffects: catalog.length,
    effectsWithPresets: new Set(presets.map(({ effect }) => effect.meta.id)).size,
    totalPresets: presets.length,
    effectsWithoutPresets: catalog.filter((effect) => !(effect.meta.presets?.length)),
    presets,
    runtime,
    integrations,
  };
}
