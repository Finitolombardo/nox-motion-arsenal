import type {
  CoreCanonEntry,
  EffectEntry,
  EffectNichePreset,
  EffectTemplateRole,
  EffectTemplateSurface,
  NicheId,
} from '../types';
import { CORE_CANON, CORE_CANON_BY_ID, coreNichePresets } from '../data/coreCanon';

// ---------------------------------------------------------------------------
// Template composer.
//
// For a chosen surface and niche it fills one slot per role with the best
// canonical core, and reports why. A slot with no genuinely fitting core is
// left OPEN — forcing a bad effect into a slot is worse than an empty one, and
// the blueprint says so explicitly.
// ---------------------------------------------------------------------------

export const WEBSITE_ROLES: EffectTemplateRole[] = [
  'background', 'hero', 'surface', 'scroll', 'transition', 'form', 'overlay',
];

export const DASHBOARD_ROLES: EffectTemplateRole[] = [
  'background', 'surface', 'form', 'overlay', 'cursor', 'system',
];

export const ROLE_LABELS: Record<EffectTemplateRole, string> = {
  background: 'Background',
  hero: 'Hero',
  surface: 'Surface',
  scroll: 'Scroll',
  transition: 'Transition',
  form: 'Form',
  overlay: 'Overlay',
  cursor: 'Cursor',
  system: 'System',
};

export function rolesForSurface(surface: EffectTemplateSurface): EffectTemplateRole[] {
  return surface === 'website' ? WEBSITE_ROLES : DASHBOARD_ROLES;
}

// Runtime cost per tier, in the same abstract units the budget is expressed in.
// These are structural weights (how much work the core sets up), not measured
// frame times — the UI never claims an FPS it did not measure.
const TIER_COST: Record<CoreCanonEntry['runtimeTier'], number> = {
  light: 1,
  standard: 2,
  heavy: 5,
  gpu: 6,
};

export interface TemplateCandidate {
  core: CoreCanonEntry;
  entry: EffectEntry;
  preset: EffectNichePreset | null;
  score: number;
  reasons: string[];
  cost: number;
}

export interface TemplateSlot {
  role: EffectTemplateRole;
  chosen: TemplateCandidate | null;
  alternatives: TemplateCandidate[];
  /** Set when no core scored high enough to be worth placing. */
  openReason?: string;
}

export interface RuntimeBudget {
  runtime: number;
  runtimeMax: number;
  heavy: number;
  heavyMax: number;
  gpu: number;
  gpuMax: number;
  clickToRun: number;
  fullBleed: number;
  mobileRisk: string[];
}

/** A slot needs a real reason to be filled, not merely a tag match. */
const MIN_SCORE = 30;

/**
 * Hard eligibility gates run before scoring (D007/D013): a gated candidate is
 * not merely unlikely, it is ineligible, and no score can promote it.
 */
function isEligible(core: CoreCanonEntry, role: EffectTemplateRole, surface: EffectTemplateSurface): boolean {
  if (!core.templateRoles.includes(role)) return false;
  if (!core.templateSurfaces.includes(surface)) return false;
  // Dashboard surfaces carry a heavy budget of zero by canon.
  if (surface === 'dashboard' && (core.runtimeTier === 'heavy' || core.runtimeTier === 'gpu')) return false;
  return true;
}

function scoreCandidate(
  core: CoreCanonEntry,
  role: EffectTemplateRole,
  surface: EffectTemplateSurface,
  niche: NicheId,
): { score: number; reasons: string[]; preset: EffectNichePreset | null } | null {
  if (!isEligible(core, role, surface)) return null;

  const reasons: string[] = [];
  // Declared priority is the base: it encodes how canonical this core is for
  // the roles it claims.
  let score = core.templatePriority * 0.5;
  reasons.push(`Declared for the ${ROLE_LABELS[role]} role on ${surface}.`);

  const preset = coreNichePresets(core.id).find((item) => item.niche === niche) ?? null;
  if (preset) {
    score += 40;
    reasons.push(`Carries a curated ${niche} preset.`);
  } else {
    score -= 15;
    reasons.push('No curated preset for this niche — runs on core defaults.');
  }

  // The primary role a core declares outranks its secondary claims.
  if (core.templateRoles[0] === role) {
    score += 10;
    reasons.push('This is the core primary role.');
  }

  if (core.runtimeTier === 'gpu' || core.runtimeTier === 'heavy') {
    score -= 8;
    reasons.push(`Runtime tier is ${core.runtimeTier}; it consumes most of the budget.`);
  }

  return { score, reasons, preset };
}

export function composeTemplate(
  catalog: readonly EffectEntry[],
  surface: EffectTemplateSurface,
  niche: NicheId,
  pinned: Partial<Record<EffectTemplateRole, string>> = {},
): TemplateSlot[] {
  const entryById = new Map(catalog.map((entry) => [entry.meta.id, entry]));

  return rolesForSurface(surface).map((role) => {
    const candidates: TemplateCandidate[] = [];
    for (const core of CORE_CANON) {
      const entry = entryById.get(core.id);
      if (!entry) continue;
      const scored = scoreCandidate(core, role, surface, niche);
      if (!scored) continue;
      candidates.push({
        core,
        entry,
        preset: scored.preset,
        score: Math.round(scored.score),
        reasons: scored.reasons,
        cost: TIER_COST[core.runtimeTier],
      });
    }
    const COMPLEXITY_ORDER = ['low', 'medium', 'high', 'heavy'];
    candidates.sort((a, b) =>
      b.score - a.score
      || b.core.templatePriority - a.core.templatePriority
      || COMPLEXITY_ORDER.indexOf(a.entry.meta.complexity) - COMPLEXITY_ORDER.indexOf(b.entry.meta.complexity)
      || a.core.id.localeCompare(b.core.id));

    const pin = pinned[role];
    const pinnedCandidate = pin ? candidates.find((c) => c.core.id === pin) ?? null : null;
    const best = pinnedCandidate ?? candidates[0] ?? null;

    if (!best) {
      return { role, chosen: null, alternatives: [], openReason: 'No canonical core declares this role for this surface.' };
    }
    if (!pinnedCandidate && best.score < MIN_SCORE) {
      return {
        role,
        chosen: null,
        alternatives: candidates,
        openReason: `Best candidate scored ${best.score}, below the ${MIN_SCORE} threshold — left open rather than forced.`,
      };
    }
    return { role, chosen: best, alternatives: candidates.filter((c) => c !== best).slice(0, 4) };
  });
}

