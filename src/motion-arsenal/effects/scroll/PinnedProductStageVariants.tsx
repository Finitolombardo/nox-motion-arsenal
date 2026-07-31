import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from 'react';
import { clamp, damp, lerp, seededRandom, smoothstep, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { glyphPath } from '../../lib/svgUtils';
import { NoxFloatingCardOS, type NoxCardStyle, type NoxStageCardVariant } from '../hero/NoxFloatingCardOS';

// ---------------------------------------------------------------------------
// PinnedProductStage — a reusable, referenceable product-story system.
// Each stable variant packages copy, visual modules, proof metrics and an agent
// reference that can be reused in NOX or customer websites.
// ---------------------------------------------------------------------------

export type ProductStageVariantId =
  | 'nox-floating-card-os'
  | 'nox-revenue-os'
  | 'nox-global-sales-os'
  | 'project-x-command-center'
  | 'ai-growth-engine'
  | 'conversion-website-system'
  | 'automation-ops-system';

/**
 * `internal` — the stage owns a scroll container (Arsenal preview default).
 * `page`     — the stage sits in the document flow and is driven by the page
 *              scroll. Required for product websites, where trapping the wheel
 *              inside a box is a UX regression.
 */
export type StageScrollDriver = 'internal' | 'page';

/**
 * `shells`      — concentric shells + orbits (original look).
 * `signal-flow` — modules re-arrange per chapter, so the object visibly mutates
 *                 instead of only shifting colour.
 */
export type StageVisualMode = 'shells' | 'signal-flow';

/** Achsen, auf die der Scroll-Fortschritt als Drehung gelegt wird. */
export type StageRotationAxis = 'x' | 'y' | 'z' | 'xy' | 'xyz';
export type StageRotationDirection = 'clockwise' | 'counter-clockwise';
/**
 * `off`         — keine Drehung, das Objekt steht in seiner Basisrotation.
 * `stage-only`  — keine Scroll-Drehung, aber die stufen-eigene Rotation bleibt.
 * `static`      — Endzustand der letzten Stufe, komplett unbewegt.
 */
export type StageReducedMotionRotation = 'off' | 'stage-only' | 'static';
export type StageEffectsQuality = 'low' | 'medium' | 'high';

export interface PinnedProductStageProps {
  variant?: ProductStageVariantId;
  showVariantSwitcher?: boolean;
  damping?: number;
  rotatePerSection?: number;
  scalePulse?: number;
  colorShift?: boolean;
  seed?: number;
  /** Scroll source. Defaults to the historical internal scroller. */
  scrollDriver?: StageScrollDriver;
  /** Page mode only: chapter height in viewport heights (0.6 = fast story). */
  compactScroll?: number;
  /** Object language. Defaults to the historical shell stack. */
  visualMode?: StageVisualMode;
  /** `demo` keeps the Arsenal chrome (agent ref, scroll hint). `minimal` drops it. */
  chrome?: 'demo' | 'minimal';

  // --- Content ------------------------------------------------------------
  /** Feste Stufe (0-basiert). -1 = dem Scroll folgen. */
  stage?: number;
  /** Kapitel laufen ohne Scroll durch — für Vorschauen und Screens. */
  autoProgress?: boolean;
  /** Sekunden pro Kapitel im Auto-Modus. */
  autoProgressSpeed?: number;
  /** Bequemer Schalter für scrollDriver="page". */
  pageScrollMode?: boolean;
  /** Arsenal-only adapter for page mode inside a bounded preview box. */
  previewScrollSimulation?: boolean;
  showStepNavigation?: boolean;
  /** Modul-Beschriftungen und Kapitel-Tags ein-/ausblenden. */
  showLabels?: boolean;

  // --- Scroll -------------------------------------------------------------
  /** Gesamtlänge der Bühne in Viewport-Höhen. > 0 schlägt compactScroll. */
  scrollLength?: number;
  /** 0 = hart am Scroll, 1 = stark nachlaufend. */
  scrollSmoothing?: number;
  /** Zieht den Fortschritt zur nächsten Kapitelmitte (0 = aus). */
  stageSnapStrength?: number;
  /** Sekunden für den Kapitelwechsel der Textspalte. */
  stageTransitionDuration?: number;

  // --- Object rotation ----------------------------------------------------
  scrollRotationEnabled?: boolean;
  rotationAxis?: StageRotationAxis;
  /** Volle Umdrehungen über die gesamte Bühne. */
  rotationTurns?: number;
  rotationDirection?: StageRotationDirection;
  baseRotationX?: number;
  baseRotationY?: number;
  baseRotationZ?: number;
  /** Wie stark die stufen-eigene Rotation zusätzlich wirkt (0…1). */
  stageRotationInfluence?: number;
  /** 0 = sofort, 1 = sehr träge. */
  rotationSmoothing?: number;

  // --- Object presentation ------------------------------------------------
  objectScale?: number;
  objectDepth?: number;
  perspective?: number;
  cameraDistance?: number;
  objectTilt?: number;
  objectFloat?: number;
  objectFloatSpeed?: number;

  // --- Lighting -----------------------------------------------------------
  glow?: number;
  bloom?: number;
  rimLight?: number;
  highlightIntensity?: number;
  shadowIntensity?: number;
  glassOpacity?: number;
  blurStrength?: number;

  // --- Background ---------------------------------------------------------
  backgroundIntensity?: number;
  gridOpacity?: number;
  ambientParticles?: number;
  vignette?: number;
  atmosphericGlow?: number;

  // --- Stage-specific object change ---------------------------------------
  stageVisualIntensity?: number;
  stageMorphStrength?: number;
  stageColorShift?: number;
  stageObjectSpread?: number;
  stageSymbolScale?: number;

  // --- Mobile -------------------------------------------------------------
  mobileRotationTurns?: number;
  mobileObjectScale?: number;
  mobileEffectsQuality?: StageEffectsQuality;
  disableRotationOnMobile?: boolean;

  // --- Reduced motion -----------------------------------------------------
  reducedMotionRotation?: StageReducedMotionRotation;

  // --- Floating card OS aliases ------------------------------------------
  cardStyle?: NoxCardStyle;
  stageCardVariant?: NoxStageCardVariant;
  cardScale?: number;
  cardTilt?: number;
  cardFloat?: number;
  cardFloatSpeed?: number;
  scrollRotationTurns?: number;
  morphStrength?: number;
  stageSpread?: number;
  depth?: number;
  showHud?: boolean;
}

type CssVars = CSSProperties & Record<`--${string}`, string | number>;

type StageSection = {
  kicker: string;
  title: string;
  body: string;
  accent: string;
  accent2: string;
  rotX: number;
  rotY: number;
  rotZ: number;
  scale: number;
  explode: number;
  scan: number;
  stat: string;
  statLabel: string;
  telemetry: [number, number, number];
  tags: string[];
  /** Optional per-chapter module set — the object mutates instead of recolouring. */
  frags?: [StageFragment, StageFragment, StageFragment, StageFragment];
};

type StageFragment = {
  x: number;
  y: number;
  z: number;
  r: number;
  label: string;
};

type ProductStageVariant = {
  id: ProductStageVariantId;
  shortLabel: string;
  productName: string;
  stageLabel: string;
  agentReference: string;
  ctaLabel: string;
  meterLabels: [string, string, string];
  fragments: [StageFragment, StageFragment, StageFragment, StageFragment];
  sections: [StageSection, StageSection, StageSection, StageSection, StageSection];
};

const motion = (
  kicker: string,
  title: string,
  body: string,
  accent: string,
  accent2: string,
  rotX: number,
  rotY: number,
  rotZ: number,
  scale: number,
  explode: number,
  scan: number,
  stat: string,
  statLabel: string,
  telemetry: [number, number, number],
  tags: string[],
  frags?: [StageFragment, StageFragment, StageFragment, StageFragment],
): StageSection => ({
  kicker,
  title,
  body,
  accent,
  accent2,
  rotX,
  rotY,
  rotZ,
  scale,
  explode,
  scan,
  stat,
  statLabel,
  telemetry,
  tags,
  frags,
});

export const PRODUCT_STAGE_VARIANTS: Record<ProductStageVariantId, ProductStageVariant> = {
  'nox-floating-card-os': {
    id: 'nox-floating-card-os',
    shortLabel: 'FLOATING CARD OS',
    productName: 'NOX OPERATING STAGE',
    stageLabel: 'SIGNAL TO COMMAND',
    agentReference: 'motion:scroll-pinned-product-stage@nox-floating-card-os',
    ctaLabel: 'SYSTEM BESPRECHEN',
    meterLabels: ['SIGNAL', 'PRIORITÄT', 'FREIGABE'],
    fragments: [
      { x: -1, y: -.7, z: 46, r: -14, label: 'SIGNAL' },
      { x: 1, y: -.6, z: 34, r: 12, label: 'SCORE' },
      { x: -1, y: .65, z: 26, r: 10, label: 'ACTION' },
      { x: 1, y: .7, z: 50, r: -11, label: 'CONTROL' },
    ],
    sections: [
      motion('01 / SIGNAL CAPTURE', 'SIGNALE\nERFASSEN', 'Website, Google, Content und Formulare laufen als verwertbare Nachfrage-Signale an einer Stelle zusammen.', '#b7352d', '#e2b56f', -8, -14, -2, .98, .9, .08, 'EINGANG', 'SIGNALE LAUFEN AUF', [30, 14, 8], ['RADAR', 'INPUTS', 'SIGNALS']),
      motion('02 / QUALIFICATION', 'RELEVANZ\nSORTIEREN', 'Fit, Bedarf und Dringlichkeit werden strukturiert bewertet. Die nächste sinnvolle Bearbeitung wird sichtbar.', '#bc8b43', '#f1d49a', 4, -4, 2, 1.01, .78, .3, 'SCORE', 'PRIORISIERUNG AKTIV', [72, 48, 22], ['SCORE', 'FUNNEL', 'ANALYSE']),
      motion('03 / PITCH MUTATION', 'ANGEBOT\nANPASSEN', 'Messaging, Proof und Angebot verändern sich mit Branche, Kontext und Entscheidungslage – sichtbar statt als statischer Standardpitch.', '#795ee8', '#d6cbff', -4, 8, -3, 1.05, 1, .55, 'MUTATION', 'VERSION IM KONTEXT', [88, 74, 40], ['GROWTH', 'CHART', 'MORPH']),
      motion('04 / AGENT FOLLOW-UP', 'AKTIONEN\nVORBEREITEN', 'Agenten bereiten Follow-ups, Anreicherung und nächste Aufgaben vor. Versendet wird erst nach Freigabe.', '#2bb98d', '#b7f8df', 7, 18, 2, 1.02, .86, .22, 'QUEUED', 'AKTIONEN VORBEREITET', [96, 88, 62], ['AGENT', 'TIMELINE', 'TASKS']),
      motion('05 / OPERATOR COMMAND', 'KONTROLLE\nBEHALTEN', 'Der Operator kontrolliert Freigaben, Pipeline und nächste Aktionen. Das System schlägt vor – der Mensch entscheidet.', '#c94638', '#ffd0a1', -2, 28, 0, 1.04, .82, .08, 'READY', 'HUMAN CONTROL ACTIVE', [100, 100, 100], ['COMMAND', 'APPROVAL', 'CONTROL']),
    ],
  },
  // NOX Revenue OS — the chapter set used on noxlabs.net. Deliberately free of
  // result claims: every stat line names a system state, never an outcome.
  // Each chapter carries its own module set, so the object re-assembles per
  // step instead of only shifting hue.
  'nox-revenue-os': {
    id: 'nox-revenue-os',
    shortLabel: 'REVENUE OS',
    productName: 'NOX REVENUE OPERATING SYSTEM',
    stageLabel: 'NOX REVENUE STAGE',
    agentReference: 'motion:scroll-pinned-product-stage@nox-revenue-os',
    ctaLabel: 'SYSTEM BESPRECHEN',
    meterLabels: ['SIGNAL', 'STRUKTUR', 'FREIGABE'],
    fragments: [
      { x: -1, y: -0.72, z: 46, r: -16, label: 'WEBSITE' },
      { x: 0.92, y: -0.64, z: 34, r: 13, label: 'GOOGLE' },
      { x: -1.04, y: 0.62, z: 24, r: 10, label: 'CONTENT' },
      { x: 1.02, y: 0.7, z: 52, r: -12, label: 'FORMULAR' },
    ],
    sections: [
      motion(
        '01 / SIGNAL CAPTURE', 'SIGNALE\nERFASSEN',
        'Website, Google, Content und Formulare erzeugen verwertbare Nachfrage-Signale. Statt in Postfächern und Tabellen zu versickern, laufen sie an einer Stelle zusammen.',
        '#c93630', '#f0a15a', -11, -22, -3, 0.94, 0.92, 0.1, 'EINGANG', 'SIGNALE LAUFEN AUF', [30, 14, 8],
        ['WEBSITE', 'GOOGLE', 'FORMULARE'],
        [
          { x: -1.06, y: -0.82, z: 54, r: -18, label: 'WEBSITE' },
          { x: 1.02, y: -0.74, z: 40, r: 15, label: 'GOOGLE' },
          { x: -0.98, y: 0.78, z: 30, r: 12, label: 'CONTENT' },
          { x: 1.08, y: 0.68, z: 58, r: -14, label: 'FORMULAR' },
        ],
      ),
      motion(
        '02 / QUALIFICATION', 'QUALI-\nFIZIEREN',
        'Fit, Bedarf, Kaufkraft und Dringlichkeit werden strukturiert bewertet und priorisiert. Du siehst nicht mehr Anfragen — du siehst zuerst die richtigen.',
        '#b68b35', '#f4d992', 6, -8, 4, 1.03, 0.76, 0.7, 'FILTER', 'PRIORISIERUNG AKTIV', [72, 48, 22],
        ['FIT', 'DRINGLICHKEIT', 'POTENZIAL'],
        [
          { x: -0.52, y: -0.9, z: 62, r: -8, label: 'FIT' },
          { x: 0.5, y: -0.62, z: 44, r: 8, label: 'BEDARF' },
          { x: -0.46, y: 0.5, z: 26, r: 6, label: 'KAUFKRAFT' },
          { x: 0.44, y: 0.9, z: 14, r: -6, label: 'URGENZ' },
        ],
      ),
      motion(
        '03 / PITCH MUTATION', 'ANGEBOT\nANPASSEN',
        'Angebot, Proof und Messaging passen sich Zielkunde, Branche und Entscheidungslage an. Kein Standardpitch für alle, sondern die passende Version.',
        '#8f62ff', '#d7c1ff', -6, 9, -5, 1.1, 1, 1, 'MUTATION', 'ANGEBOT IM KONTEXT', [88, 74, 40],
        ['MESSAGING', 'PROOF', 'OFFER'],
        [
          { x: -1.12, y: -0.28, z: 66, r: -22, label: 'MESSAGING' },
          { x: 1.14, y: -0.34, z: 20, r: 20, label: 'PROOF' },
          { x: -0.34, y: 0.94, z: 48, r: 16, label: 'OFFER' },
          { x: 0.62, y: 0.44, z: 72, r: -18, label: 'KONTEXT' },
        ],
      ),
      motion(
        '04 / AGENT FOLLOW-UP', 'FOLLOW-UP\nVORBEREITEN',
        'Agenten bereiten Follow-ups, Anreicherung und nächste Pipeline-Aktionen vor. Nichts bleibt liegen, weil gerade niemand Zeit hatte — versendet wird erst nach Freigabe.',
        '#27d6a1', '#a9ffe5', 10, 24, 3, 1.0, 0.86, 0.4, 'VORBEREITET', 'WARTET AUF FREIGABE', [96, 88, 62],
        ['TIMELINE', 'ENRICHMENT', 'TASKS'],
        [
          { x: -1.18, y: 0.06, z: 30, r: -10, label: 'TIMELINE' },
          { x: -0.4, y: 0.06, z: 46, r: 0, label: 'AGENT' },
          { x: 0.44, y: 0.06, z: 46, r: 0, label: 'ENTWURF' },
          { x: 1.2, y: 0.06, z: 30, r: 10, label: 'REMINDER' },
        ],
      ),
      motion(
        '05 / OPERATOR COMMAND', 'FREIGABE\nBLEIBT BEI DIR',
        'Der Operator behält Kontrolle über Freigaben, Outreach, Pipeline und nächste Aktionen. Das System bereitet vor und schlägt vor — raus geht nur, was du freigibst.',
        '#ff4f40', '#ffd2a8', -3, 38, 0, 1.07, 0.9, 0.14, 'FREIGABE', 'MENSCH ENTSCHEIDET', [100, 100, 100],
        ['CONTROL', 'FREIGABE', 'PIPELINE'],
        [
          { x: -0.86, y: -0.74, z: 26, r: -12, label: 'DASHBOARD' },
          { x: 0.88, y: -0.7, z: 26, r: 12, label: 'PIPELINE' },
          { x: -0.86, y: 0.74, z: 26, r: 10, label: 'OPERATOR' },
          { x: 0.88, y: 0.72, z: 26, r: -10, label: 'FREIGABE' },
        ],
      ),
    ],
  },
  'nox-global-sales-os': {
    id: 'nox-global-sales-os',
    shortLabel: 'SALES OS',
    productName: 'NOX GLOBAL SALES OS',
    stageLabel: 'NOX PRODUCT STAGE',
    agentReference: 'motion:scroll-pinned-product-stage@nox-global-sales-os',
    ctaLabel: 'BUILD THE SALES SYSTEM',
    meterLabels: ['PIPELINE', 'SIGNAL', 'CLOSE'],
    fragments: [
      { x: -1, y: -0.72, z: 46, r: -16, label: 'ICP' },
      { x: 0.92, y: -0.64, z: 34, r: 13, label: 'OFFER' },
      { x: -1.04, y: 0.62, z: 24, r: 10, label: 'OUTREACH' },
      { x: 1.02, y: 0.7, z: 52, r: -12, label: 'CLOSE' },
    ],
    sections: [
      motion('01 / POSITION', 'BUILD THE\nCATEGORY', 'NOX turns a scattered service offer into a high-ticket category with a sharp ICP, a clear mechanism and a market position built to travel globally.', '#c93630', '#f0a15a', -12, -18, -3, 0.92, 0, 0.08, '€25K+', 'TARGET DEAL SIZE', [34, 22, 12], ['ICP', 'POSITIONING', 'VALUE']),
      motion('02 / OFFER', 'ENGINEER THE\nVALUE LADDER', 'The system opens into entry offers, flagship transformations and enterprise retainers. Every layer has a distinct promise, proof standard and next step.', '#b68b35', '#f4d992', 8, 74, 4, 1.04, 0.84, 0.62, '05', 'OFFER LAYERS', [72, 56, 38], ['ENTRY', 'FLAGSHIP', 'ENTERPRISE']),
      motion('03 / PIPELINE', 'OPERATE THE\nREVENUE MACHINE', 'Research, qualification, personalization and follow-up are routed through one operating loop instead of disconnected tools and manual handoffs.', '#8f62ff', '#d7c1ff', -7, 164, -5, 1.12, 0.48, 1, '24/7', 'PIPELINE ACTIVE', [96, 84, 72], ['RESEARCH', 'ROUTING', 'FOLLOW-UP']),
      motion('04 / PROOF', 'MAKE GROWTH\nMEASURABLE', 'The stage shifts from promises to evidence: reply quality, qualified opportunities, sales velocity and closed revenue become visible operating signals.', '#27d6a1', '#a9ffe5', 11, 258, 3, 0.98, 0.18, 0.34, '+38%', 'SALES VELOCITY', [100, 94, 88], ['PIPELINE', 'PROOF', 'REVENUE']),
      motion('05 / SCALE', 'DEPLOY THE\nGLOBAL SALES OS', 'The layers converge into a repeatable system that can be handed to operators, sales partners and agents without losing the strategic logic.', '#ff4f40', '#ffd2a8', -4, 360, 0, 1.08, 0, 0.12, 'LIVE', 'READY TO SCALE', [100, 100, 100], ['SYSTEM', 'OPERATORS', 'SCALE']),
    ],
  },
  'project-x-command-center': {
    id: 'project-x-command-center',
    shortLabel: 'PROJECT X',
    productName: 'PROJECT-X COMMAND CENTER',
    stageLabel: 'AGENT COMMAND STAGE',
    agentReference: 'motion:scroll-pinned-product-stage@project-x-command-center',
    ctaLabel: 'OPEN THE COMMAND CENTER',
    meterLabels: ['AGENTS', 'QUESTS', 'SYNC'],
    fragments: [
      { x: -1, y: -0.72, z: 46, r: -16, label: 'HERMES' },
      { x: 0.92, y: -0.64, z: 34, r: 13, label: 'TARTAROS' },
      { x: -1.04, y: 0.62, z: 24, r: 10, label: 'MEMORY' },
      { x: 1.02, y: 0.7, z: 52, r: -12, label: 'WORKERS' },
    ],
    sections: [
      motion('01 / COMMAND', 'SEE EVERY\nACTIVE AGENT', 'Project-X gives the operator one visual command layer for agents, workers, tools and live system status.', '#8e45ff', '#d7c1ff', -10, -12, -2, 0.94, 0, 0.12, '12', 'AGENTS REGISTERED', [42, 30, 22], ['STATUS', 'ROLES', 'CAPACITY']),
      motion('02 / CAPABILITY', 'OPEN THE\nSKILL GRAPH', 'Each agent exposes its skills, tools, permissions and missing prerequisites instead of behaving like an opaque chat window.', '#b68b35', '#ffe08a', 7, 82, 4, 1.05, 0.86, 0.66, '64', 'SKILLS MAPPED', [78, 62, 44], ['SKILLS', 'TOOLS', 'ACCESS']),
      motion('03 / ORCHESTRATION', 'ROUTE WORK\nBETWEEN MINDS', 'Quests move through research, build, review and operator approval while each agent keeps a visible role in the chain.', '#4f7dff', '#b9d0ff', -8, 170, -5, 1.12, 0.5, 1, '24/7', 'ORCHESTRATION', [96, 86, 74], ['QUESTS', 'HANDOFFS', 'APPROVALS']),
      motion('04 / MEMORY', 'KEEP THE\nSYSTEM COHERENT', 'Notion, Obsidian, logs and run history become one memory surface so decisions survive across agents, machines and sessions.', '#27d6a1', '#a9ffe5', 10, 260, 3, 0.99, 0.2, 0.32, '99.2%', 'CONTEXT RETAINED', [100, 95, 90], ['MEMORY', 'LOGS', 'CONTEXT']),
      motion('05 / OPERATOR', 'CONTROL THE\nENTIRE MACHINE', 'The final state is not autonomous chaos. It is an operator-led command center with explicit gates for deploys, sends, secrets and destructive actions.', '#ff4f40', '#ffd2a8', -4, 360, 0, 1.08, 0, 0.1, 'GO', 'OPERATOR CONTROL', [100, 100, 100], ['CONTROL', 'SAFETY', 'DEPLOY']),
    ],
  },
  'ai-growth-engine': {
    id: 'ai-growth-engine',
    shortLabel: 'AI GROWTH',
    productName: 'AI GROWTH ENGINE',
    stageLabel: 'GROWTH SYSTEM STAGE',
    agentReference: 'motion:scroll-pinned-product-stage@ai-growth-engine',
    ctaLabel: 'ACTIVATE THE GROWTH ENGINE',
    meterLabels: ['REACH', 'INTENT', 'GROWTH'],
    fragments: [
      { x: -1, y: -0.72, z: 46, r: -16, label: 'MARKET' },
      { x: 0.92, y: -0.64, z: 34, r: 13, label: 'CONTENT' },
      { x: -1.04, y: 0.62, z: 24, r: 10, label: 'LEADS' },
      { x: 1.02, y: 0.7, z: 52, r: -12, label: 'REVENUE' },
    ],
    sections: [
      motion('01 / MARKET', 'FIND THE\nREAL DEMAND', 'The engine maps audiences, pain, search behavior and buying triggers before campaigns or content are produced.', '#d33a34', '#ff9a5e', -12, -18, -3, 0.92, 0, 0.08, '360°', 'MARKET VIEW', [38, 24, 16], ['AUDIENCE', 'PAIN', 'DEMAND']),
      motion('02 / SIGNAL', 'TURN DATA\nINTO DIRECTION', 'Research, competitor intelligence and customer signals separate useful opportunities from generic marketing noise.', '#b58b34', '#ffe08a', 8, 74, 4, 1.04, 0.84, 0.62, '10X', 'SIGNAL DENSITY', [76, 58, 40], ['RESEARCH', 'SIGNALS', 'STRATEGY']),
      motion('03 / CONTENT', 'CREATE THE\nATTENTION LOOP', 'Agents transform strategy into campaigns, landing pages, offers and content systems while preserving one coherent market narrative.', '#8f62ff', '#d7c1ff', -7, 164, -5, 1.12, 0.48, 1, '24/7', 'CONTENT ENGINE', [96, 84, 70], ['CONTENT', 'CAMPAIGNS', 'OFFERS']),
      motion('04 / CONVERSION', 'CAPTURE AND\nQUALIFY INTENT', 'Traffic is routed into focused journeys that segment intent, collect proof and hand qualified opportunities to sales.', '#27d6a1', '#a9ffe5', 11, 258, 3, 0.98, 0.18, 0.34, '+42%', 'QUALIFIED INTENT', [100, 94, 86], ['FUNNELS', 'QUALIFY', 'HANDOFF']),
      motion('05 / COMPOUND', 'BUILD A\nCOMPOUNDING SYSTEM', 'Every campaign feeds learning back into the engine so positioning, content and acquisition improve instead of resetting each month.', '#ff4f40', '#ffd2a8', -4, 360, 0, 1.08, 0, 0.12, 'LIVE', 'GROWTH LOOP ACTIVE', [100, 100, 100], ['LEARN', 'OPTIMIZE', 'COMPOUND']),
    ],
  },
  'conversion-website-system': {
    id: 'conversion-website-system',
    shortLabel: 'WEB SYSTEM',
    productName: 'CONVERSION WEBSITE SYSTEM',
    stageLabel: 'DIGITAL PRODUCT STAGE',
    agentReference: 'motion:scroll-pinned-product-stage@conversion-website-system',
    ctaLabel: 'BUILD THE CONVERSION SYSTEM',
    meterLabels: ['CLARITY', 'TRUST', 'ACTION'],
    fragments: [
      { x: -1, y: -0.72, z: 46, r: -16, label: 'MESSAGE' },
      { x: 0.92, y: -0.64, z: 34, r: 13, label: 'DESIGN' },
      { x: -1.04, y: 0.62, z: 24, r: 10, label: 'PROOF' },
      { x: 1.02, y: 0.7, z: 52, r: -12, label: 'CTA' },
    ],
    sections: [
      motion('01 / MESSAGE', 'MAKE THE\nVALUE OBVIOUS', 'The page starts with a sharp promise, a precise audience and a visual hierarchy that removes interpretation work.', '#c93630', '#f0a15a', -12, -18, -3, 0.92, 0, 0.08, '3 SEC', 'VALUE UNDERSTOOD', [42, 28, 18], ['PROMISE', 'AUDIENCE', 'CLARITY']),
      motion('02 / EXPERIENCE', 'DESIGN THE\nDECISION PATH', 'Navigation, sections and motion guide attention through one intentional sequence instead of presenting a wall of information.', '#b68b35', '#f4d992', 8, 74, 4, 1.04, 0.84, 0.62, '05', 'DECISION STAGES', [76, 58, 40], ['FLOW', 'MOTION', 'FOCUS']),
      motion('03 / PROOF', 'TURN CLAIMS\nINTO TRUST', 'Case evidence, process transparency and real outcomes are placed at the exact moment skepticism appears.', '#8f62ff', '#d7c1ff', -7, 164, -5, 1.12, 0.48, 1, '92%', 'TRUST SIGNAL', [96, 84, 72], ['CASES', 'PROCESS', 'PROOF']),
      motion('04 / ACTION', 'REMOVE THE\nFINAL FRICTION', 'Forms, booking and qualification become one low-friction action layer with the right next step for each visitor.', '#27d6a1', '#a9ffe5', 11, 258, 3, 0.98, 0.18, 0.34, '+31%', 'CTA COMPLETION', [100, 94, 88], ['BOOKING', 'FORMS', 'QUALIFY']),
      motion('05 / SYSTEM', 'SHIP MORE\nTHAN A WEBSITE', 'The final product connects design, analytics, CRM and automation so the website behaves like a measurable sales asset.', '#ff4f40', '#ffd2a8', -4, 360, 0, 1.08, 0, 0.12, 'LIVE', 'SYSTEM DEPLOYED', [100, 100, 100], ['ANALYTICS', 'CRM', 'AUTOMATION']),
    ],
  },
  'automation-ops-system': {
    id: 'automation-ops-system',
    shortLabel: 'OPS',
    productName: 'AUTOMATION OPERATING SYSTEM',
    stageLabel: 'OPERATIONS SYSTEM STAGE',
    agentReference: 'motion:scroll-pinned-product-stage@automation-ops-system',
    ctaLabel: 'AUTOMATE THE OPERATION',
    meterLabels: ['FLOW', 'CONTROL', 'UPTIME'],
    fragments: [
      { x: -1, y: -0.72, z: 46, r: -16, label: 'TRIGGER' },
      { x: 0.92, y: -0.64, z: 34, r: 13, label: 'LOGIC' },
      { x: -1.04, y: 0.62, z: 24, r: 10, label: 'REVIEW' },
      { x: 1.02, y: 0.7, z: 52, r: -12, label: 'ACTION' },
    ],
    sections: [
      motion('01 / MAP', 'SEE THE\nREAL OPERATION', 'Before automation, the workflow is mapped across people, tools, decisions, queues and failure points.', '#c93630', '#f0a15a', -12, -18, -3, 0.92, 0, 0.08, '100%', 'FLOW MAPPED', [36, 24, 16], ['PROCESS', 'OWNERS', 'RISKS']),
      motion('02 / ORCHESTRATE', 'CONNECT THE\nSYSTEM LAYERS', 'n8n, data stores, agents and business tools become one orchestrated process with explicit inputs and outputs.', '#b68b35', '#f4d992', 8, 74, 4, 1.04, 0.84, 0.62, '18', 'SYSTEM NODES', [78, 60, 42], ['N8N', 'DATA', 'TOOLS']),
      motion('03 / CONTROL', 'KEEP HUMANS\nON THE GATES', 'High-impact actions remain behind approval, validation and audit controls instead of disappearing into invisible automation.', '#8f62ff', '#d7c1ff', -7, 164, -5, 1.12, 0.48, 1, 'GO', 'APPROVAL REQUIRED', [96, 86, 74], ['APPROVAL', 'VALIDATE', 'AUDIT']),
      motion('04 / RESILIENCE', 'BUILD FOR\nFAILURE AND RECOVERY', 'Retries, fallback routes, logs and alerts turn fragile workflows into observable operational infrastructure.', '#27d6a1', '#a9ffe5', 11, 258, 3, 0.98, 0.18, 0.34, '99.9%', 'TARGET UPTIME', [100, 95, 90], ['RETRY', 'FALLBACK', 'ALERTS']),
      motion('05 / SCALE', 'RUN THE\nOPERATION AS CODE', 'The completed system can be reused, versioned and expanded without rebuilding the business process from zero.', '#ff4f40', '#ffd2a8', -4, 360, 0, 1.08, 0, 0.12, 'LIVE', 'OPS SYSTEM READY', [100, 100, 100], ['REUSE', 'VERSION', 'SCALE']),
    ],
  },
};

const VARIANT_IDS = Object.keys(PRODUCT_STAGE_VARIANTS) as ProductStageVariantId[];

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '');
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

