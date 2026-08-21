import type {
  CoreCanonEntry,
  EffectNichePreset,
  NicheId,
} from '../types';
import { GENERATED_CORE_PRESETS } from './generatedCorePresets';

// ---------------------------------------------------------------------------
// The product definition of the 32 canonical cores.
//
// Everything in here is bound to something the runtime can honour: `modeControl`
// names a real select prop, every module key is a real prop, and every preset /
// profile override carries only keys that exist on the core. The contract test
// `scripts/test-core-canon-contract.mjs` re-derives all of that from the catalog
// and fails the build if a mode, module or preset ever advertises a capability
// the component does not have.
//
// Niche presets come from two places:
//   - GENERATED_CORE_PRESETS — mirrored out of the component preset records for
//     the seven cores that curate niches internally (source of truth).
//   - AUTHORED_PRESETS below — curated here for cores without such a record.
// Only niches that genuinely fit a core get a preset; an empty slot is a better
// answer than a bad one.
// ---------------------------------------------------------------------------

export const NICHE_IDS: NicheId[] = [
  'restaurant', 'beauty', 'fitness', 'local-service', 'real-estate', 'automotive',
  'healthcare', 'finance', 'saas', 'ecommerce', 'luxury', 'creator',
];

export const NICHE_LABELS: Record<NicheId, string> = {
  restaurant: 'Restaurant / Hospitality',
  beauty: 'Beauty / Wellness',
  fitness: 'Fitness / Sport',
  'local-service': 'Local Service',
  'real-estate': 'Real Estate',
  automotive: 'Automotive',
  healthcare: 'Healthcare',
  finance: 'Finance',
  saas: 'SaaS / Tech',
  ecommerce: 'E-Commerce',
  luxury: 'Luxury / Premium',
  creator: 'Creator / Personal Brand',
};

interface AuthoredPreset {
  niche: NicheId;
  why: string;
  props: Record<string, number | string | boolean>;
  performanceProfile?: 'lite' | 'balanced' | 'cinematic';
  mobileProfile?: 'compact' | 'balanced' | 'full';
}

