import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/motion-arsenal/effects/scroll/PinnedProductStageVariants.tsx', 'utf8');
const coreSystem = readFileSync('src/motion-arsenal/effects/scroll/PinnedProductStageCoreSystem.tsx', 'utf8');
const catalog = readFileSync('src/motion-arsenal/effects/scroll/catalog.ts', 'utf8');
const manifest = JSON.parse(readFileSync('public/agent-manifests/pinned-product-stage-variants.json', 'utf8'));

for (const contract of [
  'NOX PRODUCT STAGE',
  'SCROLL TO OPERATE',
  'LIVE TELEMETRY',
  'pps-product-zone',
  'pps-reference',
  'COPY REF',
  'aria-current',
  'onPointerMove',
  'prefers-reduced-motion',
  'PRODUCT_STAGE_VARIANTS',
]) {
  assert.ok(source.includes(contract), `PinnedProductStage base contract missing: ${contract}`);
}

for (const contract of [
  'PinnedProductStageCoreSystem',
  'pcsys-switcher',
  'data-product-variant',
  'aria-pressed',
  'Revenue Reactor Core',
  'Agent Nexus Core',
  'Signal Growth Nucleus',
  'Conversion Prism',
  'Automation Kernel',
  'Command Core',
]) {
  assert.ok(coreSystem.includes(contract), `Product core system contract missing: ${contract}`);
}

const expectedVariants = [
  'nox-floating-card-os',
  'nox-revenue-os',
  'nox-scroll-story',
  'nox-global-sales-os',
  'project-x-command-center',
  'ai-growth-engine',
  'conversion-website-system',
  'automation-ops-system',
];

// `nox-scroll-story` läuft im Layout `sticky-story` und hat deshalb kein
// semantisches Kernartefakt der gepinnten Bühne — es wird weiter unten gegen
// den Sticky-Story-Vertrag geprüft.
const stickyStoryVariants = ['nox-scroll-story'];

for (const id of expectedVariants) {
  const reference = `motion:scroll-pinned-product-stage@${id}`;
  assert.ok(source.includes(reference), `Component missing stable agent reference: ${reference}`);
  assert.ok(manifest.variants.some((variant) => variant.id === id && variant.reference === reference), `Manifest missing variant: ${id}`);
  if (stickyStoryVariants.includes(id)) continue;
  assert.ok(coreSystem.includes(`data-product-variant='${id}'`), `Product core missing distinct artifact styling: ${id}`);
  assert.ok(manifest.variants.some((variant) => variant.id === id && variant.coreArtifact), `Manifest missing semantic core: ${id}`);
}

for (const semanticCore of ['REVENUE', 'NEXUS', 'SIGNAL', 'CONVERT', 'OPS', 'NOX']) {
  assert.ok(coreSystem.includes(semanticCore), `Product core semantic missing: ${semanticCore}`);
}

assert.equal(manifest.effectId, 'scroll-pinned-product-stage');
assert.equal(manifest.component, 'PinnedProductStageCoreSystem');
assert.equal(manifest.variants.length, expectedVariants.length);
assert.ok(catalog.includes("import('./PinnedProductStageCoreSystem')"), 'Catalog must load the semantic core system');
assert.ok(source.includes('sections.length'), 'Stage must derive navigation from the selected section model');
assert.ok(source.includes('scrollTo({'), 'Chapter navigation must control the internal timeline');

// Page-Scroll-Modus: die Bühne muss auf echten Webseiten im Dokumentfluss
// pinnen können, statt das Mausrad in einem eigenen Scrollport zu fangen.
for (const contract of [
  "scrollDriver = 'internal'",
  'pageDriven',
  'pps-track',
  'pps-sticky',
  'pps-copy-overlay',
  'compactScroll',
  'visualMode',
  "chrome === 'minimal'",
  'IntersectionObserver',
  'previewScrollSimulation',
]) {
  assert.ok(source.includes(contract), `Page-scroll driver contract missing: ${contract}`);
}
assert.ok(source.includes("requestedPageDriven && !previewScrollSimulation"), 'bounded previews must simulate page scroll internally');
assert.ok(
  source.includes('.pps-page .pps-shaft { position:absolute; inset:0; }'),
  'Page mode must fill the pinned stage; without it the stage collapses to zero height',
);