function mixHex(a: string, b: string, t: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return `rgb(${Math.round(lerp(ca[0], cb[0], t))}, ${Math.round(lerp(ca[1], cb[1], t))}, ${Math.round(lerp(ca[2], cb[2], t))})`;
}

const CSS = String.raw`
.pps-root { position:absolute; inset:0; overflow:hidden; container-type:size; color:#f4f0e8; background:#050506; font-family:var(--sans,system-ui,sans-serif); }
.pps-root::before { content:''; position:absolute; inset:0; z-index:0; pointer-events:none; background:radial-gradient(circle at 22% 42%,color-mix(in srgb,var(--pps-accent) 14%,transparent),transparent 28%),radial-gradient(circle at 74% 38%,color-mix(in srgb,var(--pps-accent-2) 8%,transparent),transparent 36%),linear-gradient(115deg,#0d0b0d,#070709 58%,#030304); transition:background .5s ease; }
.pps-root::after { content:''; position:absolute; inset:-25%; z-index:1; pointer-events:none; opacity:.05; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.78' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.8'/%3E%3C/svg%3E"); animation:pps-noise .25s steps(2) infinite; }
@keyframes pps-noise { 0%{transform:translate3d(-2%,-1%,0)}50%{transform:translate3d(2%,1%,0)}100%{transform:translate3d(-1%,2%,0)} }
.pps-scroll { position:absolute; inset:0; z-index:2; overflow-y:auto; overflow-x:hidden; scrollbar-width:thin; scrollbar-color:rgba(255,255,255,.16) transparent; overscroll-behavior:contain; }
.pps-scroll::-webkit-scrollbar { width:5px; }
.pps-scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,.14); border-radius:10px; }
.pps-stage { position:sticky; top:0; height:100cqh; overflow:hidden; isolation:isolate; }
.pps-stage-grid { position:absolute; inset:0; z-index:0; opacity:.3; background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px); background-size:54px 54px; mask-image:radial-gradient(circle at 38% 50%,#000 0 34%,transparent 76%); transform:perspective(700px) rotateX(62deg) translateY(42%) scale(1.6); transform-origin:center bottom; }
.pps-horizon { position:absolute; left:-10%; right:-10%; top:58%; z-index:0; height:1px; background:linear-gradient(90deg,transparent,var(--pps-accent),transparent); opacity:.22; box-shadow:0 0 32px var(--pps-accent); }
.pps-progress { position:absolute; left:18px; right:18px; top:15px; z-index:40; display:grid; grid-template-columns:auto 1fr auto; align-items:center; gap:12px; font-family:var(--mono,monospace); font-size:8px; letter-spacing:.22em; color:rgba(255,255,255,.42); }
.pps-progress-track { position:relative; height:1px; background:rgba(255,255,255,.1); overflow:hidden; }
.pps-progress-fill { position:absolute; inset:0 auto 0 0; width:calc(var(--pps-progress) * 100%); background:linear-gradient(90deg,var(--pps-accent),var(--pps-accent-2)); box-shadow:0 0 10px var(--pps-accent); }
.pps-stage-code { color:var(--pps-accent-2); }
.pps-variant-switcher { position:absolute; left:18px; right:18px; top:36px; z-index:44; display:flex; gap:5px; overflow-x:auto; scrollbar-width:none; pointer-events:auto; }
.pps-variant-switcher::-webkit-scrollbar { display:none; }
.pps-variant-switcher button { flex:0 0 auto; padding:6px 8px; border:1px solid rgba(255,255,255,.09); background:rgba(8,8,10,.66); color:rgba(255,255,255,.38); font:800 6px/1 var(--mono,monospace); letter-spacing:.14em; cursor:pointer; backdrop-filter:blur(8px); transition:.25s ease; }
.pps-variant-switcher button:hover { color:#fff; border-color:var(--pps-accent); transform:translateY(-1px); }
.pps-variant-switcher button[aria-pressed='true'] { color:#fff; border-color:var(--pps-accent-2); background:color-mix(in srgb,var(--pps-accent) 18%,rgba(8,8,10,.86)); box-shadow:0 0 13px color-mix(in srgb,var(--pps-accent) 26%,transparent); }
.pps-reference { position:absolute; left:18px; top:70px; z-index:42; display:flex; align-items:center; gap:8px; max-width:50%; padding:6px 8px; border-left:1px solid var(--pps-accent); background:rgba(7,7,9,.54); backdrop-filter:blur(8px); pointer-events:auto; }
.pps-reference code { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:rgba(255,255,255,.4); font:600 6px/1 var(--mono,monospace); letter-spacing:.06em; }
.pps-reference button { flex:0 0 auto; padding:0; border:0; background:none; color:var(--pps-accent-2); font:800 6px/1 var(--mono,monospace); letter-spacing:.12em; cursor:pointer; }
.pps-product-zone { position:absolute; left:4%; top:10%; bottom:10%; width:56%; z-index:8; display:grid; place-items:center; perspective:1200px; transform:translate3d(var(--pps-px),var(--pps-py),0); transition:transform .25s ease-out; }
.pps-aura { position:absolute; width:min(48cqw,58cqh); aspect-ratio:1; border-radius:50%; background:radial-gradient(circle,color-mix(in srgb,var(--pps-accent) 20%,transparent),transparent 58%); filter:blur(22px); opacity:calc(.34 + var(--pps-glow) * .38); transform:scale(calc(.78 + var(--pps-glow) * .3)); }
.pps-product-wrap { position:relative; width:min(31cqw,42cqh); aspect-ratio:1; transform-style:preserve-3d; }
.pps-product { position:absolute; inset:0; transform-style:preserve-3d; will-change:transform; }
.pps-shell { position:absolute; inset:var(--shell-inset); border:1px solid color-mix(in srgb,var(--pps-accent) calc(72% - var(--shell-index) * 9%),rgba(255,255,255,.08)); border-radius:calc(18px + var(--shell-index) * 5px); background:linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.008)); box-shadow:inset 0 0 26px rgba(255,255,255,.025),0 0 calc(8px + var(--pps-glow) * 24px) color-mix(in srgb,var(--pps-accent) 16%,transparent); transform:translateZ(calc((var(--shell-index) - 2) * 17px)) rotate(calc((var(--shell-index) - 2) * 8deg)) scale(calc(1 + var(--pps-explode) * var(--shell-index) * .045)); opacity:calc(1 - var(--shell-index) * .1); }
.pps-shell::before,.pps-shell::after { content:''; position:absolute; width:9px; height:9px; border-color:var(--pps-accent-2); opacity:.72; }
.pps-shell::before { top:8px; left:8px; border-top:1px solid; border-left:1px solid; }
.pps-shell::after { right:8px; bottom:8px; border-right:1px solid; border-bottom:1px solid; }
.pps-core { position:absolute; inset:27%; z-index:5; display:grid; place-items:center; border-radius:22%; transform:translateZ(58px); background:radial-gradient(circle at 35% 28%,rgba(255,255,255,.16),transparent 22%),linear-gradient(145deg,color-mix(in srgb,var(--pps-accent) 22%,#0b0a0c),#070708 70%); border:1px solid var(--pps-accent); box-shadow:0 0 calc(20px + var(--pps-glow) * 34px) color-mix(in srgb,var(--pps-accent) 48%,transparent),inset 0 0 24px color-mix(in srgb,var(--pps-accent) 12%,transparent); }
.pps-core::before { content:''; position:absolute; inset:-11px; border:1px dashed color-mix(in srgb,var(--pps-accent-2) 45%,transparent); border-radius:28%; animation:pps-spin 14s linear infinite; }
.pps-core::after { content:''; position:absolute; inset:18%; border-radius:50%; background:radial-gradient(circle,#fff 0 3%,var(--pps-accent-2) 5%,transparent 44%); filter:drop-shadow(0 0 8px var(--pps-accent)); animation:pps-pulse 2.2s ease-in-out infinite; }
.pps-core svg { width:58%; height:58%; overflow:visible; filter:drop-shadow(0 0 8px var(--pps-accent)); }
.pps-core path { stroke:var(--pps-accent-2); }
.pps-orbit { position:absolute; left:50%; top:50%; z-index:2; width:calc(112% + var(--orbit-index) * 18%); aspect-ratio:1; border:1px solid color-mix(in srgb,var(--pps-accent) calc(30% - var(--orbit-index) * 5%),transparent); border-radius:50%; transform-style:preserve-3d; transform:translate(-50%,-50%) rotateX(calc(68deg - var(--orbit-index) * 13deg)) rotateZ(calc(var(--pps-orbit) * 1deg + var(--orbit-index) * 34deg)); }
.pps-orbit::before { content:''; position:absolute; width:7px; height:7px; left:12%; top:16%; border-radius:50%; background:var(--pps-accent-2); box-shadow:0 0 12px var(--pps-accent); }
.pps-fragment { position:absolute; left:50%; top:50%; z-index:8; width:25%; height:17%; padding:7px; border:1px solid color-mix(in srgb,var(--pps-accent-2) 48%,transparent); border-radius:8px; background:rgba(8,8,10,.82); backdrop-filter:blur(8px); transform-style:preserve-3d; transform:translate(-50%,-50%) translate3d(calc(var(--pps-explode) * var(--frag-x) * 118px),calc(var(--pps-explode) * var(--frag-y) * 118px),var(--frag-z)) rotate(calc(var(--pps-explode) * var(--frag-r))); opacity:calc(.22 + var(--pps-explode) * .78); box-shadow:0 0 18px color-mix(in srgb,var(--pps-accent) 16%,transparent); }
.pps-fragment strong { display:block; font:700 6px/1 var(--mono,monospace); letter-spacing:.16em; color:var(--pps-accent-2); }
.pps-fragment span { display:block; margin-top:7px; width:calc(30% + var(--pps-progress) * 55%); height:2px; background:var(--pps-accent); box-shadow:0 0 6px var(--pps-accent); }
.pps-scan { position:absolute; top:-18%; bottom:-18%; left:50%; z-index:15; width:1px; pointer-events:none; background:linear-gradient(180deg,transparent,var(--pps-accent-2),#fff,var(--pps-accent),transparent); box-shadow:0 0 16px var(--pps-accent),0 0 44px color-mix(in srgb,var(--pps-accent) 44%,transparent); opacity:var(--pps-scan); transform:translateX(calc((var(--pps-scan-phase) - .5) * 210px)); }
.pps-scan::after { content:''; position:absolute; top:0; bottom:0; left:-50px; width:100px; background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--pps-accent) 10%,transparent),transparent); }
.pps-ground { position:absolute; left:18%; right:18%; bottom:2%; height:4%; border-radius:50%; background:var(--pps-accent); filter:blur(18px); opacity:calc(.16 + var(--pps-glow) * .16); transform:scaleX(calc(.72 + var(--pps-explode) * .38)); }
.pps-telemetry { position:absolute; left:18px; bottom:18px; z-index:20; width:132px; padding:11px; border:1px solid rgba(255,255,255,.09); background:rgba(8,8,10,.62); backdrop-filter:blur(10px); }
.pps-telemetry-head { display:flex; justify-content:space-between; gap:8px; margin-bottom:9px; font:700 7px/1 var(--mono,monospace); letter-spacing:.16em; color:rgba(255,255,255,.38); }
.pps-telemetry-head b { color:var(--pps-accent-2); }
.pps-meter { display:grid; grid-template-columns:34px 1fr; align-items:center; gap:7px; margin-top:6px; font:600 6px/1 var(--mono,monospace); letter-spacing:.08em; color:rgba(255,255,255,.32); }
.pps-meter-track { height:2px; background:rgba(255,255,255,.08); overflow:hidden; }
.pps-meter-fill { height:100%; width:var(--meter-value); background:linear-gradient(90deg,var(--pps-accent),var(--pps-accent-2)); box-shadow:0 0 7px var(--pps-accent); transition:width .45s ease; }
.pps-stat { position:absolute; left:calc(56% - 32px); top:21%; z-index:22; min-width:110px; padding:10px 12px; border-left:1px solid var(--pps-accent); background:linear-gradient(90deg,color-mix(in srgb,var(--pps-accent) 10%,rgba(5,5,6,.86)),transparent); backdrop-filter:blur(9px); }
.pps-stat strong { display:block; font-size:clamp(16px,3.5cqw,29px); line-height:.9; letter-spacing:-.05em; color:var(--pps-accent-2); text-shadow:0 0 18px color-mix(in srgb,var(--pps-accent) 55%,transparent); }
.pps-stat span { display:block; margin-top:6px; font:700 6px/1 var(--mono,monospace); letter-spacing:.18em; color:rgba(255,255,255,.38); }
.pps-copy-layer { position:relative; z-index:18; margin-top:-100cqh; }
.pps-section { height:100cqh; display:flex; align-items:center; justify-content:flex-end; padding:8% clamp(18px,5%,52px) 8% 58%; }
.pps-copy { width:min(100%,390px); opacity:.18; transform:translate3d(18px,12px,0) scale(.985); filter:blur(1.5px); transition:opacity .5s cubic-bezier(.16,1,.3,1),transform .6s cubic-bezier(.16,1,.3,1),filter .5s ease; }
.pps-copy[data-active='true'] { opacity:1; transform:none; filter:none; }
.pps-product-name { margin-bottom:9px; color:rgba(255,255,255,.3); font:700 6px/1 var(--mono,monospace); letter-spacing:.2em; }
.pps-kicker { display:flex; align-items:center; gap:9px; margin-bottom:12px; font:800 8px/1 var(--mono,monospace); letter-spacing:.3em; color:var(--pps-accent-2); }
.pps-kicker::before { content:''; width:27px; height:1px; background:currentColor; box-shadow:0 0 8px currentColor; }
.pps-title { max-width:390px; font-size:clamp(22px,5.7cqw,52px); font-weight:820; letter-spacing:-.065em; line-height:.86; text-wrap:balance; }
.pps-title-line:last-child { color:transparent; -webkit-text-stroke:1px color-mix(in srgb,var(--pps-accent-2) 78%,white); text-shadow:0 0 24px color-mix(in srgb,var(--pps-accent) 26%,transparent); }
.pps-body { max-width:340px; margin-top:16px; font-size:clamp(10px,1.8cqw,14px); line-height:1.55; color:rgba(244,240,232,.56); }
.pps-tags { display:flex; flex-wrap:wrap; gap:6px; margin-top:16px; }
.pps-tag { padding:6px 8px; border:1px solid rgba(255,255,255,.1); background:rgba(255,255,255,.025); font:700 6px/1 var(--mono,monospace); letter-spacing:.15em; color:rgba(255,255,255,.52); }
.pps-cta { display:inline-flex; align-items:center; gap:9px; margin-top:16px; padding:9px 11px; border:1px solid var(--pps-accent-2); background:color-mix(in srgb,var(--pps-accent) 14%,rgba(7,7,9,.86)); color:#fff; font:800 7px/1 var(--mono,monospace); letter-spacing:.13em; box-shadow:0 0 16px color-mix(in srgb,var(--pps-accent) 20%,transparent); }
.pps-cta::after { content:'↗'; color:var(--pps-accent-2); }
.pps-nav { position:absolute; right:18px; bottom:18px; z-index:42; display:flex; align-items:center; gap:5px; pointer-events:auto; }
.pps-nav button { position:relative; width:25px; height:25px; padding:0; border:1px solid rgba(255,255,255,.1); border-radius:50%; background:rgba(8,8,10,.7); color:rgba(255,255,255,.36); font:700 6px/1 var(--mono,monospace); cursor:pointer; transition:border-color .25s ease,color .25s ease,transform .25s ease,background .25s ease; }
.pps-nav button:hover { transform:translateY(-2px); border-color:var(--pps-accent); color:#fff; }
.pps-nav button[aria-current='step'] { border-color:var(--pps-accent-2); color:#fff; background:color-mix(in srgb,var(--pps-accent) 18%,rgba(8,8,10,.86)); box-shadow:0 0 14px color-mix(in srgb,var(--pps-accent) 32%,transparent); }
.pps-scroll-hint { position:absolute; right:20px; top:50%; z-index:21; writing-mode:vertical-rl; font:700 6px/1 var(--mono,monospace); letter-spacing:.24em; color:rgba(255,255,255,.26); }
.pps-scroll-hint::after { content:''; display:inline-block; width:1px; height:40px; margin-top:10px; background:linear-gradient(var(--pps-accent),transparent); animation:pps-hint 1.8s ease-in-out infinite; }
@keyframes pps-hint { 0%,100%{transform:scaleY(.3);transform-origin:top;opacity:.3}50%{transform:scaleY(1);opacity:1} }
@keyframes pps-spin { to{transform:rotate(360deg)} }
@keyframes pps-pulse { 50%{transform:scale(1.18);opacity:.72} }
@media (prefers-reduced-motion:reduce) { .pps-root::after,.pps-core::before,.pps-core::after,.pps-scroll-hint::after { animation:none!important; } .pps-copy { transition:none; filter:none; } }
@container (max-width:700px) {
  .pps-progress { left:12px; right:12px; }
  .pps-variant-switcher { left:12px; right:12px; top:35px; }
  .pps-reference { left:12px; top:68px; max-width:72%; }
  .pps-reference code { max-width:130px; }
  .pps-product-zone { left:0; top:4%; bottom:auto; width:100%; height:57%; }
  .pps-product-wrap { width:min(58cqw,34cqh); }
  .pps-stat { left:auto; right:13px; top:18%; min-width:92px; }
  .pps-telemetry { left:12px; bottom:auto; top:18%; width:108px; padding:8px; }
  .pps-section { align-items:flex-end; justify-content:flex-start; padding:57% 17px 52px; }
  .pps-copy { width:100%; padding:13px; border:1px solid rgba(255,255,255,.08); background:linear-gradient(135deg,rgba(7,7,9,.92),rgba(7,7,9,.7)); backdrop-filter:blur(12px); }
  .pps-title { font-size:clamp(22px,8cqw,38px); }
  .pps-body { margin-top:10px; font-size:10px; }
  .pps-tags,.pps-cta { margin-top:10px; }
  .pps-nav { right:12px; bottom:12px; }
  .pps-scroll-hint { display:none; }
}
@container (max-height:430px) {
  .pps-product-zone { top:3%; bottom:3%; }
  .pps-telemetry,.pps-reference { display:none; }
  .pps-stat { top:18%; }
  .pps-body { max-width:310px; font-size:9px; }
  .pps-tags,.pps-cta { margin-top:8px; }
}

/* ── page mode ────────────────────────────────────────────────────────────
   The stage keeps its own 100svh box (so every container query and cq unit
   below stays valid) but that box is pinned inside a tall track in the page
   flow. The page scroll drives the story; nothing traps the wheel. The copy
   becomes an overlay of the active chapter instead of a tall section stack. */
.pps-track { position:relative; width:100%; }
.pps-sticky { position:sticky; top:0; height:100svh; }
.pps-page { background:transparent; }
.pps-page::before { background:radial-gradient(circle at 22% 42%,color-mix(in srgb,var(--pps-accent) 15%,transparent),transparent 34%),radial-gradient(circle at 74% 38%,color-mix(in srgb,var(--pps-accent-2) 9%,transparent),transparent 42%); }
.pps-page::after { display:none; }
.pps-page .pps-scroll { position:absolute; inset:0; overflow:hidden; overscroll-behavior:auto; }
.pps-page .pps-stage { position:absolute; left:50%; top:0; width:min(100%,1360px); height:100%; transform:translateX(-50%); }
.pps-copy-overlay { position:absolute; inset:0; z-index:18; pointer-events:none; }
.pps-copy-overlay .pps-section { position:absolute; inset:0; height:100%; }
.pps-copy-overlay .pps-copy[data-active='false'] { opacity:0; pointer-events:none; }
/* Der innere Schacht trägt im internen Modus die lange Kapitelspalte; im
   Page-Modus muss er die gepinnte Bühne ausfüllen, sonst kollabiert er auf 0. */
.pps-shaft { position:relative; }
.pps-page .pps-shaft { position:absolute; inset:0; }

/* ── minimal chrome: no Arsenal affordances on a product website ── */
.pps-minimal .pps-reference,
.pps-minimal .pps-scroll-hint,
.pps-minimal .pps-telemetry,
.pps-minimal .pps-stat { display:none; }
/* Ohne Arsenal-Chrome sitzt die Fortschrittszeile unten — oben kollidiert sie
   auf echten Seiten mit dem Website-Header. */
.pps-minimal .pps-progress { top:auto; bottom:20px; left:5%; right:20%; }
.pps-nohud .pps-progress,.pps-nohud .pps-reference,.pps-nohud .pps-telemetry,.pps-nohud .pps-stat,.pps-nohud .pps-scroll-hint,.pps-nohud .pps-nav { display:none; }
.pps-root:has(.nfco-scene) .pps-product-zone { left:2%; width:58%; }
.pps-root:has(.nfco-scene) .pps-product-wrap { width:calc(min(38cqw,52cqh) * var(--pps-object-scale,1)); }
.pps-root:has(.nfco-scene) .pps-shell,.pps-root:has(.nfco-scene) .pps-orbit,.pps-root:has(.nfco-scene) .pps-fragment,.pps-root:has(.nfco-scene) .pps-core,.pps-root:has(.nfco-scene) .pps-scan { display:none; }

/* ── signal-flow visual mode: the module set re-assembles per chapter ── */
.pps-flow .pps-fragment { transition:transform .7s cubic-bezier(.16,1,.3,1),opacity .5s ease,border-color .5s ease; }
.pps-flow .pps-fragment strong { transition:color .5s ease; }
.pps-flow .pps-shell { opacity:calc(.72 - var(--shell-index) * .12); }
.pps-flow .pps-orbit { opacity:.5; }
@media (prefers-reduced-motion:reduce) { .pps-flow .pps-fragment { transition:none; } }

/* ── configurable presentation layer ──────────────────────────────────────
   Alles darunter hängt an CSS-Variablen, die die Controls setzen. Fehlt eine
   Variable, greift der historische Wert — bestehende Einbindungen ändern sich
   dadurch nicht. */
.pps-product-zone { perspective:calc(var(--pps-perspective,1200) * 1px); }
.pps-product-wrap { width:calc(min(31cqw,42cqh) * var(--pps-object-scale,1)); }
.pps-shell {
  transform:
    translateZ(calc((var(--shell-index) - 2) * 17px * var(--pps-object-depth,1)))
    rotate(calc((var(--shell-index) - 2) * 8deg))
    scale(calc(1 + var(--pps-explode) * var(--shell-index) * .045));
  border-color:color-mix(in srgb,var(--pps-accent) calc((72% - var(--shell-index) * 9%) * var(--pps-rim,1)),rgba(255,255,255,.08));
  background:linear-gradient(145deg,rgba(255,255,255,calc(.045 * var(--pps-glass,1))),rgba(255,255,255,calc(.008 * var(--pps-glass,1))));
  box-shadow:
    inset 0 0 26px rgba(255,255,255,calc(.025 * var(--pps-highlight,1))),
    0 0 calc((8px + var(--pps-glow) * 24px) * var(--pps-bloom-scale,1)) color-mix(in srgb,var(--pps-accent) calc(16% * var(--pps-bloom-scale,1)),transparent);
}
.pps-aura {
  filter:blur(calc(22px * var(--pps-blur,1)));
  opacity:calc((.34 + var(--pps-glow) * .38) * var(--pps-bloom-scale,1));
}
.pps-ground { opacity:calc((.16 + var(--pps-glow) * .16) * var(--pps-shadow,1)); }
.pps-stage-grid { opacity:calc(.3 * var(--pps-grid,1)); }
.pps-root::before { opacity:var(--pps-bg,1); }
.pps-fragment {
  width:calc(25% * var(--pps-symbol,1));
  height:calc(17% * var(--pps-symbol,1));
  background:rgba(8,8,10,calc(.82 * var(--pps-glass,1)));
  transform:
    translate(-50%,-50%)
    translate3d(
      calc(var(--pps-explode) * var(--frag-x) * 118px * var(--pps-spread,1)),
      calc(var(--pps-explode) * var(--frag-y) * 118px * var(--pps-spread,1)),
      calc(var(--frag-z) * var(--pps-object-depth,1)))
    rotate(calc(var(--pps-explode) * var(--frag-r)));
}
.pps-copy { transition-duration:calc(var(--pps-stage-transition,.5) * 1s),calc(var(--pps-stage-transition,.5) * 1.2s),calc(var(--pps-stage-transition,.5) * 1s); }
/* Atmosphäre und Vignette liegen über der Bühne, aber unter der Textspalte. */
.pps-atmosphere { position:absolute; inset:0; z-index:16; pointer-events:none; background:radial-gradient(58% 52% at 32% 50%,color-mix(in srgb,var(--pps-accent) 26%,transparent),transparent 68%); opacity:var(--pps-atmo,0); mix-blend-mode:screen; }
.pps-vignette { position:absolute; inset:0; z-index:17; pointer-events:none; background:radial-gradient(120% 100% at 50% 50%,transparent 48%,rgba(2,2,4,.9) 100%); opacity:var(--pps-vignette,0); }
/* Ambient-Partikel: reine DOM-Punkte mit CSS-Drift, kein zweiter Canvas. */
.pps-ambient { position:absolute; inset:0; z-index:3; pointer-events:none; overflow:hidden; }
.pps-mote { position:absolute; width:2px; height:2px; border-radius:50%; background:color-mix(in srgb,var(--pps-accent-2) 70%,white); opacity:.16; animation:pps-mote-drift linear infinite; }
@keyframes pps-mote-drift { from { transform:translate3d(0,14px,0); opacity:0; } 12% { opacity:.22; } 88% { opacity:.18; } to { transform:translate3d(6px,-26px,0); opacity:0; } }
@media (prefers-reduced-motion:reduce) { .pps-mote { animation:none; opacity:.14; } }
.pps-quality-low .pps-mote,
.pps-quality-low .pps-atmosphere { display:none; }
.pps-quality-low .pps-aura { filter:blur(calc(14px * var(--pps-blur,1))); }
.pps-nolabels .pps-fragment strong,
.pps-nolabels .pps-tags { display:none; }
@container (max-width:700px) {
  .pps-root:has(.nfco-scene) .pps-product-zone { left:0; width:100%; }
  .pps-root:has(.nfco-scene) .pps-product-wrap { width:calc(min(74cqw,42cqh) * var(--pps-object-scale,1)); }
}
`;