const AUTHORED_PRESETS: Record<string, AuthoredPreset[]> = {
  'bg-nox-interactive-glyph-field': [
    { niche: 'fitness', why: 'Ember runes at high charge read as forge energy behind a training hero.', props: { mode: 'glyphs', variant: 'forge-ember-runes', stateMode: 'overdrive', interaction: 'pointer-attract', glyphCount: 22, intensity: 0.92, proximityRadius: 220, parallax: 0.6 }, performanceProfile: 'cinematic' },
    { niche: 'saas', why: 'Circuit glyphs at charged state give a technical, non-decorative product background.', props: { mode: 'hybrid', variant: 'automation-circuit-glyphs', stateMode: 'charged', interaction: 'pointer-proximity', glyphCount: 18, intensity: 0.74, proximityRadius: 190, parallax: 0.45 }, performanceProfile: 'balanced' },
    { niche: 'luxury', why: 'Stealth seals with a slow, low-count field stay quiet behind premium type.', props: { mode: 'scribble', variant: 'revenue-ascension-seals', stateMode: 'stealth', interaction: 'ambient', glyphCount: 10, intensity: 0.42, proximityRadius: 140, parallax: 0.18 }, performanceProfile: 'lite' },
    { niche: 'creator', why: 'Growth constellations in ritual state carry a personal-brand hero.', props: { mode: 'hybrid', variant: 'signal-growth-constellations', stateMode: 'ritual', interaction: 'pointer-attract', glyphCount: 24, intensity: 0.88, proximityRadius: 240, parallax: 0.62 }, performanceProfile: 'cinematic' },
    { niche: 'finance', why: 'Command sigils, warming only, keep an advisory site serious.', props: { mode: 'glyphs', variant: 'command-nexus-sigils', stateMode: 'warming', interaction: 'ambient', glyphCount: 12, intensity: 0.46, proximityRadius: 150, parallax: 0.15 }, performanceProfile: 'lite' },
  ],
  'cards-glass-metal-panel': [
    { niche: 'saas', why: 'Cool blue tint with a moderate sheen for pricing and feature panels.', props: { tint: '#62A7FF', blur: 12, sheen: 0.8, speed: 1 }, performanceProfile: 'balanced' },
    { niche: 'luxury', why: 'Gold tint, heavy blur and a slow sheen read as material, not as UI chrome.', props: { tint: '#C5A56B', blur: 18, sheen: 0.55, speed: 0.5 }, performanceProfile: 'cinematic' },
    { niche: 'finance', why: 'Restrained brass with a near-static sheen for a conservative surface.', props: { tint: '#B8A46B', blur: 10, sheen: 0.35, speed: 0.4 }, performanceProfile: 'lite' },
    { niche: 'automotive', why: 'Brushed-steel tint and a fast sheen for spec and configurator panels.', props: { tint: '#C5D0D9', blur: 14, sheen: 0.95, speed: 1.4 }, performanceProfile: 'cinematic' },
    { niche: 'healthcare', why: 'Soft teal, low sheen, low blur — calm and legible on a practice site.', props: { tint: '#69B8B4', blur: 8, sheen: 0.3, speed: 0.5 }, performanceProfile: 'lite' },
  ],
  'cards-interactive-surface-card': [
    { niche: 'fitness', why: 'Hard tilt with the full refraction and trace stack for rank and member cards.', props: { maxTilt: 18, depth: 1.4, glare: 0.9, overshoot: 0.85, refraction: true, borderTrace: true, accent: '#FF5B2E', chroma: 1.4, traceSpeed: 1.6 }, performanceProfile: 'cinematic' },
    { niche: 'saas', why: 'Balanced tilt, trace on, chroma dialled back so plan cards stay readable.', props: { maxTilt: 12, depth: 1, glare: 0.7, overshoot: 0.6, refraction: true, borderTrace: true, accent: '#62A7FF', chroma: 0.7, traceSpeed: 1 }, performanceProfile: 'balanced' },
    { niche: 'luxury', why: 'Minimal tilt, no chromatic fringe, a slow gold trace only.', props: { maxTilt: 6, depth: 0.6, glare: 0.45, overshoot: 0.3, refraction: false, borderTrace: true, accent: '#C5A56B', traceSpeed: 0.4 }, performanceProfile: 'lite' },
    { niche: 'ecommerce', why: 'Product tiles get refraction for material feel but no running edge light.', props: { maxTilt: 14, depth: 1.2, glare: 0.8, overshoot: 0.7, refraction: true, borderTrace: false, accent: '#F078B8', chroma: 1 }, performanceProfile: 'balanced' },
    { niche: 'real-estate', why: 'Gentle tilt and a calm brass edge for listing cards.', props: { maxTilt: 8, depth: 0.8, glare: 0.5, overshoot: 0.4, refraction: false, borderTrace: true, accent: '#C8B38A', traceSpeed: 0.6 }, performanceProfile: 'lite' },
  ],
  'cursor-pointer-interaction-field': [
    { niche: 'saas', why: 'A light field is the least intrusive pointer treatment for dense product UI.', props: { mode: 'light', accent: '#62A7FF', intensity: 0.9 }, performanceProfile: 'balanced' },
    { niche: 'creator', why: 'Symbol drift makes a personal-brand page feel authored.', props: { mode: 'symbols', accent: '#B86CFF', intensity: 1.3 }, performanceProfile: 'cinematic' },
    { niche: 'luxury', why: 'A slow spotlight reveals one thing at a time.', props: { mode: 'spotlight', accent: '#C5A56B', intensity: 0.6 }, performanceProfile: 'lite' },
    { niche: 'automotive', why: 'Parallax under the pointer suits configurator and gallery stages.', props: { mode: 'parallax', accent: '#C5D0D9', intensity: 1.1 }, performanceProfile: 'balanced' },
    { niche: 'fitness', why: 'Distortion at full strength matches a high-energy landing page.', props: { mode: 'distortion', accent: '#FF5B2E', intensity: 1.5 }, performanceProfile: 'cinematic' },
  ],
  'forms-signal-system': [
    { niche: 'saas', why: 'Command variant with telemetry visible is the natural product signup surface.', props: { variant: 'command', accent: '#62A7FF', successColor: '#39ff8b', springDamping: 6, springFreq: 9, signalStrength: 1, autoValidate: false, showTelemetry: true }, performanceProfile: 'balanced' },
    { niche: 'ecommerce', why: 'Checkout variant, auto-validated, telemetry hidden to keep the funnel clean.', props: { variant: 'checkout', accent: '#F078B8', successColor: '#39ff8b', springDamping: 8, springFreq: 11, signalStrength: 1.2, autoValidate: true, showTelemetry: false }, performanceProfile: 'balanced' },
    { niche: 'healthcare', why: 'Plain field variant with a soft spring — intake forms must not feel like a game.', props: { variant: 'field', accent: '#69B8B4', successColor: '#4fd1a5', springDamping: 11, springFreq: 6, signalStrength: 0.5, autoValidate: true, showTelemetry: false }, performanceProfile: 'lite' },
    { niche: 'finance', why: 'Field variant, low signal strength, no telemetry theatre.', props: { variant: 'field', accent: '#B8A46B', successColor: '#4fd1a5', springDamping: 12, springFreq: 5, signalStrength: 0.4, autoValidate: true, showTelemetry: false }, performanceProfile: 'lite' },
    { niche: 'fitness', why: 'Command variant at full strength for lead-magnet and challenge signups.', props: { variant: 'command', accent: '#FF5B2E', successColor: '#39ff8b', springDamping: 4, springFreq: 13, signalStrength: 1.6, autoValidate: false, showTelemetry: true }, performanceProfile: 'cinematic' },
  ],
  'hero-image-reveal-behind-text': [
    { niche: 'restaurant', why: 'A wide warm sweep works over food photography.', props: { revealRadius: 210, sweepSpeed: 0.8, palette: 'ember', autoSweep: true }, performanceProfile: 'balanced' },
    { niche: 'luxury', why: 'Gold palette, slow sweep, small radius — the image stays mostly hidden.', props: { revealRadius: 110, sweepSpeed: 0.4, palette: 'gold', autoSweep: true }, performanceProfile: 'lite' },
    { niche: 'real-estate', why: 'Monochrome and pointer-driven so the visitor uncovers the property.', props: { revealRadius: 180, sweepSpeed: 0.6, palette: 'mono', autoSweep: false }, performanceProfile: 'lite' },
    { niche: 'automotive', why: 'Fast wide ember sweep over a vehicle hero.', props: { revealRadius: 240, sweepSpeed: 1.8, palette: 'ember', autoSweep: true }, performanceProfile: 'cinematic' },
    { niche: 'beauty', why: 'Gold, gentle, medium radius for a treatment hero.', props: { revealRadius: 160, sweepSpeed: 0.6, palette: 'gold', autoSweep: true }, performanceProfile: 'balanced' },
  ],
  'hero-text-reveal': [
    { niche: 'saas', why: 'Quick stagger, single pass, brand accent on the key line.', props: { speed: 1.2, stagger: 0.06, textColor: '#f0ece4', accent: '#62A7FF', loop: false }, performanceProfile: 'balanced' },
    { niche: 'luxury', why: 'Slow cascade with wide stagger and no loop reads as typography, not animation.', props: { speed: 0.5, stagger: 0.2, textColor: '#efe7d8', accent: '#C5A56B', loop: false }, performanceProfile: 'lite' },
    { niche: 'fitness', why: 'Fast, tight, looping — a headline that keeps hitting.', props: { speed: 1.8, stagger: 0.03, textColor: '#ffffff', accent: '#FF5B2E', loop: true }, performanceProfile: 'cinematic' },
    { niche: 'creator', why: 'Medium speed with a violet accent for a personal hero.', props: { speed: 1.1, stagger: 0.1, textColor: '#f4f0ff', accent: '#B86CFF', loop: true }, performanceProfile: 'balanced' },
    { niche: 'finance', why: 'Calm single pass, brass accent, no repetition.', props: { speed: 0.7, stagger: 0.12, textColor: '#eae5da', accent: '#B8A46B', loop: false }, performanceProfile: 'lite' },
  ],
  'nox-cursorimagegallery': [
    { niche: 'real-estate', why: 'Three visible listings, reflections on, autoplay off so the visitor drives.', props: { visibleCount: 3, perspective: 1300, sideAngle: 42, sideScale: 0.7, showReflections: true, showControls: true, loop: true, autoPlay: false }, performanceProfile: 'balanced' },
    { niche: 'ecommerce', why: 'Five items on autoplay for a product carousel.', props: { visibleCount: 5, perspective: 1100, sideAngle: 50, sideScale: 0.7, showReflections: false, showControls: true, loop: true, autoPlay: true, autoPlayInterval: 2600 }, performanceProfile: 'balanced' },
    { niche: 'creator', why: 'Deep perspective and reflections for a portfolio wall.', props: { visibleCount: 4, perspective: 1600, sideAngle: 55, sideScale: 0.6, showReflections: true, showControls: false, loop: true, autoPlay: true, autoPlayInterval: 3400 }, performanceProfile: 'cinematic' },
    { niche: 'automotive', why: 'Wide angle, hard side scale, manual control for a model line-up.', props: { visibleCount: 3, perspective: 1400, sideAngle: 60, sideScale: 0.6, showReflections: true, showControls: true, loop: true, autoPlay: false }, performanceProfile: 'balanced' },
  ],
  'nox-electricborder': [
    { niche: 'saas', why: 'Four columns with default spacing frames a feature block.', props: { columns: 4, gap: 8 }, performanceProfile: 'balanced' },
    { niche: 'creator', why: 'More columns, tighter gap for a denser signal panel.', props: { columns: 6, gap: 4 }, performanceProfile: 'balanced' },
    { niche: 'luxury', why: 'Two wide columns keep the frame quiet.', props: { columns: 2, gap: 16 }, performanceProfile: 'lite' },
  ],
  'nox-juiceeffect': [
    { niche: 'ecommerce', why: 'Narrow items on a fast belt read as a product ticker.', props: { itemWidth: 200, autoSpeed: 45 }, performanceProfile: 'balanced' },
    { niche: 'restaurant', why: 'Wide items, slow drift for a dish strip.', props: { itemWidth: 320, autoSpeed: 18 }, performanceProfile: 'lite' },
    { niche: 'saas', why: 'Default cadence for a logo or integration marquee.', props: { itemWidth: 250, autoSpeed: 30 }, performanceProfile: 'balanced' },
  ],
  'nox-linkpreview': [
    { niche: 'creator', why: 'Dense grid with a visible line colour for an editorial link list.', props: { gridSpacing: 22, lineColor: '#B86CFF', lineWidth: 1, responsiveness: 0.6 }, performanceProfile: 'balanced' },
    { niche: 'saas', why: 'Wider grid, low responsiveness — documentation links, not a toy.', props: { gridSpacing: 36, lineColor: '#62A7FF', lineWidth: 1, responsiveness: 0.3 }, performanceProfile: 'lite' },
    { niche: 'luxury', why: 'Very wide spacing and a brass line for a sparse index.', props: { gridSpacing: 48, lineColor: '#C5A56B', lineWidth: 1, responsiveness: 0.2 }, performanceProfile: 'lite' },
  ],
  'nox-pixeldrift': [
    { niche: 'creator', why: 'Chunky pixels at high count for a loud brand panel.', props: { pixelSize: 6, pixelCount: 320 }, performanceProfile: 'cinematic' },
    { niche: 'saas', why: 'Small pixels, moderate count — texture without noise.', props: { pixelSize: 3, pixelCount: 200 }, performanceProfile: 'balanced' },
    { niche: 'finance', why: 'Sparse and fine so it reads as grain.', props: { pixelSize: 2, pixelCount: 90 }, performanceProfile: 'lite' },
  ],
  'originkit-draggablesticker': [
    { niche: 'creator', why: 'Holographic sheen with strong lighting for a signature sticker.', props: { sheenMode: 'holo', tilt: 12, tiltSmoothing: 18, lighting: true, lightingStrength: 14, elevation: 14 }, performanceProfile: 'cinematic' },
    { niche: 'ecommerce', why: 'Plain sheen, moderate tilt for a product badge.', props: { sheenMode: 'sheen', tilt: 6, tiltSmoothing: 22, lighting: true, lightingStrength: 8, elevation: 8 }, performanceProfile: 'balanced' },
    { niche: 'luxury', why: 'Barely-there tilt, no lighting rig — a printed label, not a toy.', props: { sheenMode: 'sheen', tilt: 3, tiltSmoothing: 30, lighting: false, elevation: 4 }, performanceProfile: 'lite' },
  ],
  'originkit-fluidtrail': [
    { niche: 'creator', why: 'Dense fast trail in brand colours for an expressive hero.', props: { particleCount: 600, particleSize: 8, trailLength: 46, speed: 0.5, fadeSpeed: 0.03, colors: '#B86CFF,#ff6b6b,#ffd93d' }, performanceProfile: 'cinematic' },
    { niche: 'fitness', why: 'Hot palette, short trail, high speed.', props: { particleCount: 420, particleSize: 7, trailLength: 24, speed: 0.7, fadeSpeed: 0.05, colors: '#FF5B2E,#ffd93d' }, performanceProfile: 'balanced' },
    { niche: 'beauty', why: 'Few large soft particles that fade slowly.', props: { particleCount: 180, particleSize: 10, trailLength: 60, speed: 0.2, fadeSpeed: 0.02, colors: '#D9A8B8,#f4e2e6' }, performanceProfile: 'lite' },
    { niche: 'saas', why: 'Moderate count in a single cool hue.', props: { particleCount: 300, particleSize: 5, trailLength: 30, speed: 0.4, fadeSpeed: 0.03, colors: '#62A7FF,#6bcbff' }, performanceProfile: 'balanced' },
  ],
  'originkit-globe': [
    { niche: 'saas', why: 'Full point cloud with grid and glow for a coverage or infrastructure section.', props: { pointCount: 8000, pointSize: 1.2, pointColor: '#ffffff', atmosphereColor: '#4facfe', showMarkers: true, showGrid: true, showGlow: true, autoRotateSpeed: 0.5 }, performanceProfile: 'cinematic' },
    { niche: 'finance', why: 'Fewer points, no glow — a market map, not a screensaver.', props: { pointCount: 3000, pointSize: 1, pointColor: '#e6dcc4', atmosphereColor: '#B8A46B', showMarkers: true, showGrid: false, showGlow: false, autoRotateSpeed: 0.3 }, performanceProfile: 'lite' },
    { niche: 'ecommerce', why: 'Markers on for shipping destinations, medium density.', props: { pointCount: 5000, pointSize: 1.1, pointColor: '#ffffff', markerColor: '#F078B8', atmosphereColor: '#F078B8', showMarkers: true, showGrid: true, showGlow: true, autoRotateSpeed: 0.7 }, performanceProfile: 'balanced' },
  ],
  'originkit-particle-text-transformation-system': [
    { niche: 'ecommerce', why: 'High density for a product-launch headline.', props: { density: 1800 }, performanceProfile: 'cinematic' },
    { niche: 'saas', why: 'Default density keeps the launch reveal affordable.', props: { density: 900 }, performanceProfile: 'balanced' },
    { niche: 'luxury', why: 'Low density so the word settles rather than swarms.', props: { density: 400 }, performanceProfile: 'lite' },
    { niche: 'creator', why: 'Maximum density for a single signature word.', props: { density: 2400 }, performanceProfile: 'cinematic' },
  ],
  'originkit-text-signal-system': [
    { niche: 'saas', why: 'Glitch on enter at moderate intensity for a status or release headline.', props: { mode: 'glitch', trigger: 'enter', intensity: 6 }, performanceProfile: 'balanced' },
    { niche: 'creator', why: 'Hover-triggered glitch at high intensity.', props: { mode: 'glitch', trigger: 'hover', intensity: 14 }, performanceProfile: 'cinematic' },
    { niche: 'fitness', why: 'Boot phase on an interval keeps a countdown alive.', props: { mode: 'boot', trigger: 'interval', intensity: 10 }, performanceProfile: 'balanced' },
    { niche: 'finance', why: 'Boot once on enter, minimum intensity.', props: { mode: 'boot', trigger: 'enter', intensity: 2 }, performanceProfile: 'lite' },
  ],
  'originkit-textmorph': [
    { niche: 'saas', why: 'Four value words on a steady morph cycle.', props: { morphDuration: 1, holdDuration: 2, fontSize: 64, fontWeight: 700, color: '#ffffff', textAlign: 'center' }, performanceProfile: 'balanced' },
    { niche: 'luxury', why: 'Slow morph, long hold, light weight — the words are read, not watched.', props: { morphDuration: 2.4, holdDuration: 5, fontSize: 72, fontWeight: 300, color: '#efe7d8', textAlign: 'left' }, performanceProfile: 'lite' },
    { niche: 'fitness', why: 'Short hold and fast morph for a high-cadence claim stack.', props: { morphDuration: 0.4, holdDuration: 0.8, fontSize: 88, fontWeight: 900, color: '#ffffff', textAlign: 'center' }, performanceProfile: 'cinematic' },
    { niche: 'creator', why: 'Large left-aligned type with a relaxed cycle.', props: { morphDuration: 1.4, holdDuration: 2.6, fontSize: 96, fontWeight: 800, color: '#f4f0ff', textAlign: 'left' }, performanceProfile: 'balanced' },
  ],
  'overlays-surface-system': [
    { niche: 'saas', why: 'Modal with a standard blur for settings and confirmation dialogs.', props: { mode: 'modal', accent: '#62A7FF', speed: 1, blur: 12 }, performanceProfile: 'balanced' },
    { niche: 'ecommerce', why: 'Sheet for a cart drawer, faster and lightly blurred.', props: { mode: 'sheet', accent: '#F078B8', speed: 1.4, blur: 8 }, performanceProfile: 'balanced' },
    { niche: 'luxury', why: 'Slow modal with heavy glass.', props: { mode: 'modal', accent: '#C5A56B', speed: 0.5, blur: 22 }, performanceProfile: 'cinematic' },
    { niche: 'healthcare', why: 'Sheet with almost no blur so the form behind stays legible.', props: { mode: 'sheet', accent: '#69B8B4', speed: 1, blur: 4 }, performanceProfile: 'lite' },
  ],
  'scroll-parallax-symbol-layers': [
    { niche: 'creator', why: 'Full travel and blur depth in the NOX palette.', props: { layers: 4, travel: 1.1, blurMax: 8, damping: 7, colorMode: 'nox' }, performanceProfile: 'cinematic' },
    { niche: 'fitness', why: 'Ember palette with hard travel.', props: { layers: 4, travel: 1.2, blurMax: 6, damping: 6, colorMode: 'ember' }, performanceProfile: 'balanced' },
    { niche: 'finance', why: 'Mono, short travel, heavy damping — motion you notice only in passing.', props: { layers: 3, travel: 0.4, blurMax: 2, damping: 14, colorMode: 'mono' }, performanceProfile: 'lite' },
    { niche: 'real-estate', why: 'Mono with medium travel behind property sections.', props: { layers: 3, travel: 0.6, blurMax: 3, damping: 11, colorMode: 'mono' }, performanceProfile: 'lite' },
  ],
  'scroll-section-snap-depth': [
    { niche: 'saas', why: 'Four sections with a firm dim between them.', props: { sectionCount: 4, dimStrength: 0.7, accent: '#62A7FF' }, performanceProfile: 'balanced' },
    { niche: 'luxury', why: 'Fewer sections, near-total dim so one thing exists at a time.', props: { sectionCount: 3, dimStrength: 1, accent: '#C5A56B' }, performanceProfile: 'lite' },
    { niche: 'automotive', why: 'Five sections for a model walkthrough.', props: { sectionCount: 5, dimStrength: 0.85, accent: '#C5D0D9' }, performanceProfile: 'balanced' },
    { niche: 'healthcare', why: 'Light dim keeps neighbouring content readable.', props: { sectionCount: 4, dimStrength: 0.3, accent: '#69B8B4' }, performanceProfile: 'lite' },
  ],
  'scroll-timeline-progress-rail': [
    { niche: 'saas', why: 'Five milestones with the percentage visible for an onboarding rail.', props: { milestones: 5, damping: 8, glow: 0.8, accent: '#62A7FF', showPercent: true }, performanceProfile: 'balanced' },
    { niche: 'local-service', why: 'Four steps, no percentage — a process, not a loading bar.', props: { milestones: 4, damping: 10, glow: 0.4, accent: '#F2B544', showPercent: false }, performanceProfile: 'lite' },
    { niche: 'fitness', why: 'Six milestones with a strong glow for a programme timeline.', props: { milestones: 6, damping: 6, glow: 1, accent: '#FF5B2E', showPercent: true }, performanceProfile: 'cinematic' },
    { niche: 'finance', why: 'Minimal glow and heavy damping for an advisory process.', props: { milestones: 4, damping: 14, glow: 0.15, accent: '#B8A46B', showPercent: false }, performanceProfile: 'lite' },
  ],
  'scroll-velocity-skew': [
    { niche: 'creator', why: 'Strong skew and a fast marquee for an expressive section break.', props: { skewMax: 18, damping: 7, marqueeBase: 80, accent: '#B86CFF' }, performanceProfile: 'cinematic' },
    { niche: 'ecommerce', why: 'Medium skew on a category strip.', props: { skewMax: 10, damping: 9, marqueeBase: 50, accent: '#F078B8' }, performanceProfile: 'balanced' },
    { niche: 'luxury', why: 'Barely any skew, slow marquee.', props: { skewMax: 3, damping: 15, marqueeBase: 18, accent: '#C5A56B' }, performanceProfile: 'lite' },
    { niche: 'automotive', why: 'Hard skew that reads as speed.', props: { skewMax: 20, damping: 6, marqueeBase: 95, accent: '#C5D0D9' }, performanceProfile: 'cinematic' },
  ],
  'system-progress-feedback': [
    { niche: 'saas', why: 'Scan mode on replay for a processing state.', props: { mode: 'scan', accent: '#62A7FF', speed: 1, target: 100, autoReplay: true }, performanceProfile: 'balanced' },
    { niche: 'fitness', why: 'XP fill at speed for a progression or streak widget.', props: { mode: 'xp', accent: '#FF5B2E', speed: 1.8, target: 100, autoReplay: true }, performanceProfile: 'balanced' },
    { niche: 'healthcare', why: 'Ring charge, slow, single pass — a status, not an animation.', props: { mode: 'ring', accent: '#69B8B4', speed: 0.5, target: 80, autoReplay: false }, performanceProfile: 'lite' },
    { niche: 'finance', why: 'Ring at low speed with no replay.', props: { mode: 'ring', accent: '#B8A46B', speed: 0.4, target: 100, autoReplay: false }, performanceProfile: 'lite' },
  ],
  'transitions-route-system': [
    { niche: 'saas', why: 'Wipe is the safest default between product routes.', props: { mode: 'wipe', accent: '#62A7FF', speed: 1.2 }, performanceProfile: 'balanced' },
    { niche: 'luxury', why: 'Masked route at low speed for a deliberate page change.', props: { mode: 'masked', accent: '#C5A56B', speed: 0.6 }, performanceProfile: 'lite' },
    { niche: 'creator', why: 'Clip reveal keeps a portfolio jump expressive.', props: { mode: 'clip', accent: '#B86CFF', speed: 1.4 }, performanceProfile: 'balanced' },
    { niche: 'automotive', why: 'Panel shift suits a configurator step change.', props: { mode: 'panel', accent: '#C5D0D9', speed: 1.6 }, performanceProfile: 'cinematic' },
    { niche: 'restaurant', why: 'Warm wipe between menu and reservation views.', props: { mode: 'wipe', accent: '#D89B5B', speed: 1 }, performanceProfile: 'balanced' },
  ],
};