// Die NOX-Variante darf keine Ergebnisaussagen tragen.
const noxSlice = source.slice(source.indexOf("'nox-revenue-os': {"), source.indexOf("'nox-global-sales-os': {"));
assert.ok(noxSlice.length > 500, 'nox-revenue-os variant block not found');
for (const forbidden of ['%', '+38', 'Umsatz', 'Conversion-Rate']) {
  assert.ok(!noxSlice.includes(forbidden), `nox-revenue-os must not claim results: ${forbidden}`);
}
// Jede Stufe braucht ein sichtbares Modulset — explode 0 hiesse: kein Objekt.
assert.ok(!/,\s0,\s0\.\d+,\s'/.test(noxSlice), 'nox-revenue-os chapters must keep modules visible (explode > 0)');
assert.ok(!source.includes('fetch(') && !coreSystem.includes('fetch('), 'Effect must not make network requests');
assert.ok(!source.includes('Math.random') && !coreSystem.includes('Math.random'), 'Effect must stay deterministic');

// --- Scroll-gekoppelte Eigendrehung ----------------------------------------
// Die Drehung muss eine reine Funktion des Fortschritts sein. Ein zeitbasierter
// Term (elapsed) im Winkel würde Rückwärtsscrollen kaputt machen.
assert.ok(source.includes('progress * turns * 360 * sign'),
  'free-spin rotation must stay progress * turns * 360 * direction');
assert.ok(source.includes('(flip * readableAngle + (progress - 0.5) * stackDrift) * sign'),
  'depth-flip rotation must be readableAngle-bounded and derived from progress only');
assert.ok(/const flipPhase = timeline - sectionIndex;/.test(source),
  'depth-flip must derive its phase from the chapter timeline, not from elapsed time');
assert.ok(source.includes('rot.current.x = damp(rot.current.x, targetX, rotLambda, dt);'),
  'rotation must be damped through its own state (rotationSmoothing)');
for (const term of ['baseRotationX', 'baseRotationY', 'baseRotationZ', 'stageRotationInfluence']) {
  assert.ok(source.includes(`${term} +`) || source.includes(`${term},`) || source.includes(`clamp(${term}`),
    `rotation formula missing term: ${term}`);
}
assert.ok(!/const spin[^;]*elapsed/.test(source), 'spin must not depend on elapsed time');
assert.ok(!/target[XYZ] = [^;]*elapsed/.test(source), 'rotation targets must not depend on elapsed time');

const stageProps = catalog.slice(catalog.indexOf('props: ['), catalog.indexOf('productionSafe'));
const REQUIRED_STAGE_CONTROLS = [
  'variant', 'stage', 'autoProgress', 'pageScrollMode', 'showStepNavigation', 'showLabels', 'compactScroll',
  'scrollLength', 'scrollSmoothing', 'stageSnapStrength', 'stageTransitionDuration',
  'scrollRotationEnabled', 'rotationMode', 'readableAngle', 'stackDrift',
  'rotationAxis', 'rotationTurns', 'rotationDirection',
  'baseRotationX', 'baseRotationY', 'baseRotationZ', 'stageRotationInfluence', 'rotationSmoothing',
  'objectScale', 'objectDepth', 'perspective', 'cameraDistance', 'objectTilt', 'objectFloat', 'objectFloatSpeed',
  'glow', 'bloom', 'rimLight', 'highlightIntensity', 'shadowIntensity', 'glassOpacity', 'blurStrength',
  'backgroundIntensity', 'gridOpacity', 'ambientParticles', 'vignette', 'atmosphericGlow',
  'stageVisualIntensity', 'stageMorphStrength', 'stageColorShift', 'stageObjectSpread', 'stageSymbolScale',
  'mobileRotationTurns', 'mobileObjectScale', 'mobileEffectsQuality', 'disableRotationOnMobile',
  'reducedMotionRotation',
  'cardStyle', 'stageCardVariant', 'cardScale', 'cardTilt', 'cardFloat', 'cardFloatSpeed',
  'scrollRotationTurns', 'morphStrength', 'stageSpread', 'depth', 'showHud',
];
for (const key of REQUIRED_STAGE_CONTROLS) {
  assert.ok(stageProps.includes(`key: '${key}'`), `dashboard control missing: ${key}`);
  assert.ok(source.includes(`${key} =`) || source.includes(`${key}:`) || source.includes(`  ${key},`), `component does not accept prop: ${key}`);
}
for (const group of ['Content', 'Scroll', 'Object Rotation', 'Object Presentation', 'Floating Card OS', 'Lighting', 'Background', 'Stage Visuals', 'Mobile', 'Reduced Motion']) {
  assert.ok(stageProps.includes(`group: '${group}'`), `control group missing: ${group}`);
}

// Operator-Defaults für nox-revenue-os.
const defaultOf = (key) => {
  const match = stageProps.match(new RegExp(`key: '${key}'[^}]*?default: ([-\\d.]+|'[a-z-]+'|true|false)`));
  assert.ok(match, `no default found for ${key}`);
  return match[1].replace(/'/g, '');
};
assert.equal(defaultOf('scrollRotationEnabled'), 'true');
assert.equal(defaultOf('rotationAxis'), 'y');
assert.equal(Number(defaultOf('rotationTurns')), 0.85);
assert.equal(defaultOf('rotationDirection'), 'clockwise');
assert.equal(Number(defaultOf('rotationSmoothing')), 0.12);
assert.equal(Number(defaultOf('stageRotationInfluence')), 0.35);
assert.equal(Number(defaultOf('objectTilt')), 6);
assert.equal(Number(defaultOf('perspective')), 1100);
assert.equal(Number(defaultOf('glow')), 0.6);
assert.equal(Number(defaultOf('bloom')), 0.35);
assert.equal(Number(defaultOf('mobileRotationTurns')), 0.25);

// Depth-Flip: die beschränkte Rotationschoreografie für lesbare Tafeln.
// Der frühere freie Spin drehte das Objekt durch 90° (Kante) und 180°
// (Rückseite) — dieser Modus muss deshalb existieren, bedienbar sein und
// unterhalb der 90°-Kante bleiben.
assert.equal(defaultOf('rotationMode'), 'free-spin');
assert.equal(Number(defaultOf('readableAngle')), 55);
assert.equal(Number(defaultOf('stackDrift')), 16);
assert.ok(source.includes("export type StageRotationMode = 'free-spin' | 'depth-flip'"), 'rotation mode type missing');
assert.ok(source.includes("rotationMode === 'depth-flip'"), 'depth-flip branch missing in the rAF loop');
assert.ok(source.includes('flip * readableAngle'), 'depth-flip must bound the angle by readableAngle');
assert.ok(source.includes("rotationMode === 'depth-flip' ? 0 : timeline * (rotatePerSection - 90)"),
  'legacy drift must be disabled in depth-flip, otherwise the angle is unbounded again');

const readableAngleMax = Number(stageProps.match(/key: 'readableAngle'[^}]*?max: ([\d.]+)/)[1]);
assert.ok(readableAngleMax < 90, `readableAngle must stay below the 90° edge, got max ${readableAngleMax}`);

assert.ok(manifest.rotationModes && manifest.rotationModes['depth-flip'], 'manifest must document depth-flip');
for (const id of ['nox-floating-card-os', 'nox-revenue-os']) {
  const variant = manifest.variants.find((entry) => entry.id === id);
  assert.equal(variant.rotationMode, 'depth-flip', `readable-panel variant must default to depth-flip: ${id}`);
  assert.ok(variant.jsx.includes('rotationMode="depth-flip"'), `variant jsx must show depth-flip: ${id}`);
}

// --- Sticky Story ----------------------------------------------------------
// Das Layout darf kein Scroll-Gefängnis bauen und keinen Text am selben Platz
// austauschen: die Kapitel müssen echter, normal scrollender DOM-Content sein.
const stickyStory = readFileSync('src/motion-arsenal/effects/scroll/PinnedProductStageStickyStory.tsx', 'utf8');
for (const contract of [
  'position:sticky',
  'pss-chapter',
  'pss-story',
  'IntersectionObserver',
  'offsetTop',
  "data-layout-mode=\"sticky-story\"",
]) {
  assert.ok(stickyStory.includes(contract), `Sticky story contract missing: ${contract}`);
}
assert.ok(!/height:\s*100svh[^}]*overflow/.test(stickyStory), 'sticky story must not lock the page scroll');
assert.ok(!stickyStory.includes('useRafLoop'), 'sticky story must not run a permanent rAF loop');
assert.ok(stickyStory.includes('chapterHeight = 68'), 'chapter height default must stay below a full viewport');
assert.ok(coreSystem.includes("motionProps.layoutMode === 'sticky-story'"), 'core system must dispatch the sticky-story layout');
assert.ok(manifest.layoutModes && manifest.layoutModes['sticky-story'], 'manifest must document the sticky-story layout');

const storyProps = ['layoutMode', 'chapterHeight', 'stickyOffset', 'activeThreshold', 'panelTiltX', 'panelTiltY', 'panelDepth', 'contentTransition', 'textReveal', 'mobileStack'];
for (const key of storyProps) {
  assert.ok(stageProps.includes(`key: '${key}'`), `sticky story control missing: ${key}`);
}
assert.ok(source.includes('panelTilt?: [number, number]'), 'panelTilt must stay available as a code-level prop');

// Mobile-/Reduced-Motion-Zusagen müssen im Code stehen, nicht nur im Katalog.
assert.ok(source.includes('disableRotationOnMobile ? 0 : mobileRotationTurns'), 'mobile rotation override missing');
assert.ok(source.includes("reducedMotionRotation === 'stage-only'"), 'reduced motion rotation modes missing');

console.log(`PinnedProductStage rotation + control surface: OK (${REQUIRED_STAGE_CONTROLS.length} controls verified)`);

console.log('PinnedProductStage semantic core registry contract: OK');
