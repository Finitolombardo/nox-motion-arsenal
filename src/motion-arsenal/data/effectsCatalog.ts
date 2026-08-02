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
import { CONCEPTS_CATALOG } from '../effects/concepts/catalog';

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
  ...CONCEPTS_CATALOG,
];

const IMPROVEMENT_OVERRIDES: Record<string, Partial<EffectEntry['meta']>> = {
  'scroll-cosmic-depth-field': {
    improvementStatus: 'improved',
    lastImprovedAt: '2026-07-31T18:00:00.000Z',
    lastImprovedBy: 'claude-code',
    improvementVersion: '1.0.0',
    improvementChangelog: [
      'New calm depth-field starfield: layered depth, a real focus plane, sprite-based depth blur and bokeh, subtle bloom.',
      'Motion is scroll-coupled only — no time-based screensaver drift; foregroundStarRatio and foregroundMaxSize cap the large bright foreground dots the brief rules out.',
      'Full dashboard surface: density, size, depth, scroll, glow, blur/bokeh, trails, visual and mobile groups (45 controls, all shareable).',
    ],
  },
  'scroll-pinned-product-stage': {
    improvementStatus: 'improved',
    lastImprovedAt: '2026-07-31T18:00:00.000Z',
    lastImprovedBy: 'claude-code',
    improvementVersion: '2.2.0',
    improvementChangelog: [
      'Added a page-scroll driver so the stage can be pinned inside a real website instead of trapping the wheel in its own scrollport.',
      'Added the nox-revenue-os variant with per-chapter module sets, so the object re-assembles between chapters instead of only shifting colour.',
      'Added scroll-coupled object rotation: rotationY = baseRotationY + progress x rotationTurns x 360 x direction + stage rotation x influence. Pure function of scroll progress, so scrolling back unwinds the rotation exactly — no time-based endless spin.',
      'Exposed the full presentation surface in the dashboard: content, scroll, rotation, object presentation, lighting, background, stage visuals, mobile and reduced-motion groups (49 controls, all shareable).',
      'All previously public props keep their defaults and behaviour; damping, rotatePerSection, scalePulse and colorShift remain wired under a Legacy group.',
    ],
  },
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
    lastImprovedAt: '2026-07-31T00:09:00.000Z',
    lastImprovedBy: 'foundry-hourly',
    improvementVersion: '2.1.0',
    improvementChangelog: [
      'Added five production-ready particle narratives: Agent Constellation, Revenue Funnel Flight, Forge Ember Murmuration, Signal Resonance Vortex, and Command Formation.',
      'Added calm, charged, and overdrive energy profiles plus operator-selectable orbit, swarm, settle, and automatic choreography while preserving the original count, mode, intensity, and sparkSize props.',
      'Added configurable trail persistence, link distance, variant, energy, and mode switchers with a static reduced-motion presentation and a bounded single-Canvas2D particle budget.',
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
  const updatedAt = effectUpdates[entry.meta.importPath] ?? entry.meta.updatedAt;
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