// D007: website and dashboard carry separate budgets, and dashboard enforces a
// heavy budget of zero.
const SURFACE_BUDGET: Record<EffectTemplateSurface, { runtimeMax: number; heavyMax: number; gpuMax: number }> = {
  website: { runtimeMax: 18, heavyMax: 1, gpuMax: 1 },
  dashboard: { runtimeMax: 12, heavyMax: 0, gpuMax: 0 },
};

export function runtimeBudget(
  slots: readonly TemplateSlot[],
  surface: EffectTemplateSurface = 'website',
): RuntimeBudget {
  const caps = SURFACE_BUDGET[surface];
  const chosen = slots.map((slot) => slot.chosen).filter((c): c is TemplateCandidate => Boolean(c));
  const mobileRisk: string[] = [];
  for (const candidate of chosen) {
    if (candidate.core.runtimeTier === 'gpu') mobileRisk.push(`${candidate.core.id} needs WebGL`);
    else if (candidate.core.runtimeTier === 'heavy') mobileRisk.push(`${candidate.core.id} is heavy on mobile`);
    else if (candidate.entry.meta.clickToRun) mobileRisk.push(`${candidate.core.id} is click-to-run`);
  }
  return {
    runtime: chosen.reduce((sum, c) => sum + c.cost, 0),
    runtimeMax: caps.runtimeMax,
    heavy: chosen.filter((c) => c.core.runtimeTier === 'heavy').length,
    heavyMax: caps.heavyMax,
    gpu: chosen.filter((c) => c.core.runtimeTier === 'gpu').length,
    gpuMax: caps.gpuMax,
    clickToRun: chosen.filter((c) => c.entry.meta.clickToRun).length,
    fullBleed: chosen.filter((c) => c.entry.meta.fullBleed).length,
    mobileRisk,
  };
}

export function buildBlueprint(
  surface: EffectTemplateSurface,
  niche: NicheId,
  slots: readonly TemplateSlot[],
  budget: RuntimeBudget,
): string {
  const lines: string[] = [
    `NOX MOTION ARSENAL — ${surface.toUpperCase()} BLUEPRINT`,
    `Niche: ${niche}`,
    '',
  ];
  for (const slot of slots) {
    if (!slot.chosen) {
      lines.push(`${ROLE_LABELS[slot.role].toUpperCase()}: OPEN SLOT`);
      lines.push(`  ${slot.openReason ?? 'No fitting core.'}`);
      lines.push('');
      continue;
    }
    const { core, preset, score, cost, reasons } = slot.chosen;
    lines.push(`${ROLE_LABELS[slot.role].toUpperCase()}: ${core.id}`);
    lines.push(`  Component: ${slot.chosen.entry.meta.name}`);
    lines.push(`  Preset: ${preset ? preset.label : 'core defaults'}`);
    lines.push(`  Runtime: ${core.runtimeTier} (cost ${cost})`);
    lines.push(`  Score: ${score}`);
    for (const reason of reasons) lines.push(`  - ${reason}`);
    lines.push('');
  }
  lines.push('RUNTIME BUDGET');
  lines.push(`  Runtime ${budget.runtime} / ${budget.runtimeMax}`);
  lines.push(`  Heavy   ${budget.heavy} / ${budget.heavyMax}`);
  lines.push(`  GPU     ${budget.gpu} / ${budget.gpuMax}`);
  lines.push(`  Click-to-run cores: ${budget.clickToRun}`);
  lines.push(`  Full-bleed cores: ${budget.fullBleed}`);
  if (budget.mobileRisk.length) {
    lines.push('  Mobile notes:');
    for (const note of budget.mobileRisk) lines.push(`    - ${note}`);
  }
  lines.push('');
  lines.push('Costs are structural weights derived from each core runtime tier, not measured frame rates.');
  return lines.join('\n');
}

export function buildNichePack(niche: NicheId, catalog: readonly EffectEntry[]): string {
  const entryById = new Map(catalog.map((entry) => [entry.meta.id, entry]));
  const lines = [`NOX MOTION ARSENAL — NICHE PACK: ${niche.toUpperCase()}`, ''];
  for (const core of CORE_CANON) {
    const preset = coreNichePresets(core.id).find((item) => item.niche === niche);
    if (!preset) continue;
    const entry = entryById.get(core.id);
    lines.push(`${core.role.toUpperCase()} — ${core.id}`);
    lines.push(`  Component: ${entry?.meta.name ?? core.id}`);
    lines.push(`  Preset: ${preset.label}`);
    lines.push(`  Runtime: ${core.runtimeTier}`);
    lines.push(`  Why it fits: ${preset.description ?? '—'}`);
    lines.push(`  Props: ${JSON.stringify(preset.props)}`);
    lines.push('');
  }
  return lines.join('\n');
}

export function coreCanonFor(id: string): CoreCanonEntry | undefined {
  return CORE_CANON_BY_ID.get(id);
}