export const CORE_CANON: CoreCanonEntry[] = [
  {
    id: 'bg-atmosphere-field',
    summary: 'One atmospheric background composition: volumetric fog, layered glow and radial beams as independent modules.',
    role: 'Atmosphere',
    runtimeTier: 'standard',
    modules: [
      { key: 'fog', label: 'Fog', description: 'Domain-warped volumetric fog layer.', absorbs: ['bg-noise-fog-field'] },
      { key: 'glow', label: 'Glow', description: 'Stacked depth glow planes behind the fog.', absorbs: ['bg-depth-glow-stack'] },
      { key: 'beams', label: 'Beams', description: 'Radial light beams rising from a configurable origin.', absorbs: ['bg-radial-beam-atmosphere'] },
    ],
    coreControls: ['preset', 'intensity', 'fog', 'glow', 'beams', 'speed', 'parallax'],
    profiles: [
      { id: 'lite', label: 'Lite', overrides: { performanceProfile: 'lite', glowLayers: 4, beamCount: 6 }, note: 'Fog is dropped and glow/beam counts are capped by the component.' },
      { id: 'balanced', label: 'Balanced', overrides: { performanceProfile: 'balanced', glowLayers: 6, beamCount: 10 }, note: 'Full module set with capped layer counts.' },
      { id: 'cinematic', label: 'Cinematic', overrides: { performanceProfile: 'cinematic', glowLayers: 6, beamCount: 9 }, note: 'No caps; values run as authored.' },
    ],
    templateSurfaces: ['website', 'dashboard'],
    templateRoles: ['background'],
    templatePriority: 100,
    absorbs: ['bg-noise-fog-field', 'bg-depth-glow-stack', 'bg-radial-beam-atmosphere'],
  },
  {
    id: 'bg-nox-interactive-glyph-field',
    summary: 'Interactive glyph and scribble field with pointer proximity, charge states and five sigil variants.',
    role: 'Atmosphere',
    runtimeTier: 'heavy',
    modeControl: 'mode',
    modes: [
      { value: 'glyphs', label: 'Glyphs', description: 'Discrete rune glyphs only.', absorbs: ['bg-forge-energy-glyphs'] },
      { value: 'scribble', label: 'Scribble', description: 'Continuous scribble strokes only.', absorbs: ['bg-nox-scribble-field'] },
      { value: 'hybrid', label: 'Hybrid', description: 'Both mechanics composed in one field.' },
    ],
    coreControls: ['mode', 'variant', 'stateMode', 'interaction', 'glyphCount', 'intensity', 'proximityRadius', 'parallax'],
    profiles: [
      { id: 'lite', label: 'Lite', overrides: { glyphCount: 10, density: 0.6, parallax: 0.15 }, note: 'A third of the glyph budget, minimal parallax.' },
      { id: 'balanced', label: 'Balanced', overrides: { glyphCount: 18, density: 1, parallax: 0.45 }, note: 'Catalog default density.' },
      { id: 'cinematic', label: 'Cinematic', overrides: { glyphCount: 28, density: 1.4, parallax: 0.7 }, note: 'Near-maximum glyph count and parallax depth.' },
    ],
    templateSurfaces: ['website', 'dashboard'],
    templateRoles: ['background'],
    templatePriority: 85,
    absorbs: ['bg-forge-energy-glyphs', 'bg-nox-scribble-field'],
  },
  {
    id: 'canvasui-particle-field-system',
    summary: 'Canvas particle field that either reconstructs an asset or resolves text, on one shared simulation.',
    role: 'Particle Field',
    runtimeTier: 'heavy',
    modeControl: 'mode',
    modes: [
      { value: 'asset', label: 'Asset', description: 'Particles reconstruct a sampled image.', absorbs: ['canvasui-particle-object'] },
      { value: 'reveal', label: 'Reveal', description: 'Particles resolve into typed text.', absorbs: ['canvasui-particle-reveal'] },
    ],
    coreControls: ['preset', 'mode', 'text', 'density', 'particleSize', 'color'],
    profiles: [
      { id: 'lite', label: 'Lite', overrides: { density: 900, particleSize: 1.2, interactionStrength: 0.4 }, note: 'Under a thousand particles; safe on low-end mobile.' },
      { id: 'balanced', label: 'Balanced', overrides: { density: 2200, particleSize: 1.6, interactionStrength: 0.8 }, note: 'Default working density.' },
      { id: 'cinematic', label: 'Cinematic', overrides: { density: 4200, particleSize: 2.2, interactionStrength: 1.2 }, note: 'Full simulation budget — desktop only.' },
    ],
    templateSurfaces: ['website'],
    templateRoles: ['hero', 'background'],
    templatePriority: 70,
    absorbs: ['canvasui-particle-object', 'canvasui-particle-reveal'],
  },
  {
    id: 'cards-glass-metal-panel',
    summary: 'Layered glass over brushed metal with an anisotropic conic sheen that tilts with hover.',
    role: 'Surface',
    runtimeTier: 'standard',
    coreControls: ['tint', 'blur', 'sheen', 'speed'],
    profiles: [
      { id: 'lite', label: 'Lite', overrides: { blur: 6, sheen: 0.4, speed: 0.6 }, note: 'Low backdrop-filter radius — the main cost of this core.' },
      { id: 'balanced', label: 'Balanced', overrides: { blur: 12, sheen: 0.8, speed: 1 }, note: 'Catalog default.' },
      { id: 'cinematic', label: 'Cinematic', overrides: { blur: 20, sheen: 1, speed: 1.4 }, note: 'Heavy blur; keep to a few panels per viewport.' },
    ],
    templateSurfaces: ['website', 'dashboard'],
    templateRoles: ['surface'],
    templatePriority: 90,
    absorbs: [],
  },
  {
    id: 'cards-interactive-surface-card',
    summary: '3D tilt card with inner parallax planes, pointer-velocity refraction and a running border trace.',
    role: 'Surface',
    runtimeTier: 'standard',
    modules: [
      { key: 'refraction', label: 'Refraction', description: 'Counter-moving specular highlight with a velocity-driven chromatic fringe.', absorbs: ['cards-hover-light-refraction'] },
      { key: 'borderTrace', label: 'Border Trace', description: 'Conic edge light plus an offset blurred glow copy behind it.', absorbs: ['cards-border-trace-depth'] },
    ],
    coreControls: ['maxTilt', 'depth', 'glare', 'overshoot', 'refraction', 'borderTrace', 'accent'],
    profiles: [
      { id: 'lite', label: 'Lite', overrides: { refraction: false, borderTrace: false, depth: 0.6, glare: 0.4 }, note: 'Tilt only — no extra composited layers.' },
      { id: 'balanced', label: 'Balanced', overrides: { refraction: true, borderTrace: true, depth: 1, glare: 0.7, chroma: 0.8, traceSpeed: 1 }, note: 'Both modules at moderate strength.' },
      { id: 'cinematic', label: 'Cinematic', overrides: { refraction: true, borderTrace: true, depth: 1.6, glare: 1, chroma: 1.6, traceSpeed: 1.8 }, note: 'Full stack — blur and conic gradients on every card.' },
    ],
    templateSurfaces: ['website', 'dashboard'],
    templateRoles: ['surface'],
    templatePriority: 95,
    absorbs: ['cards-hover-light-refraction', 'cards-border-trace-depth'],
    migrationNotes: 'Refraction and border trace were re-implemented as modules on this core; both standalone components stay importable.',
  },
  {
    id: 'cursor-pointer-interaction-field',
    summary: 'One pointer field with five exclusive treatments: light, distortion, parallax, spotlight and symbol drift.',
    role: 'Pointer',
    runtimeTier: 'standard',
    modeControl: 'mode',
    modes: [
      { value: 'light', label: 'Light Field', description: 'Soft light that follows the pointer.', absorbs: ['cursor-light-field'] },
      { value: 'distortion', label: 'Distortion', description: 'Local displacement around the pointer.', absorbs: ['cursor-hover-distortion'] },
      { value: 'parallax', label: 'Parallax', description: 'Stage layers shift against the pointer.', absorbs: ['cursor-pointer-parallax-stage'] },
      { value: 'spotlight', label: 'Spotlight', description: 'Masked reveal under the pointer.', absorbs: ['cursor-spotlight-reveal'] },
      { value: 'symbols', label: 'Symbol Drift', description: 'Symbols drift in the pointer wake.', absorbs: ['cursor-interactive-symbol-drift'] },
    ],
    coreControls: ['mode', 'accent', 'intensity'],
    templateSurfaces: ['website', 'dashboard'],
    templateRoles: ['cursor'],
    templatePriority: 100,
    absorbs: ['cursor-light-field', 'cursor-hover-distortion', 'cursor-pointer-parallax-stage', 'cursor-spotlight-reveal', 'cursor-interactive-symbol-drift'],
    migrationNotes: 'The five absorbed mechanics are mutually exclusive treatments, so they became modes rather than stackable modules.',
  },
  {
    id: 'forms-signal-system',
    summary: 'Form feedback core: spring-driven selection, transition, validation and energy signals in one pipeline.',
    role: 'Form',
    runtimeTier: 'standard',
    modeControl: 'variant',
    modes: [
      { value: 'field', label: 'Field', description: 'Single labelled input with inline validation.' },
      { value: 'command', label: 'Command', description: 'Command-bar styling with a telemetry readout.' },
      { value: 'checkout', label: 'Checkout', description: 'Checkout row with a success-state emphasis.' },
    ],
    modules: [
      { key: 'autoValidate', label: 'Validation', description: 'Validates while typing instead of on submit.', absorbs: ['forms-answer-lock-in'] },
      { key: 'showTelemetry', label: 'Telemetry', description: 'Exposes the live signal readout under the field.' },
    ],
    coreControls: ['variant', 'accent', 'successColor', 'signalStrength', 'autoValidate', 'showTelemetry'],
    profiles: [
      { id: 'lite', label: 'Lite', overrides: { signalStrength: 0.4, springDamping: 12, showTelemetry: false }, note: 'Heavily damped spring, no telemetry layer.' },
      { id: 'balanced', label: 'Balanced', overrides: { signalStrength: 1, springDamping: 6, springFreq: 9 }, note: 'Catalog default response.' },
      { id: 'cinematic', label: 'Cinematic', overrides: { signalStrength: 1.6, springDamping: 3, springFreq: 14, showTelemetry: true }, note: 'Underdamped, high-frequency spring with full telemetry.' },
    ],
    templateSurfaces: ['website', 'dashboard'],
    templateRoles: ['form'],
    templatePriority: 100,
    absorbs: ['forms-answer-lock-in', 'forms-question-transition', 'forms-selection-energy-ripple'],
    migrationNotes: 'Selection ripple and question transition are fused into the shared spring pipeline rather than exposed as separate switches; answer lock-in maps to the validation module.',
  },
  {
    id: 'hero-image-reveal-behind-text',
    summary: 'Headline that masks an image, revealed by a radius that sweeps automatically or follows the pointer.',
    role: 'Hero',
    runtimeTier: 'standard',
    modules: [
      { key: 'autoSweep', label: 'Auto Sweep', description: 'Runs the reveal on a timer instead of requiring a pointer.' },
    ],
    coreControls: ['revealRadius', 'sweepSpeed', 'palette', 'autoSweep'],
    templateSurfaces: ['website'],
    templateRoles: ['hero'],
    templatePriority: 90,
    absorbs: [],
  },
  {
    id: 'hero-text-reveal',
    summary: 'Staggered word and letter cascade for large headlines, with an optional loop.',
    role: 'Hero',
    runtimeTier: 'light',
    modules: [
      { key: 'loop', label: 'Loop', description: 'Repeats the cascade instead of playing once.' },
    ],
    coreControls: ['speed', 'stagger', 'textColor', 'accent', 'loop'],
    templateSurfaces: ['website'],
    templateRoles: ['hero'],
    templatePriority: 100,
    absorbs: ['hero-word-letter-cascade', 'hero-massive-typography-reveal'],
  },
  {
    id: 'nox-cursorimagegallery',
    summary: 'Perspective image gallery driven by the cursor, with reflections, controls and optional autoplay.',
    role: 'Gallery',
    runtimeTier: 'light',
    modules: [
      { key: 'showReflections', label: 'Reflections', description: 'Mirrored floor reflection under each item.' },
      { key: 'showControls', label: 'Controls', description: 'Visible previous/next affordances.' },
      { key: 'autoPlay', label: 'Autoplay', description: 'Advances on an interval without input.' },
      { key: 'loop', label: 'Loop', description: 'Wraps around at both ends.' },
    ],
    coreControls: ['visibleCount', 'perspective', 'sideAngle', 'sideScale', 'showReflections', 'showControls', 'autoPlay', 'loop'],
    templateSurfaces: ['website'],
    templateRoles: ['surface'],
    templatePriority: 60,
    absorbs: [],
  },
  {
    id: 'nox-electricborder',
    summary: 'Column-partitioned electric border frame for panels and feature blocks.',
    role: 'Surface',
    runtimeTier: 'light',
    coreControls: ['columns', 'gap', 'width', 'height'],
    templateSurfaces: ['website', 'dashboard'],
    templateRoles: ['surface'],
    templatePriority: 45,
    absorbs: [],
  },
  {
    id: 'nox-juiceeffect',
    summary: 'Continuous horizontal item belt with elastic response — logo strips, tickers and marquees.',
    role: 'Marquee',
    runtimeTier: 'light',
    coreControls: ['itemWidth', 'autoSpeed', 'width', 'height'],
    templateSurfaces: ['website'],
    templateRoles: ['scroll'],
    templatePriority: 40,
    absorbs: [],
  },
  {
    id: 'nox-linkpreview',
    summary: 'Grid-line link surface that previews a target on hover.',
    role: 'Navigation',
    runtimeTier: 'light',
    coreControls: ['gridSpacing', 'lineColor', 'lineWidth', 'responsiveness'],
    templateSurfaces: ['website'],
    templateRoles: ['surface'],
    templatePriority: 35,
    absorbs: [],
  },
  {
    id: 'nox-pixeldrift',
    summary: 'Drifting pixel field for grain, texture and low-cost background motion.',
    role: 'Texture',
    runtimeTier: 'light',
    coreControls: ['pixelSize', 'pixelCount', 'width', 'height'],
    profiles: [
      { id: 'lite', label: 'Lite', overrides: { pixelCount: 80, pixelSize: 3 }, note: 'Sparse grain.' },
      { id: 'balanced', label: 'Balanced', overrides: { pixelCount: 200, pixelSize: 4 }, note: 'Catalog default.' },
      { id: 'cinematic', label: 'Cinematic', overrides: { pixelCount: 520, pixelSize: 6 }, note: 'Dense drift.' },
    ],
    templateSurfaces: ['website', 'dashboard'],
    templateRoles: ['background'],
    templatePriority: 50,
    absorbs: [],
  },
  {
    id: 'originkit-draggablesticker',
    summary: 'Physically draggable sticker with tilt, dynamic lighting and a sheen or holographic surface.',
    role: 'Surface',
    runtimeTier: 'standard',
    modeControl: 'sheenMode',
    modes: [
      { value: 'sheen', label: 'Sheen', description: 'Single specular sweep across the sticker.' },
      { value: 'holo', label: 'Holographic', description: 'Multi-hue holographic shift with the tilt angle.' },
    ],
    modules: [
      { key: 'lighting', label: 'Lighting', description: 'Dynamic light source that follows the drag.' },
    ],
    coreControls: ['image', 'imageWidth', 'imageHeight', 'tilt', 'sheenMode', 'lighting', 'elevation'],
    templateSurfaces: ['website'],
    templateRoles: ['surface'],
    templatePriority: 40,
    absorbs: [],
  },
  {
    id: 'originkit-fluidtrail',
    summary: 'Pointer-driven fluid particle trail with configurable palette and decay.',
    role: 'Pointer',
    runtimeTier: 'standard',
    coreControls: ['particleCount', 'particleSize', 'trailLength', 'speed', 'fadeSpeed', 'colors'],
    profiles: [
      { id: 'lite', label: 'Lite', overrides: { particleCount: 150, trailLength: 18 }, note: 'Short trail, low particle budget.' },
      { id: 'balanced', label: 'Balanced', overrides: { particleCount: 300, trailLength: 30 }, note: 'Catalog default.' },
      { id: 'cinematic', label: 'Cinematic', overrides: { particleCount: 800, trailLength: 70 }, note: 'Long dense trail — desktop pointer only.' },
    ],
    templateSurfaces: ['website'],
    templateRoles: ['cursor'],
    templatePriority: 70,
    absorbs: [],
  },
  {
    id: 'originkit-globe',
    summary: 'WebGL point-cloud globe with markers, graticule grid and atmospheric glow.',
    role: 'Data',
    runtimeTier: 'gpu',
    modules: [
      { key: 'showMarkers', label: 'Markers', description: 'Location markers on the sphere.' },
      { key: 'showGrid', label: 'Grid', description: 'Graticule lines.' },
      { key: 'showGlow', label: 'Atmosphere Glow', description: 'Outer atmospheric halo.' },
    ],
    coreControls: ['pointCount', 'pointSize', 'pointColor', 'autoRotateSpeed', 'showMarkers', 'showGrid', 'showGlow'],
    profiles: [
      { id: 'lite', label: 'Lite', overrides: { pointCount: 2000, showGlow: false, showGrid: false }, note: 'Minimum point cloud, no post layers.' },
      { id: 'balanced', label: 'Balanced', overrides: { pointCount: 5000, showGlow: true, showGrid: true }, note: 'Catalog default.' },
      { id: 'cinematic', label: 'Cinematic', overrides: { pointCount: 18000, showGlow: true, showGrid: true }, note: 'Large point cloud — dedicated GPU expected.' },
    ],
    templateSurfaces: ['website', 'dashboard'],
    templateRoles: ['system'],
    templatePriority: 80,
    absorbs: [],
  },
  {
    id: 'originkit-particle-text-transformation-system',
    summary: 'Text-to-particle transformation core covering dust reveals and vaporize dissolves.',
    role: 'Text',
    runtimeTier: 'heavy',
    coreControls: ['text', 'density'],
    profiles: [
      { id: 'lite', label: 'Lite', overrides: { density: 300 }, note: 'Minimum particle budget.' },
      { id: 'balanced', label: 'Balanced', overrides: { density: 800 }, note: 'Catalog default.' },
      { id: 'cinematic', label: 'Cinematic', overrides: { density: 2400 }, note: 'Maximum density — click-to-run in the gallery.' },
    ],
    templateSurfaces: ['website'],
    templateRoles: ['hero'],
    templatePriority: 65,
    absorbs: ['nox-dusttextreveal', 'nox-textvaporize'],
  },
  {
    id: 'originkit-text-mutation-system',
    summary: 'Typewriter and deterministic scramble text in one core, with niche-tuned cadence.',
    role: 'Text',
    runtimeTier: 'light',
    modeControl: 'mode',
    modes: [
      { value: 'typewriter', label: 'Typewriter', description: 'Character-by-character typing with an optional cursor.', absorbs: ['nox-typewriter'] },
      { value: 'scramble', label: 'Scramble', description: 'Deterministic scramble that resolves to the target string.', absorbs: ['nox-scrambletext'] },
    ],
    coreControls: ['preset', 'mode', 'text', 'speed', 'trigger'],
    templateSurfaces: ['website', 'dashboard'],
    templateRoles: ['hero', 'system'],
    templatePriority: 85,
    absorbs: ['nox-typewriter', 'nox-scrambletext'],
  },
  {
    id: 'originkit-text-signal-system',
    summary: 'Signal text core with a boot phase and a glitch phase over deterministic slices.',
    role: 'Text',
    runtimeTier: 'standard',
    modeControl: 'mode',
    modes: [
      { value: 'boot', label: 'Boot', description: 'Per-letter flicker that settles into the resolved string.', absorbs: ['originkit-flickertext'] },
      { value: 'glitch', label: 'Glitch', description: 'Sliced RGB displacement bursts.', absorbs: ['nox-glitchtext'] },
    ],
    coreControls: ['text', 'mode', 'trigger', 'intensity'],
    templateSurfaces: ['website', 'dashboard'],
    templateRoles: ['hero', 'system'],
    templatePriority: 75,
    absorbs: ['nox-glitchtext', 'originkit-flickertext'],
  },
  {
    id: 'originkit-textmorph',
    summary: 'Word-to-word morph cycle for rotating value propositions.',
    role: 'Text',
    runtimeTier: 'standard',
    coreControls: ['words', 'fontSize', 'morphDuration', 'holdDuration', 'color', 'fontWeight', 'textAlign'],
    templateSurfaces: ['website'],
    templateRoles: ['hero'],
    templatePriority: 70,
    absorbs: [],
  },
  {
    id: 'originkit-variable-weight-text',
    summary: 'Variable-font weight animation with hover and ambient rhythms.',
    role: 'Text',
    runtimeTier: 'light',
    modeControl: 'trigger',
    modes: [
      { value: 'hover', label: 'Hover', description: 'Weight responds to pointer proximity.', absorbs: ['nox-weighthover'] },
      { value: 'auto', label: 'Ambient', description: 'Weight animates continuously on a rhythm.', absorbs: ['nox-dynamicweight'] },
    ],
    coreControls: ['text', 'trigger', 'rhythm', 'minWeight', 'maxWeight', 'duration', 'stagger'],
    templateSurfaces: ['website'],
    templateRoles: ['hero'],
    templatePriority: 60,
    absorbs: ['nox-dynamicweight', 'nox-weighthover'],
  },
  {
    id: 'overlays-surface-system',
    summary: 'Overlay surface core covering centred modals and edge sheets with shared glass and timing.',
    role: 'Overlay',
    runtimeTier: 'standard',
    modeControl: 'mode',
    modes: [
      { value: 'modal', label: 'Modal', description: 'Centred iris-revealed dialog.', absorbs: ['overlays-modal-iris-reveal'] },
      { value: 'sheet', label: 'Sheet', description: 'Edge-anchored glass sheet.', absorbs: ['overlays-glass-sheet'] },
    ],
    coreControls: ['mode', 'accent', 'speed', 'blur'],
    profiles: [
      { id: 'lite', label: 'Lite', overrides: { blur: 4, speed: 1.4 }, note: 'Minimal backdrop blur.' },
      { id: 'balanced', label: 'Balanced', overrides: { blur: 12, speed: 1 }, note: 'Catalog default.' },
      { id: 'cinematic', label: 'Cinematic', overrides: { blur: 24, speed: 0.6 }, note: 'Full-strength glass, slow reveal.' },
    ],
    templateSurfaces: ['website', 'dashboard'],
    templateRoles: ['overlay'],
    templatePriority: 100,
    absorbs: ['overlays-modal-iris-reveal', 'overlays-glass-sheet'],
  },
  {
    id: 'scroll-parallax-symbol-layers',
    summary: 'Depth-blurred symbol layers that travel at different rates through the viewport.',
    role: 'Scroll',
    runtimeTier: 'standard',
    coreControls: ['layers', 'travel', 'blurMax', 'damping', 'colorMode'],
    profiles: [
      { id: 'lite', label: 'Lite', overrides: { layers: 3, blurMax: 0, travel: 0.4 }, note: 'No blur filters — the expensive part of this core.' },
      { id: 'balanced', label: 'Balanced', overrides: { layers: 4, blurMax: 5, travel: 0.8 }, note: 'Catalog default.' },
      { id: 'cinematic', label: 'Cinematic', overrides: { layers: 4, blurMax: 10, travel: 1.2 }, note: 'Maximum blur depth and travel.' },
    ],
    templateSurfaces: ['website'],
    templateRoles: ['scroll', 'background'],
    templatePriority: 75,
    absorbs: [],
  },
  {
    id: 'scroll-scene-system',
    summary: 'Scroll-driven scene core with free and pinned layouts, semantic stations and a bounded scroll driver.',
    role: 'Scroll',
    runtimeTier: 'standard',
    modeControl: 'layout',
    modes: [
      { value: 'free', label: 'Free', description: 'Object transforms with normal page scroll.', absorbs: ['scroll-object-transform'] },
      { value: 'pinned', label: 'Pinned', description: 'Stage pins while stations advance.', absorbs: ['scroll-pinned-product-stage'] },
    ],
    modules: [
      { key: 'showRail', label: 'Progress Rail', description: 'Station rail alongside the stage.' },
      { key: 'colorShift', label: 'Color Shift', description: 'Accent shifts per station.' },
    ],
    coreControls: ['preset', 'layout', 'stations', 'depth', 'showRail', 'colorShift', 'accent'],
    profiles: [
      { id: 'lite', label: 'Lite', overrides: { stations: 2, depth: 0.25, damping: 12 }, note: 'Fewest stations, shallow depth, heavy damping.' },
      { id: 'balanced', label: 'Balanced', overrides: { stations: 4, depth: 0.72, damping: 8 }, note: 'Catalog default.' },
      { id: 'cinematic', label: 'Cinematic', overrides: { stations: 6, depth: 1, damping: 6 }, note: 'Full station count and depth.' },
    ],
    templateSurfaces: ['website'],
    templateRoles: ['scroll'],
    templatePriority: 100,
    absorbs: ['scroll-pinned-product-stage', 'scroll-object-transform'],
  },
  {
    id: 'scroll-section-snap-depth',
    summary: 'Section snapping with a depth dim that isolates the active section.',
    role: 'Scroll',
    runtimeTier: 'standard',
    coreControls: ['sectionCount', 'dimStrength', 'accent'],
    templateSurfaces: ['website'],
    templateRoles: ['scroll'],
    templatePriority: 80,
    absorbs: [],
  },
  {
    id: 'scroll-timeline-progress-rail',
    summary: 'Damped scroll progress rail with milestones and an optional percentage readout.',
    role: 'Scroll',
    runtimeTier: 'standard',
    modules: [
      { key: 'showPercent', label: 'Percent Readout', description: 'Numeric progress next to the rail.' },
    ],
    coreControls: ['milestones', 'damping', 'glow', 'accent', 'showPercent'],
    templateSurfaces: ['website', 'dashboard'],
    templateRoles: ['scroll', 'system'],
    templatePriority: 70,
    absorbs: [],
  },
  {
    id: 'scroll-velocity-skew',
    summary: 'Scroll-velocity skew with a coupled marquee — motion that reports speed rather than decorating.',
    role: 'Scroll',
    runtimeTier: 'standard',
    coreControls: ['skewMax', 'damping', 'marqueeBase', 'accent'],
    templateSurfaces: ['website'],
    templateRoles: ['scroll'],
    templatePriority: 65,
    absorbs: [],
  },
  {
    id: 'skilltree-node-state-system',
    summary: 'Single skill-node presentation across active, available, recommended, risk and locked states.',
    role: 'System',
    runtimeTier: 'light',
    modeControl: 'state',
    modes: [
      { value: 'active', label: 'Active', description: 'Pulsing active node.', absorbs: ['skilltree-active-pulse-ring'] },
      { value: 'available', label: 'Available', description: 'Unlocked but not started.' },
      { value: 'recommended', label: 'Recommended', description: 'Focus ring drawing attention to the next step.', absorbs: ['skilltree-recommended-focus-ring'] },
      { value: 'risk', label: 'Risk', description: 'Corrupted glitch treatment for risky nodes.', absorbs: ['skilltree-corrupted-risk-glitch'] },
      { value: 'locked', label: 'Locked', description: 'Gated node with no interaction affordance.' },
    ],
    modules: [
      { key: 'showContext', label: 'Context', description: 'Label and badge around the node.' },
      { key: 'atmosphere', label: 'Atmosphere', description: 'Particle halo around the node.' },
      { key: 'showPath', label: 'Path Shadow', description: 'Incoming path stub behind the node.' },
    ],
    coreControls: ['preset', 'state', 'size', 'showContext', 'atmosphere', 'showPath'],
    templateSurfaces: ['dashboard'],
    templateRoles: ['system'],
    templatePriority: 90,
    absorbs: ['skilltree-active-pulse-ring', 'skilltree-recommended-focus-ring', 'skilltree-corrupted-risk-glitch'],
  },
  {
    id: 'skilltree-scene-system',
    summary: 'Full skilltree scene with float, constellation and forge layouts plus atmosphere, links and a locked veil.',
    role: 'System',
    runtimeTier: 'light',
    modeControl: 'mode',
    modes: [
      { value: 'float', label: 'Float', description: 'Free-floating node cloud.', absorbs: ['skilltree-floating-nodes'] },
      { value: 'constellation', label: 'Constellation', description: 'Astral constellation layout.', absorbs: ['skilltree-astral-constellation'] },
      { value: 'forge', label: 'Forge', description: 'Hard-mode forge chamber layout.', absorbs: ['skilltree-forge-chamber-hard-mode'] },
    ],
    modules: [
      { key: 'atmosphere', label: 'Atmosphere', description: 'Particle, star and ember light around the tree.', absorbs: ['skilltree-particle-atmosphere-light'], onValue: 'hybrid', offValue: 'off' },
      { key: 'links', label: 'Energy Links', description: 'SVG energy lines between nodes.', absorbs: ['skilltree-svg-energy-lines'], onValue: 'state', offValue: 'off' },
      { key: 'lockedVeil', label: 'Locked Veil', description: 'Shadow veil over gated branches.', absorbs: ['skilltree-locked-path-shadow'] },
    ],
    coreControls: ['preset', 'mode', 'nodeCount', 'atmosphere', 'links', 'lockedVeil'],
    profiles: [
      { id: 'lite', label: 'Lite', overrides: { atmosphere: 'off', links: 'state', atmosphereDensity: 0, nodeCount: 4 }, note: 'No atmosphere layer, reduced node count.' },
      { id: 'balanced', label: 'Balanced', overrides: { atmosphere: 'stars', atmosphereDensity: 16, nodeCount: 6 }, note: 'Catalog default.' },
      { id: 'cinematic', label: 'Cinematic', overrides: { atmosphere: 'hybrid', atmosphereDensity: 30, nodeCount: 6 }, note: 'Full hybrid atmosphere at maximum density.' },
    ],
    templateSurfaces: ['dashboard', 'website'],
    templateRoles: ['system', 'background'],
    templatePriority: 95,
    absorbs: ['skilltree-astral-constellation', 'skilltree-floating-nodes', 'skilltree-forge-chamber-hard-mode', 'skilltree-locked-path-shadow', 'skilltree-particle-atmosphere-light', 'skilltree-svg-energy-lines'],
  },
  {
    id: 'system-progress-feedback',
    summary: 'Progress and completion feedback in three shapes: scan sweep, ring charge and XP fill.',
    role: 'System',
    runtimeTier: 'light',
    modeControl: 'mode',
    modes: [
      { value: 'scan', label: 'Scan', description: 'Sweep that completes with a pulse.', absorbs: ['system-scan-complete-pulse'] },
      { value: 'ring', label: 'Ring', description: 'Radial charge ring.', absorbs: ['system-progress-ring-charge'] },
      { value: 'xp', label: 'XP Fill', description: 'Bar fill with a surge on completion.', absorbs: ['system-xp-fill-surge'] },
    ],
    modules: [
      { key: 'autoReplay', label: 'Auto Replay', description: 'Restarts the cycle after completion.' },
    ],
    coreControls: ['mode', 'accent', 'speed', 'target', 'autoReplay'],
    templateSurfaces: ['dashboard', 'website'],
    templateRoles: ['system'],
    templatePriority: 100,
    absorbs: ['system-scan-complete-pulse', 'system-progress-ring-charge', 'system-xp-fill-surge'],
  },
  {
    id: 'transitions-route-system',
    summary: 'Route and section transition core with wipe, masked, clip and panel-shift mechanics.',
    role: 'Transition',
    runtimeTier: 'standard',
    modeControl: 'mode',
    modes: [
      { value: 'wipe', label: 'Wipe', description: 'Smooth directional section wipe.', absorbs: ['transitions-smooth-section-wipe'] },
      { value: 'masked', label: 'Masked', description: 'Masked route change through a shape.', absorbs: ['transitions-masked-route'] },
      { value: 'clip', label: 'Clip', description: 'Clip-path reveal of the incoming view.', absorbs: ['transitions-clip-path-reveal'] },
      { value: 'panel', label: 'Panel Shift', description: 'Panels slide the old view out.', absorbs: ['transitions-panel-shift'] },
    ],
    coreControls: ['mode', 'accent', 'speed'],
    templateSurfaces: ['website', 'dashboard'],
    templateRoles: ['transition'],
    templatePriority: 100,
    absorbs: ['transitions-smooth-section-wipe', 'transitions-masked-route', 'transitions-clip-path-reveal', 'transitions-panel-shift'],
  },
];

