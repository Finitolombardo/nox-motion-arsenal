import type { EffectEntry, EffectImprovementStatus } from '../types';
import effectUpdates from 'virtual:effect-updates';
import { BACKGROUNDS_CATALOG } from '../effects/backgrounds/catalog';
import { HERO_CATALOG } from '../effects/hero/catalog';
import { TRANSITIONS_CATALOG } from '../effects/transitions/catalog';
import { SCROLL_CATALOG } from '../effects/scroll/catalog';
import { CURSOR_CATALOG } from '../effects/cursor/catalog';
import { CARDS_CATALOG } from '../effects/cards/catalog';
import { SYSTEM_CATALOG } from '../effects/system/catalog';
import { FORMS_CATALOG } from '../effects/forms/catalog';
import { OVERLAYS_CATALOG } from '../effects/overlays/catalog';
import { PREMIUM_CATALOG } from '../effects/premium/catalog';
import { SOCIAL_PROOF_CATALOG } from '../effects/premium/socialProofCatalog';
import { SHOWCASE_CATALOG } from '../effects/premium/showcaseCatalog';
import { FORGE_SKILLTREE_CATALOG } from '../effects/forge-skilltree/catalog';
import { CANVAS_UI_CATALOG } from '../effects/canvas-ui/catalog';
import { IMG2THREEJS_CATALOG } from '../effects/img2threejs/catalog';
import { LAB_CATALOG } from '../effects/lab/catalog';
import { ORIGINKIT_CATALOG } from '../effects/originkit/catalog';

const RAW_EFFECTS_CATALOG: EffectEntry[] = [
  ...SHOWCASE_CATALOG,
  ...SOCIAL_PROOF_CATALOG,
  ...PREMIUM_CATALOG,
  ...FORGE_SKILLTREE_CATALOG,
  ...BACKGROUNDS_CATALOG,
  ...HERO_CATALOG,
  ...TRANSITIONS_CATALOG,
  ...SCROLL_CATALOG,
  ...CURSOR_CATALOG,
  ...CARDS_CATALOG,
  ...SYSTEM_CATALOG,
  ...FORMS_CATALOG,
  ...OVERLAYS_CATALOG,
  ...CANVAS_UI_CATALOG,
  ...IMG2THREEJS_CATALOG,
  ...LAB_CATALOG,
  ...ORIGINKIT_CATALOG,
];