export function PinnedProductStage({
  variant = 'nox-global-sales-os',
  showVariantSwitcher = true,
  damping = 8,
  rotatePerSection = 90,
  scalePulse = 0.18,
  colorShift = true,
  seed = 11,
  scrollDriver = 'internal',
  compactScroll = 0.78,
  visualMode = 'shells',
  chrome = 'demo',
  stage: fixedStage = -1,
  autoProgress = false,
  autoProgressSpeed = 2.4,
  pageScrollMode = false,
  previewScrollSimulation = false,
  showStepNavigation = true,
  showLabels = true,
  scrollLength = 0,
  scrollSmoothing = 0.18,
  stageSnapStrength = 0,
  stageTransitionDuration = 0.5,
  scrollRotationEnabled = true,
  rotationAxis = 'y',
  rotationTurns = 0.85,
  rotationDirection = 'clockwise',
  baseRotationX = 0,
  baseRotationY = 0,
  baseRotationZ = 0,
  stageRotationInfluence = 0.35,
  rotationSmoothing = 0.12,
  objectScale = 1,
  objectDepth = 1,
  perspective = 1100,
  cameraDistance = 0,
  objectTilt = 6,
  objectFloat = 0,
  objectFloatSpeed = 0.5,
  glow = 0.6,
  bloom = 0.35,
  rimLight = 1,
  highlightIntensity = 1,
  shadowIntensity = 1,
  glassOpacity = 1,
  blurStrength = 1,
  backgroundIntensity = 1,
  gridOpacity = 1,
  ambientParticles = 0,
  vignette = 0,
  atmosphericGlow = 0,
  stageVisualIntensity = 1,
  stageMorphStrength = 1,
  stageColorShift = 1,
  stageObjectSpread = 1,
  stageSymbolScale = 1,
  mobileRotationTurns = 0.25,
  mobileObjectScale = 1,
  mobileEffectsQuality = 'medium',
  disableRotationOnMobile = false,
  reducedMotionRotation = 'static',
  cardStyle = 'glass',
  stageCardVariant = 'auto',
  cardScale,
  cardTilt,
  cardFloat,
  cardFloatSpeed,
  scrollRotationTurns,
  morphStrength,
  stageSpread,
  depth,
  showHud = true,
}: PinnedProductStageProps) {
  const reduced = usePrefersReducedMotion();
  const requestedPageDriven = scrollDriver === 'page' || pageScrollMode;
  const pageDriven = requestedPageDriven && !previewScrollSimulation;
  const rootRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(!pageDriven);
  const [isNarrow, setIsNarrow] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const productRef = useRef<HTMLDivElement>(null);
  const smooth = useRef(reduced ? 1 : 0);
  /** Aktuell gerenderte Rotation — eigene Trägheit, damit `rotationSmoothing` wirkt. */
  const rot = useRef({ x: 0, y: 0, z: 0 });
  const [selectedVariant, setSelectedVariant] = useState<ProductStageVariantId>(variant);
  const [active, setActive] = useState(reduced ? 4 : 0);
  const [copiedRef, setCopiedRef] = useState(false);
  const resolvedScale = cardScale ?? objectScale;
  const resolvedTilt = cardTilt ?? objectTilt;
  const resolvedFloat = cardFloat ?? objectFloat;
  const resolvedFloatSpeed = cardFloatSpeed ?? objectFloatSpeed;
  const resolvedTurns = scrollRotationTurns ?? rotationTurns;
  const resolvedMorph = morphStrength ?? stageMorphStrength;
  const resolvedSpread = stageSpread ?? stageObjectSpread;
  const resolvedDepth = depth ?? objectDepth;

  useEffect(() => {
    setSelectedVariant(variant);
  }, [variant]);

  // Page mode only: never burn frames while the stage is off screen.
  useEffect(() => {
    if (!pageDriven) return;
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: '10% 0px' },
    );
    io.observe(root);
    return () => io.disconnect();
  }, [pageDriven]);

  // Mobile-Overrides greifen an der eigenen Boxbreite, nicht am Viewport —
  // die Bühne läuft im Arsenal in einer Vorschaubox.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof ResizeObserver === 'undefined') {
      setIsNarrow(typeof window !== 'undefined' && window.innerWidth < 700);
      return;
    }
    const ro = new ResizeObserver(([entry]) => setIsNarrow(entry.contentRect.width < 700));
    ro.observe(root);
    return () => ro.disconnect();
  }, []);

  const config = PRODUCT_STAGE_VARIANTS[selectedVariant];
  const sections = config.sections;
  const n = sections.length;
  const variantIndex = VARIANT_IDS.indexOf(selectedVariant);
  const glyph = useMemo(() => glyphPath((seed + variantIndex * 17) * 13 + 3, 120), [seed, variantIndex]);

  const applyVariant = (nextVariant: ProductStageVariantId) => {
    setSelectedVariant(nextVariant);
    setCopiedRef(false);
    setActive(reduced ? 4 : 0);
    smooth.current = reduced ? 1 : 0;
    const scroller = scrollerRef.current;
    if (scroller) {
      scroller.scrollTo({ top: reduced ? scroller.scrollHeight : 0, behavior: 'auto' });
    }
  };

  useRafLoop(
    (dt, elapsed) => {
      const scroller = scrollerRef.current;
      const stage = stageRef.current;
      const product = productRef.current;
      if (!scroller || !stage || !product) return;

      // Fortschrittsquelle: feste Stufe > Auto-Lauf > echter Scroll.
      let raw: number;
      if (fixedStage >= 0) {
        raw = n > 1 ? clamp(fixedStage, 0, n - 1) / (n - 1) : 0;
      } else if (autoProgress) {
        const cycle = Math.max(0.2, autoProgressSpeed) * n;
        raw = (elapsed % cycle) / cycle;
      } else if (pageDriven) {
        // Page mode reads the document scroll against the stage's own travel,
        // so the section behaves like any other pinned block on the page.
        const rect = scroller.getBoundingClientRect();
        const travel = rect.height - window.innerHeight;
        raw = travel <= 0 ? 0 : clamp(-rect.top / travel, 0, 1);
      } else {
        raw = scroller.scrollTop / Math.max(1, scroller.scrollHeight - scroller.clientHeight);
      }

      // Snap zieht den Fortschritt zur nächsten Kapitelmitte, ohne den Scroll
      // zu übernehmen — der Nutzer bleibt Herr über die Position.
      if (stageSnapStrength > 0 && n > 1) {
        const nearestStop = Math.round(raw * (n - 1)) / (n - 1);
        raw = lerp(raw, nearestStop, clamp(stageSnapStrength, 0, 1));
      }

      // `scrollSmoothing` ist der lesbare Regler; `damping` bleibt als
      // historischer Prop erhalten und setzt die Basis-Trägheit.
      const lambda = Math.max(0.6, damping * (1 - clamp(scrollSmoothing, 0, 0.95)));
      smooth.current = damp(smooth.current, raw, lambda, dt);
      const progress = clamp(smooth.current, 0, 1);
      const timeline = progress * (n - 1);
      const sectionIndex = clamp(Math.floor(timeline), 0, n - 2);
      const local = smoothstep(0, 1, timeline - sectionIndex);
      const a = sections[sectionIndex];
      const b = sections[sectionIndex + 1];

      const morph = clamp(stageMorphStrength, 0, 2);
      const authoredRotX = lerp(a.rotX, b.rotX, local) * morph;
      const authoredRotY = lerp(a.rotY, b.rotY, local) * morph;
      const authoredRotZ = lerp(a.rotZ, b.rotZ, local) * morph;

      // Scroll-gekoppelte Eigendrehung. Bewusst kein zeitbasierter Endlos-
      // Spin: der Winkel ist eine reine Funktion des Fortschritts, damit
      // Rückwärtsscrollen die Drehung exakt zurücknimmt.
      const turns = isNarrow
        ? (disableRotationOnMobile ? 0 : mobileRotationTurns)
        : resolvedTurns;
      const sign = rotationDirection === 'counter-clockwise' ? -1 : 1;
      const spin = scrollRotationEnabled ? progress * turns * 360 * sign : 0;
      const axisX = rotationAxis === 'x' ? 1 : rotationAxis === 'xy' ? 0.45 : rotationAxis === 'xyz' ? 0.35 : 0;
      const axisY = rotationAxis === 'y' || rotationAxis === 'xy' || rotationAxis === 'xyz' ? 1 : 0;
      const axisZ = rotationAxis === 'z' ? 1 : rotationAxis === 'xyz' ? 0.22 : 0;
      const influence = clamp(stageRotationInfluence, 0, 1);
      // Legacy: `rotatePerSection` bleibt als zusätzlicher Y-Drift wirksam.
      const legacyDrift = timeline * (rotatePerSection - 90) * 0.22;

      const targetX = baseRotationX + spin * axisX + authoredRotX * influence;
      const targetY = baseRotationY + spin * axisY + authoredRotY * influence + legacyDrift;
      const targetZ = baseRotationZ + spin * axisZ + authoredRotZ * influence;

      // Eigene, weichere Nachführung für die Rotation (0 = hart am Scroll).
      const rotLambda = Math.max(0.8, 26 * (1 - clamp(rotationSmoothing, 0, 0.95)));
      rot.current.x = damp(rot.current.x, targetX, rotLambda, dt);
      rot.current.y = damp(rot.current.y, targetY, rotLambda, dt);
      rot.current.z = damp(rot.current.z, targetZ, rotLambda, dt);

      const baseScale = lerp(a.scale, b.scale, local) * (1 + Math.sin(timeline * Math.PI) * scalePulse * 0.22);
      const scale = baseScale * (isNarrow ? mobileObjectScale : 1);
      const explode = lerp(a.explode, b.explode, local) * clamp(stageVisualIntensity, 0, 2);
      const scan = lerp(a.scan, b.scan, local) * clamp(stageVisualIntensity, 0, 2);
      const shift = clamp(stageColorShift, 0, 1);
      const accent = colorShift ? mixHex(sections[0].accent, mixHex(a.accent, b.accent, local), shift) : sections[0].accent;
      const accent2 = colorShift ? mixHex(sections[0].accent2, mixHex(a.accent2, b.accent2, local), shift) : sections[0].accent2;
      const scanPhase = (progress * 3.4) % 1;
      const float = resolvedFloat > 0
        ? Math.sin(elapsed * Math.PI * 2 * Math.max(0.02, resolvedFloatSpeed)) * resolvedFloat
        : 0;

      product.style.transform =
        `translate3d(0,${float.toFixed(2)}px,${(-cameraDistance).toFixed(1)}px) ` +
        `rotateX(${(rot.current.x + resolvedTilt).toFixed(2)}deg) ` +
        `rotateY(${rot.current.y.toFixed(2)}deg) ` +
        `rotateZ(${rot.current.z.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      stage.style.setProperty('--pps-progress', progress.toFixed(4));
      stage.style.setProperty('--pps-accent', accent);
      stage.style.setProperty('--pps-accent-2', accent2);
      stage.style.setProperty('--pps-glow', ((0.42 + Math.sin(timeline * Math.PI) * 0.46) * (0.4 + glow)).toFixed(3));
      stage.style.setProperty('--pps-explode', explode.toFixed(3));
      stage.style.setProperty('--pps-scan', scan.toFixed(3));
      stage.style.setProperty('--pps-scan-phase', scanPhase.toFixed(3));
      stage.style.setProperty('--pps-orbit', (progress * 390).toFixed(2));

      const nearest = clamp(Math.round(timeline), 0, n - 1);
      setActive((previous) => (previous === nearest ? previous : nearest));
    },
    !reduced && inView,
  );

  // Reduced motion: kein Loop, aber ein definierter Endzustand je Modus.
  useEffect(() => {
    if (!reduced) return;
    const product = productRef.current;
    if (!product) return;
    const last = sections[n - 1];
    const stageTerm = reducedMotionRotation === 'stage-only' ? clamp(stageRotationInfluence, 0, 1) : 0;
    product.style.transform =
      `rotateX(${(baseRotationX + last.rotX * stageTerm + resolvedTilt).toFixed(2)}deg) ` +
      `rotateY(${(baseRotationY + last.rotY * stageTerm).toFixed(2)}deg) ` +
      `rotateZ(${(baseRotationZ + last.rotZ * stageTerm).toFixed(2)}deg) scale(${last.scale})`;
  }, [reduced, reducedMotionRotation, baseRotationX, baseRotationY, baseRotationZ, resolvedTilt, stageRotationInfluence, sections, n]);

  const goToSection = (index: number) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    if (pageDriven) {
      const rect = scroller.getBoundingClientRect();
      const travel = Math.max(0, rect.height - window.innerHeight);
      const top = window.scrollY + rect.top + (index / (n - 1)) * travel;
      window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
      if (reduced) setActive(index);
      return;
    }
    const max = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
    scroller.scrollTo({ top: (index / (n - 1)) * max, behavior: reduced ? 'auto' : 'smooth' });
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage || reduced) return;
    const rect = root.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2;
    const y = ((event.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2;
    stage.style.setProperty('--pps-px', `${(x * 10).toFixed(2)}px`);
    stage.style.setProperty('--pps-py', `${(y * 7).toFixed(2)}px`);
  };

  const copyReference = () => {
    navigator.clipboard?.writeText(config.agentReference).then(() => {
      setCopiedRef(true);
      window.setTimeout(() => setCopiedRef(false), 1400);
    });
  };

  const final = sections[n - 1];
  const initial = sections[0];
  const stageVars: CssVars = {
    '--pps-progress': reduced ? 1 : 0,
    '--pps-accent': reduced ? final.accent : initial.accent,
    '--pps-accent-2': reduced ? final.accent2 : initial.accent2,
    '--pps-glow': reduced ? 0.75 : 0.42,
    '--pps-explode': reduced ? final.explode : initial.explode,
    '--pps-scan': reduced ? 0 : initial.scan,
    '--pps-scan-phase': 0.5,
    '--pps-orbit': reduced ? 360 : 0,
    '--pps-px': '0px',
    '--pps-py': '0px',
    // Konfigurierbare Präsentationsschicht — siehe CSS-Block unten.
    '--pps-perspective': perspective,
    '--pps-object-scale': isNarrow ? resolvedScale * mobileObjectScale : resolvedScale,
    '--pps-object-depth': resolvedDepth,
    '--pps-bloom-scale': 0.6 + bloom,
    '--pps-rim': rimLight,
    '--pps-highlight': highlightIntensity,
    '--pps-shadow': shadowIntensity,
    '--pps-glass': glassOpacity,
    '--pps-blur': blurStrength,
    '--pps-bg': backgroundIntensity,
    '--pps-grid': gridOpacity,
    '--pps-vignette': vignette,
    '--pps-atmo': atmosphericGlow,
    '--pps-spread': resolvedSpread,
    '--pps-symbol': stageSymbolScale,
    '--pps-stage-transition': stageTransitionDuration,
  };

  // Ambient-Motes deterministisch aus dem Seed — gleicher Seed, gleiches Bild.
  const motes = useMemo(() => {
    const count = Math.round(clamp(ambientParticles, 0, 60));
    if (!count) return [];
    const rnd = seededRandom(seed * 977 + 41);
    return Array.from({ length: count }, () => ({
      left: `${(rnd() * 100).toFixed(2)}%`,
      top: `${(rnd() * 100).toFixed(2)}%`,
      duration: `${(7 + rnd() * 11).toFixed(2)}s`,
      delay: `${(-rnd() * 12).toFixed(2)}s`,
      scale: 0.6 + rnd() * 1.6,
    }));
  }, [ambientParticles, seed]);

  const productTransform = reduced
    ? `rotateX(${final.rotX}deg) rotateY(${final.rotY}deg) rotateZ(${final.rotZ}deg) scale(${final.scale})`
    : `rotateX(${initial.rotX}deg) rotateY(${initial.rotY}deg) rotateZ(${initial.rotZ}deg) scale(${initial.scale})`;

  const stageBody = (
    <div
      ref={rootRef}
      className={[
        'pps-root',
        pageDriven ? 'pps-page' : '',
        visualMode === 'signal-flow' ? 'pps-flow' : '',
        chrome === 'minimal' ? 'pps-minimal' : '',
        showLabels ? '' : 'pps-nolabels',
        showHud ? '' : 'pps-nohud',
        isNarrow && mobileEffectsQuality === 'low' ? 'pps-quality-low' : '',
      ].filter(Boolean).join(' ')}
      onPointerMove={handlePointerMove}
      style={stageVars}
    >
      <style>{CSS}</style>
      <div
        ref={pageDriven ? undefined : scrollerRef}
        className="pps-scroll"
        aria-label={`${config.productName} product story`}
      >
        <div className="pps-shaft">
          <div ref={stageRef} className="pps-stage" style={stageVars}>
            <div className="pps-stage-grid" />
            <div className="pps-horizon" />
            {motes.length > 0 && (
              <div className="pps-ambient" aria-hidden="true">
                {motes.map((mote, index) => (
                  <span
                    key={index}
                    className="pps-mote"
                    style={{
                      left: mote.left,
                      top: mote.top,
                      animationDuration: mote.duration,
                      animationDelay: mote.delay,
                      scale: String(mote.scale),
                    }}
                  />
                ))}
              </div>
            )}
            {atmosphericGlow > 0 && <div className="pps-atmosphere" aria-hidden="true" />}
            {vignette > 0 && <div className="pps-vignette" aria-hidden="true" />}

            <div className="pps-progress" aria-hidden="true">
              <span>{config.stageLabel}</span>
              <div className="pps-progress-track"><div className="pps-progress-fill" /></div>
              <span className="pps-stage-code">{String(active + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}</span>
            </div>

            {showVariantSwitcher && (
              <nav className="pps-variant-switcher" aria-label="Product stage variants">
                {VARIANT_IDS.map((id) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={selectedVariant === id}
                    onClick={() => applyVariant(id)}
                  >
                    {PRODUCT_STAGE_VARIANTS[id].shortLabel}
                  </button>
                ))}
              </nav>
            )}

            <div className="pps-reference">
              <code>{config.agentReference}</code>
              <button type="button" onClick={copyReference}>{copiedRef ? 'COPIED' : 'COPY REF'}</button>
            </div>

            <div className="pps-product-zone" aria-hidden="true">
              <div className="pps-aura" />
              <div className="pps-product-wrap">
                <div ref={productRef} className="pps-product" style={{ transform: productTransform }}>
                  {selectedVariant === 'nox-floating-card-os' ? (
                    <NoxFloatingCardOS
                      stageIndex={active}
                      cardStyle={cardStyle}
                      stageCardVariant={stageCardVariant}
                      morphStrength={resolvedMorph}
                      stageSpread={resolvedSpread}
                      glow={glow}
                      bloom={bloom}
                      depth={resolvedDepth}
                    />
                  ) : <>{[0, 1, 2, 3, 4].map((index) => (
                    <div
                      key={index}
                      className="pps-shell"
                      style={{
                        '--shell-index': index,
                        '--shell-inset': `${index * 5}%`,
                      } as CssVars}
                    />
                  ))}

                  {[0, 1, 2].map((index) => (
                    <div key={index} className="pps-orbit" style={{ '--orbit-index': index } as CssVars} />
                  ))}

                  {(sections[active].frags ?? config.fragments).map((fragment, fragIndex) => (
                    <div
                      key={fragIndex}
                      className="pps-fragment"
                      style={{
                        '--frag-x': fragment.x,
                        '--frag-y': fragment.y,
                        '--frag-z': `${fragment.z}px`,
                        '--frag-r': `${fragment.r}deg`,
                      } as CssVars}
                    >
                      <strong>{fragment.label}</strong>
                      <span />
                    </div>
                  ))}

                  <div className="pps-core">
                    <svg viewBox="0 0 120 120">
                      <path d={glyph} fill="none" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div className="pps-scan" /></>}
                </div>
                <div className="pps-ground" />
              </div>
            </div>

            <div className="pps-telemetry" aria-live="polite">
              <div className="pps-telemetry-head"><span>LIVE TELEMETRY</span><b>●</b></div>
              {config.meterLabels.map((label, index) => (
                <div className="pps-meter" key={label}>
                  <span>{label}</span>
                  <div className="pps-meter-track">
                    <div className="pps-meter-fill" style={{ '--meter-value': `${sections[active].telemetry[index]}%` } as CssVars} />
                  </div>
                </div>
              ))}
            </div>

            <div className="pps-stat" aria-live="polite">
              <strong>{sections[active].stat}</strong>
              <span>{sections[active].statLabel}</span>
            </div>

            <div className="pps-scroll-hint">SCROLL TO OPERATE</div>

            {showStepNavigation && (
            <nav className="pps-nav" aria-label="Product story chapters">
              {sections.map((section, index) => (
                <button
                  key={section.kicker}
                  type="button"
                  aria-label={`Open chapter ${index + 1}: ${section.title.replace('\n', ' ')}`}
                  aria-current={active === index ? 'step' : undefined}
                  onClick={() => goToSection(index)}
                >
                  {index + 1}
                </button>
              ))}
            </nav>
            )}
          </div>

          <div className={pageDriven ? 'pps-copy-overlay' : 'pps-copy-layer'}>
            {sections.map((section, index) => (
              <section key={section.kicker} className="pps-section" aria-label={section.title.replace('\n', ' ')}>
                <div className="pps-copy" data-active={reduced ? 'true' : String(index === active)}>
                  <div className="pps-product-name">{config.productName}</div>
                  <div className="pps-kicker">{section.kicker}</div>
                  <div className="pps-title">
                    {section.title.split('\n').map((line) => <div className="pps-title-line" key={line}>{line}</div>)}
                  </div>
                  <div className="pps-body">{section.body}</div>
                  <div className="pps-tags">
                    {section.tags.map((tag) => <span className="pps-tag" key={tag}>{tag}</span>)}
                  </div>
                  {index === n - 1 && <div className="pps-cta">{config.ctaLabel}</div>}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (!pageDriven) return stageBody;

  // Page mode: a tall track in the document flow with the stage pinned inside.
  // Total height stays at `chapters × compactScroll` viewport heights.
  return (
    <div
      ref={scrollerRef}
      className="pps-track"
      // `scrollLength` gibt die Gesamtlänge direkt vor und schlägt damit die
      // Kapitelhöhe aus `compactScroll`.
      style={{ height: `calc(${(scrollLength > 0 ? scrollLength : n * compactScroll).toFixed(3)} * 100svh)` }}
    >
      <div className="pps-sticky">{stageBody}</div>
    </div>
  );
}

export default PinnedProductStage;