export const CORE_CANON_BY_ID = new Map(CORE_CANON.map((core) => [core.id, core]));

/**
 * Niche presets for a core: the generated component-backed set when one exists,
 * otherwise the curated set authored above. Both carry the complete state the
 * preset picker writes into the config — the arsenal always passes every prop,
 * so relying on a component's internal `?? preset.x` fallback would not work.
 */
export function coreNichePresets(coreId: string): EffectNichePreset[] {
  const core = CORE_CANON_BY_ID.get(coreId);
  const generated = GENERATED_CORE_PRESETS[coreId];
  if (generated?.length) {
    return generated.map((preset) => ({
      id: preset.id,
      label: preset.label,
      niche: preset.niche,
      description: `Curated ${NICHE_LABELS[preset.niche]} state shipped with the core component.`,
      props: preset.props,
      performanceProfile: preset.performanceProfile,
      mobileProfile: preset.mobileProfile,
      templateSurfaces: core?.templateSurfaces,
      templateRoles: core?.templateRoles,
      templatePriority: core?.templatePriority,
      tags: [preset.niche],
    }));
  }
  return (AUTHORED_PRESETS[coreId] ?? []).map((preset) => ({
    id: `${coreId}::${preset.niche}`,
    label: NICHE_LABELS[preset.niche],
    niche: preset.niche,
    description: preset.why,
    props: preset.props,
    performanceProfile: preset.performanceProfile ?? 'balanced',
    mobileProfile: preset.mobileProfile ?? 'balanced',
    templateSurfaces: core?.templateSurfaces,
    templateRoles: core?.templateRoles,
    templatePriority: core?.templatePriority,
    tags: [preset.niche],
  }));
}

/** Cores that carry a real preset for this niche — never a tag-only match. */
export function coresForNiche(niche: NicheId): CoreCanonEntry[] {
  return CORE_CANON.filter((core) => coreNichePresets(core.id).some((preset) => preset.niche === niche));
}

export function corePresetForNiche(coreId: string, niche: NicheId): EffectNichePreset | undefined {
  return coreNichePresets(coreId).find((preset) => preset.niche === niche);
}