const IMPROVEMENT_OVERRIDES: Record<string, Partial<EffectEntry['meta']>> = {
  'nox-spinimage': {
    improvementStatus: 'improved',
    lastImprovedAt: '2026-07-30T20:08:00.000Z',
    lastImprovedBy: 'foundry-hourly',
    improvementVersion: '2.0.0',
    improvementChangelog: [
      'Upgraded to a responsive 3D orbital image array with pointer-driven tilt and velocity impulse.',
      'Added depth sorting, glow trails, configurable core visuals, viewport pausing, and reduced-motion support.',
      'Preserved the original public props while exposing production-oriented orbit, depth, trail, and glow controls.',
    ],
  },
  'premium-glass-distortion-cards': {
    improvementStatus: 'improved',
    lastImprovedAt: '2026-07-30T21:07:00.000Z',
    lastImprovedBy: 'foundry-hourly',
    improvementVersion: '2.1.0',
    improvementChangelog: [
      'Exposed all five material variants and three energy profiles directly in the Arsenal control panel.',
      'Added production controls for depth, glass opacity, material scale, and optional in-effect switchers while preserving the original props.',
      'Documented the single-WebGL-context budget, touch fallback, and reduced-motion behavior for safer customer-site adoption.',
    ],
  },
  'premium-data-stream-journey': {
    improvementStatus: 'improved',
    lastImprovedAt: '2026-07-30T22:07:00.000Z',
    lastImprovedBy: 'foundry-hourly',
    improvementVersion: '2.1.0',
    improvementChangelog: [
      'Exposed five production-ready stream geometries and three energy profiles in the Arsenal control panel.',
      'Added operator controls for trail persistence, branch intensity, and optional in-effect variant and energy switchers while preserving legacy props.',
      'Documented the single Canvas2D loop, mobile particle budget, tap impulse, and reduced-motion static-frame behavior.',
    ],
  },
  'premium-timeline-orchestrator': {
    improvementStatus: 'improved',
    lastImprovedAt: '2026-07-30T23:07:00.000Z',
    lastImprovedBy: 'foundry-hourly',
    improvementVersion: '2.1.0',
    improvementChangelog: [
      'Added Revenue OS, Agent Ops, and Launch Sequence story presets with an optional in-effect variant switcher.',
      'Added calm, charged, and overdrive energy profiles that tune timeline speed, damping, line weight, and glow without adding runtime dependencies.',
      'Improved production readability with node detail labels, a moving progress pulse, mobile label fallback, and a complete reduced-motion end state while preserving all legacy props.',
    ],
  },
  'premium-signal-particles': {
    improvementStatus: 'improved',
    lastImprovedAt: '2026-07-31T12:10:00.000Z',
    lastImprovedBy: 'foundry-live',
    improvementVersion: '3.0.0',
    improvementChangelog: [
      'Rebuilt the motion on a divergence-free curl-noise flow field with real force integration (flow, cursor attraction, tangential curl, turbulence, viscosity) instead of sin/cos target positions with damping.',
      'Removed the link network, cross-hair sparks and straight trails in favour of soft glow sprites, transparent smoke splats, curved motion segments and a decay smear trail.',
      'Added a lagging smoothed cursor attractor with drag on fast movement, convergence and re-injection at the core, and a slow automatic attractor when the pointer leaves.',
      'Added the primary energy-smoke-flow narrative and replaced the controls with Flow Speed, Cursor Attraction, Turbulence, Viscosity, Smoke Persistence, Particle Size, Glow and Convergence Radius (linkDistance and the choreography modes are gone).',
    ],
  },
  'premium-terminal-scan-reveal': {
    improvementStatus: 'improved',
    lastImprovedAt: '2026-07-31T01:08:00.000Z',
    lastImprovedBy: 'foundry-hourly',
    improvementVersion: '2.1.0',
    improvementChangelog: [
      'Added System Audit, Lead Recovery, and Agent Readiness narratives with scenario-specific terminal copy, modules, and conversion CTAs.',
      'Added calm, charged, and overdrive energy profiles controlling sequence tempo, scan width, caret cadence, and glow while preserving speed, scanDuration, and autoStart.',
      'Added touch-friendly variant and energy switchers, optional replay control, aria-live terminal output, responsive mobile layout, and a complete reduced-motion end state without runtime dependencies.',
    ],
  },
  'skilltree-astral-constellation': {
    improvementStatus: 'improved',
    lastImprovedAt: '2026-07-31T02:09:00.000Z',
    lastImprovedBy: 'foundry-hourly',
    improvementVersion: '2.1.0',
    improvementChangelog: [
      'Added Focus OS, Revenue Command, and Agent Orchestration narratives with scenario-specific roots, node labels, and state topology.',
      'Added calm, charged, and overdrive energy profiles that scale animation tempo, atmosphere density, and stage glow while preserving nodeCount, speed, stars, and showLabels.',
      'Added keyboard-accessible, touch-friendly in-effect narrative and energy switchers without runtime dependencies or additional animation loops.',
    ],
  },
  'skilltree-floating-nodes': {
    improvementStatus: 'improved',
    lastImprovedAt: '2026-07-31T03:08:00.000Z',
    lastImprovedBy: 'foundry-hourly',
    improvementVersion: '2.1.0',
    improvementChangelog: [
      'Added Capability Map, Agent Swarm, and Revenue Orbit narratives with production-oriented labels and node-state sequencing.',
      'Added calm, charged, and overdrive energy profiles that tune float distance, tempo, atmosphere density, and pulse intensity while preserving count, floatDistance, and floatSpeed.',
      'Added optional labels, deterministic responsive placement, accessible scene labeling, and bounded CSS-only animation without runtime dependencies.',
    ],
  },
  'skilltree-active-pulse-ring': {
    improvementStatus: 'improved',
    lastImprovedAt: '2026-07-31T04:08:00.000Z',
    lastImprovedBy: 'foundry-hourly',
    improvementVersion: '2.1.0',
    improvementChangelog: [
      'Added Active Quest, Agent Execution, and Conversion Signal narratives with scenario-specific labels, states, badges, and context copy.',
      'Added calm, charged, and overdrive energy profiles that tune pulse tempo, node scale, float cadence, and atmosphere density while preserving pulseSpeed and size.',
      'Added optional variant, energy, and context props, bounded sizing, accessible scene labeling, responsive context treatment, and no additional animation loops or runtime dependencies.',
    ],
  },
  'skilltree-recommended-focus-ring': {
    improvementStatus: 'improved',
    lastImprovedAt: '2026-07-31T05:10:00.000Z',
    lastImprovedBy: 'foundry-hourly',
    improvementVersion: '2.1.0',
    improvementChangelog: [
      'Added Next Best Action, Operator Priority, and Conversion Path narratives with scenario-specific labels, recommendation badges, and context copy.',
      'Added calm, charged, and overdrive energy profiles that tune ring speed, node scale, float cadence, and atmosphere density while preserving spinSpeed and showBadge.',
      'Added optional variant, energy, and context props, bounded speed input, accessible scene labeling, responsive context treatment, and no additional animation loops or runtime dependencies.',
    ],
  },
};

function deriveImprovementStatus(entry: EffectEntry): EffectImprovementStatus {
  if (entry.meta.improvementStatus) return entry.meta.improvementStatus;
  if (entry.meta.mode === 'reference-lab') return 'needs-review';
  return 'pending';
}

export const EFFECTS_CATALOG: EffectEntry[] = RAW_EFFECTS_CATALOG.map((entry) => {
  const updatedAt = effectUpdates[entry.meta.importPath];
  const override = IMPROVEMENT_OVERRIDES[entry.meta.id] ?? {};
  const mergedMeta = { ...entry.meta, ...override };
  const improvementStatus = deriveImprovementStatus({ ...entry, meta: mergedMeta });

  return {
    ...entry,
    meta: {
      ...mergedMeta,
      updatedAt,
      improvementStatus,
      lastImprovedBy: mergedMeta.lastImprovedBy ?? 'unassigned',
      improvementVersion:
        mergedMeta.improvementVersion ??
        (improvementStatus === 'needs-review' ? '0.5.0' : '0.1.0'),
      improvementChangelog: mergedMeta.improvementChangelog ?? [],
    },
  };
});

const seen = new Set<string>();
for (const e of EFFECTS_CATALOG) {
  if (seen.has(e.meta.id)) console.error(`[motion-arsenal] duplicate effect id: ${e.meta.id}`);
  seen.add(e.meta.id);
}
