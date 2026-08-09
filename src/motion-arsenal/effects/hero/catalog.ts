import { lazy } from 'react';
import type { EffectEntry } from '../../types';

// ---------------------------------------------------------------------------
// HERO_CATALOG — Hero-/Entrance-Effekte des NOX Motion Arsenal v2.
// Alle Einträge sind NOX-Eigenbauten nach Referenz-Mechanik (nox-adapted).
// ---------------------------------------------------------------------------

export const HERO_CATALOG: EffectEntry[] = [
  {
    meta: {
      id: 'hero-massive-typography-reveal',
      name: 'Massive Typography Reveal',
      category: 'hero',
      sourceWebsite: 'shopify-editions',
      sourceFiles: [
        'body_html.ts — Nav-Entrance-Cascade (animation-delay 500ms + 100ms-Steps, -translate-y-full opacity-0 → 0/1, motion-safe:)',
        'shopify.css — mask-/clip-Reveal-Technik (46 mask-Refs)',
      ],
      mode: 'nox-adapted',
      complexity: 'low',
      dependencies: [],
      bestFor: ['Hero-Headline beim Seiteneinstieg', 'Section-Openings mit Statement-Typo', 'Landingpage Above-the-fold'],
      performanceNotes:
        'Nur transform/letter-spacing-Keyframes auf wenigen Zeilen; letter-spacing-Settle verursacht kurze Reflows, aber nur ~0.9s pro Replay. Kein Canvas, kein rAF.',
      mobileNotes: 'clamp()-Typo skaliert bis 30px runter; Stagger wirkt auch bei kleinen Viewports. Touch: reine Entrance, keine Interaktion nötig.',
      reducedMotionNotes: 'Zeilen stehen sofort im End-Zustand (Weight 800, enges Tracking), Underline voll ausgefahren, kein Replay-Loop.',
      description:
        'Riesige Display-Typografie: jede Zeile ist per overflow-clip maskiert und slidet gestaffelt mit outExpo herauf; danach settlet die Typo sichtbar von leichtem Weight/Tracking in den finalen Zustand — der Shopify-Cascade-Rhythmus als NOX-Statement-Hero.',
      importPath: '@/motion-arsenal/effects/hero/MassiveTypographyReveal',
      usageJsx: '<MassiveTypographyReveal lines={["FORGE", "THE", "SIGNAL"]} speed={1} stagger={0.14} accent="#C93030" loop />',
      props: [
        { key: 'speed', label: 'Speed', type: 'range', default: 1, min: 0.4, max: 2, step: 0.1 },
        { key: 'stagger', label: 'Line Stagger (s)', type: 'range', default: 0.14, min: 0.05, max: 0.4, step: 0.01 },
        { key: 'accent', label: 'Accent', type: 'color', default: '#C93030' },
        { key: 'loop', label: 'Loop Replay', type: 'boolean', default: true },
      ],
      productionSafe: true,
    },
    Component: lazy(() => import('./MassiveTypographyReveal')),
  },
  {
    meta: {
      id: 'hero-masked-text-reveal',
      name: 'Masked Text Reveal',
      category: 'hero',
      sourceWebsite: 'shopify-editions',
      sourceFiles: [
        'shopify.css — mask-image: linear-gradient(to right, transparent, black 20%, black 80%, transparent) (46 mask-Refs)',
        'shopify.css — slideIn 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
      ],
      mode: 'nox-adapted',
      complexity: 'low',
      dependencies: [],
      bestFor: ['Hero-Subline / Statement-Sätze', 'Zitat- und Claim-Sektionen', 'Feature-Intro-Texte'],
      performanceNotes:
        'mask-position + transform in Keyframes, GPU-freundlich; pro Wort zwei Textknoten (Reveal + Ember-Edge). Bei sehr langen Texten (>25 Wörter) Stagger reduzieren.',
      mobileNotes: 'Wortweise Reveals brechen sauber um (inline-block pro Wort); Schriftgröße clamp()-basiert.',
      reducedMotionNotes: 'Kein mask-image, kein Slide — Text steht sofort vollständig und ruhig da.',
      description:
        'Text-Reveal über ein wanderndes linear-gradient mask-image: eine weiche Licht-Kante wischt Wort für Wort über den Satz (Shopify-Editions-Pattern, exaktes 1.2s-outBack-Timing), mit leichter per-Wort-Verzögerung und einer schmalen Ember-Leading-Edge vor der Wipe-Front.',
      importPath: '@/motion-arsenal/effects/hero/MaskedTextReveal',
      usageJsx: '<MaskedTextReveal text="SIGNAL OVER NOISE — THE NOX SYSTEM IS ONLINE" speed={1} stagger={0.09} loop />',
      props: [
        { key: 'speed', label: 'Speed', type: 'range', default: 1, min: 0.4, max: 2, step: 0.1 },
        { key: 'stagger', label: 'Word Stagger (s)', type: 'range', default: 0.09, min: 0.02, max: 0.25, step: 0.01 },
        { key: 'textColor', label: 'Text', type: 'color', default: '#f0ece4' },
        { key: 'accent', label: 'Edge Accent', type: 'color', default: '#ff4d4d' },
        { key: 'loop', label: 'Loop Replay', type: 'boolean', default: true },
      ],
      productionSafe: true,
    },
    Component: lazy(() => import('./MaskedTextReveal')),
  },
  {
    meta: {
      id: 'hero-image-reveal-behind-text',
      name: 'Image Reveal Behind Text',
      category: 'hero',
      sourceWebsite: 'shopify-editions',
      sourceFiles: [
        'shopify.css — Mask-Image-Reveal-Mechanik (46 mask-Refs) als Reveal-Grundlage',
        'KRANK hoisted.js — Cursor-Klasse: lerp-Follow (α≈0.1–0.3) für die Pointer-Physik des Spotlights',
      ],
      mode: 'nox-adapted',
      complexity: 'medium',
      dependencies: [],
      bestFor: ['Hero mit Marken-Wordmark', 'Portfolio-/Case-Openings', 'Interaktive Section-Header'],
      performanceNotes:
        'Ein rAF-Loop schreibt nur zwei CSS-Vars (--irb-x/--irb-y); mask-image mit var()-Position wird per Compositor aktualisiert. Gradient-„Bild" ist rein prozedural, kein Asset-Load.',
      mobileNotes: 'Ohne Pointer greift der Auto-Sweep — der Effekt lebt auch auf Touch. Radius ggf. auf ~100px reduzieren.',
      reducedMotionNotes: 'Mask entfällt komplett: die Gradient-Füllung steht voll sichtbar in den Glyphen, kein Sweep, kein Drift.',
      description:
        'Große Outline-Typo, dahinter ein prozedurales Gradient-„Bild" (conic + radiale Ember-/Gold-Felder), das per background-clip:text IN den Buchstaben liegt und von einem gedämpften Pointer-Spotlight (oder Auto-Sweep) per radialem mask aufgedeckt wird.',
      importPath: '@/motion-arsenal/effects/hero/ImageRevealBehindText',
      usageJsx: '<ImageRevealBehindText text="NOX FORGE" revealRadius={150} sweepSpeed={1} palette="ember" autoSweep />',
      props: [
        { key: 'revealRadius', label: 'Reveal Radius (px)', type: 'range', default: 150, min: 60, max: 280, step: 5 },
        { key: 'sweepSpeed', label: 'Sweep Speed', type: 'range', default: 1, min: 0.3, max: 2.5, step: 0.1 },
        { key: 'palette', label: 'Palette', type: 'select', default: 'ember', options: ['ember', 'gold', 'mono'] },
        { key: 'autoSweep', label: 'Auto Sweep', type: 'boolean', default: true },
      ],
      productionSafe: true,
    },
    Component: lazy(() => import('./ImageRevealBehindText')),
  },
  {
    meta: {
      id: 'hero-blur-to-sharp-boot',
      name: 'Blur-to-Sharp Hero Boot',
      category: 'hero',
      sourceWebsite: 'krank-lusion',
      sourceFiles: [
        'KRANK index.css — Filter-Chain via CSS-Var: filter: saturate(calc(.4 + var(--pulse)*1.6)) brightness(calc(.6 + var(--pulse)*.6))',
        'KRANK hoisted.js — eine Physik-Quelle treibt CSS-Custom-Props + Uniforms gleichzeitig (Layering-Kapitel)',
      ],
      mode: 'nox-adapted',
      complexity: 'medium',
      dependencies: [],
      bestFor: ['Seiten-Einstieg / First Paint-Moment', 'Systemstart-/Dashboard-Intros', 'Kampagnen-Hero mit Boot-Dramaturgie'],
      performanceNotes:
        'Ein rAF-Loop schreibt eine einzige CSS-Var, die die komplette filter-Kette (blur/brightness/saturate/contrast) treibt. blur auf großem Container ist der teuerste Teil — maxBlur > 30px auf Low-End vermeiden.',
      mobileNotes: 'Funktioniert ohne Interaktion; maxBlur auf Mobile eher 12–16px für flüssiges Boot.',
      reducedMotionNotes: 'Kein rAF, keine Filter: Hero steht sofort scharf und korrekt belichtet, Scanline/Schleier werden nicht gerendert.',
      description:
        'Der Hero bootet aus Unschärfe + Überbelichtung in die Schärfe: JS animiert eine CSS-Var (KRANKs --pulse-Pattern), die eine choreografierte filter-Kette aus blur, brightness, saturate und contrast treibt — synchron dazu läuft ein kurzer Scanline-Blitz durch das Bild.',
      importPath: '@/motion-arsenal/effects/hero/BlurToSharpHeroBoot',
      usageJsx: '<BlurToSharpHeroBoot speed={1} maxBlur={22} overexposure={1} accent="#ff4d4d" loop />',
      props: [
        { key: 'speed', label: 'Boot Speed', type: 'range', default: 1, min: 0.3, max: 2.5, step: 0.1 },
        { key: 'maxBlur', label: 'Max Blur (px)', type: 'range', default: 22, min: 6, max: 40, step: 1 },
        { key: 'overexposure', label: 'Overexposure', type: 'range', default: 1, min: 0, max: 2, step: 0.1 },
        { key: 'accent', label: 'Scanline', type: 'color', default: '#ff4d4d' },
        { key: 'loop', label: 'Loop Re-Boot', type: 'boolean', default: true },
      ],
      productionSafe: true,
    },
    Component: lazy(() => import('./BlurToSharpHeroBoot')),
  },
  {
    meta: {
      id: 'hero-split-entrance',
      name: 'Split Hero Entrance',
      category: 'hero',
      sourceWebsite: 'krank-lusion',
      sourceFiles: [
        'KRANK index.css — Overshoot-Easing cubic-bezier(.3, 0, .66, -.3) auf 500ms-Transforms (Kontrollpunkt unter 0 → elastischer Bounce-Back)',
      ],
      mode: 'nox-adapted',
      complexity: 'low',
      dependencies: [],
      bestFor: ['Mehrspaltige Hero-Layouts', 'Split-Screen-Landingpages', 'Editorial-/Kampagnen-Openings'],
      performanceNotes: 'Nur transform-Keyframes auf 2–3 Panels + kurze Edge-Sweeps; komplett Compositor-freundlich, kein rAF.',
      mobileNotes: 'Panels bleiben vertikale Spalten (flex) — bei sehr schmalen Screens 2 Panels wählen.',
      reducedMotionNotes: 'Panels stehen angedockt, Inhalte voll sichtbar, kein Sweep, kein Replay.',
      description:
        'Der Hero ist in 2–3 vertikale Panels geteilt, die gestaffelt aus entgegengesetzten Richtungen einfahren und mit dem KRANK-Overshoot-Bezier elastisch andocken — direkt nach dem Dock läuft ein Licht-Sweep die Panel-Kanten entlang.',
      importPath: '@/motion-arsenal/effects/hero/SplitHeroEntrance',
      usageJsx: '<SplitHeroEntrance panels={3} speed={1} accent="#C93030" sweep loop />',
      props: [
        { key: 'panels', label: 'Panels', type: 'range', default: 3, min: 2, max: 3, step: 1 },
        { key: 'speed', label: 'Speed', type: 'range', default: 1, min: 0.4, max: 2, step: 0.1 },
        { key: 'accent', label: 'Accent', type: 'color', default: '#C93030' },
        { key: 'sweep', label: 'Edge Sweep', type: 'boolean', default: true },
        { key: 'loop', label: 'Loop Replay', type: 'boolean', default: true },
      ],
      productionSafe: true,
    },
    Component: lazy(() => import('./SplitHeroEntrance')),
  },
  {
    meta: {
      id: 'hero-word-letter-cascade',
      name: 'Word Letter Cascade',
      category: 'hero',
      sourceWebsite: 'shopify-editions',
      sourceFiles: [
        'Butterflies-CFpdR9tM.js:307-390 — 3 überlagerte Sinuswellen: wave = sin(t*flapSpeed+phase)*amp + sin(t*2.1+…)*0.2 + sin(t*0.37+…)*0.3',
        'body_html.ts — Nav-Entrance-Cascade (Stagger-Grundmuster)',
      ],
      mode: 'nox-adapted',
      complexity: 'medium',
      dependencies: [],
      bestFor: ['Hero-Claims mit organischem Timing', 'Poetische/editoriale Openings', 'Wortmarken-Inszenierung'],
      performanceNotes:
        'Ein Keyframe pro Buchstabe (transform + filter:blur); Delays sind vorberechnet (deterministisch, seededRandom). Bei >60 Buchstaben blur ggf. rausnehmen.',
      mobileNotes: 'Wörter sind nowrap-Gruppen und brechen sauber um; Kaskade wirkt auf kleinen Screens durch die Wellen-Delays besonders.',
      reducedMotionNotes: 'Alle Buchstaben stehen sofort aufrecht, scharf und voll deckend — keine Kaskade, kein Replay.',
      description:
        'Buchstaben-Kaskade mit per-Letter rotation/translateY/blur — die Einsatz-Delays folgen keinem linearen Stagger, sondern drei überlagerten Sinus-Phasen (Shopify-Butterfly-Wave), wodurch die Welle organisch und nie mechanisch durch den Satz läuft; die Welle moduliert zugleich die Einfall-Rotation jedes Buchstabens.',
      importPath: '@/motion-arsenal/effects/hero/WordLetterCascade',
      usageJsx: '<WordLetterCascade text="SIGNAL FORGED IN THE DARK" speed={1} waviness={1} rotation={14} loop />',
      props: [
        { key: 'speed', label: 'Speed', type: 'range', default: 1, min: 0.4, max: 2, step: 0.1 },
        { key: 'waviness', label: 'Waviness', type: 'range', default: 1, min: 0, max: 2, step: 0.1 },
        { key: 'rotation', label: 'Letter Rotation (°)', type: 'range', default: 14, min: 0, max: 40, step: 1 },
        { key: 'color', label: 'Text', type: 'color', default: '#f0ece4' },
        { key: 'seed', label: 'Wave Seed', type: 'range', default: 5, min: 1, max: 20, step: 1 },
        { key: 'loop', label: 'Loop Replay', type: 'boolean', default: true },
      ],
      productionSafe: true,
    },
    Component: lazy(() => import('./WordLetterCascade')),
  },
  {
    meta: {
      id: 'hero-object-float',
      name: 'Hero Object Float Lab',
      category: 'hero',
      sourceWebsite: 'nox-original',
      sourceFiles: [
        'HeroObjectFloat.tsx — damped pointer tilt, three-wave flight and impact physics',
        'heroObjectFloatObjects.tsx — five semantic CSS-3D product geometries',
      ],
      mode: 'nox-adapted',
      complexity: 'high',
      dependencies: [],
      bestFor: ['Produkt-/Artefakt-Hero', 'Agenten-/Systemprodukt-Inszenierung', 'High-Ticket-Angebotsvisualisierung'],
      performanceNotes:
        'Ein rAF-Loop schreibt ausschließlich Transform-, Schatten- und CSS-Variablen. Die fünf Objekte bestehen aus DOM/SVG/CSS-3D; kein WebGL, keine Textur-Uploads und keine Runtime-Requests.',
      mobileNotes: 'Ohne Hover übernimmt die autonome Drei-Wellen-Bewegung. Tap löst den Impuls aus; Objekt und UI skalieren responsiv.',
      reducedMotionNotes: 'Objekt steht ruhig in Neutralposition; Orbit-, Scan-, Pulse- und Field-Animationen sind deaktiviert.',
      description:
        'Ein vollständiges Hero-Object-Labor mit fünf semantisch unterschiedlichen Produktartefakten: Obsidian Relic, Agent Nexus Cube, Revenue Prism, Automation Kernel und Signal Orb. Magnetischer Pointer-Tilt, Tiefen-Parallax, gekoppelte Schattenphysik, Orbit-Satelliten und Tap-Impulse reagieren je nach CALM/CHARGED/OVERDRIVE-Zustand.',
      importPath: '@/motion-arsenal/effects/hero/HeroObjectFloat',
      usageJsx: '<HeroObjectFloat variant="project-x-nexus-cube" energy="overdrive" showVariantSwitcher={false} showEnergySwitcher={false} />',
      props: [
        { key: 'variant', label: 'Object Variant', type: 'select', default: 'forge-obsidian-relic', options: ['nox-floating-card-os', 'forge-obsidian-relic', 'project-x-nexus-cube', 'revenue-ascension-prism', 'automation-kernel-chip', 'signal-resonance-orb'], group: 'Object' },
        { key: 'energy', label: 'Energy', type: 'select', default: 'charged', options: ['calm', 'charged', 'overdrive'], group: 'Object' },
        { key: 'objectScale', label: 'Object Scale', type: 'range', default: 1, min: 0.7, max: 1.3, step: 0.05, group: 'Object' },
        { key: 'amplitude', label: 'Float Amplitude', type: 'range', default: 18, min: 4, max: 42, step: 1, group: 'Motion' },
        { key: 'speed', label: 'Speed', type: 'range', default: 1, min: 0.3, max: 2.5, step: 0.1, group: 'Motion' },
        { key: 'tilt', label: 'Tilt Strength', type: 'range', default: 1, min: 0, max: 2, step: 0.1, group: 'Motion' },
        { key: 'depth', label: 'Depth', type: 'range', default: 1, min: 0, max: 2, step: 0.1, group: 'Motion' },
        { key: 'orbit', label: 'Orbit System', type: 'boolean', default: true, group: 'Layers' },
        { key: 'accent', label: 'Accent Override', type: 'color', default: '#ff553d', group: 'Color' },
        { key: 'seed', label: 'Deterministic Seed', type: 'range', default: 9, min: 1, max: 20, step: 1, group: 'Object' },
        { key: 'showVariantSwitcher', label: 'Variant Switcher', type: 'boolean', default: true, group: 'Preview' },
        { key: 'showEnergySwitcher', label: 'Energy Switcher', type: 'boolean', default: true, group: 'Preview' },
      ],
      productionSafe: true,
      clickToRun: true,
      fullBleed: true,
    },
    Component: lazy(() => import('./HeroObjectFloat')),
  },
  {
    meta: {
      id: 'hero-pointer-text-depth',
      name: 'Pointer Text Depth',
      category: 'hero',
      sourceWebsite: 'nox-original',
      sourceFiles: [
        'PointerTextDepth.tsx — damped pointer tilt (Lusion-Lambda 5.5–20), per-letter deterministic depth factors via seededRandom, CSS-var driven rotateX/rotateY/translateZ',
        'Referenz-Mechanik: „3D text effect – mousemove" (Dennis Garrn, CodePen, via codemyui.com/3d-text-animation-on-hover-2/) — eigene NOX-Variante',
      ],
      mode: 'nox-adapted',
      complexity: 'medium',
      dependencies: [],
      bestFor: ['Hero-Headlines mit Tiefen-Interaktion', 'Statement-Typo über dem Fold', 'Produkt-/Marken-Wordmarks mit Pointer-Parallax'],
      performanceNotes:
        'Ein rAF-Loop (nur bei inView && !reduced) schreibt 3 CSS-Vars aufs Root; die per-Letter-Transforms werden vom Compositor verarbeitet (will-change: transform). Deterministische Faktoren via seeded PRNG, keine Allokationen pro Frame.',
      mobileNotes: 'Ohne Pointer bleiben die Buchstaben in Neutralposition — Entrance (Blur-Rise-Stagger) und Gold-Sheen laufen trotzdem; kein Touch-Konflikt, da keine Klick-Handler.',
      reducedMotionNotes: 'Kein rAF, keine Entrance-Animation, keine 3D-Transforms: Die Typo steht sofort flach, voll deckend und scharf im Endzustand; Media-Query deaktiviert zusätzlich Sheen/Animationen.',
      description:
        'Große Display-Typo mit echter 3D-Tiefe: Jeder Buchstabe hat einen deterministischen Tiefen-Faktor und kippt/schwebt mit gedämpftem Pointer-Follow (rotateX/rotateY/translateZ per CSS-Vars). Gold-Gradient-Füllung mit langsamem Sheen-Drift und Blur-Rise-Entrance-Stagger.',
      importPath: '@/motion-arsenal/effects/hero/PointerTextDepth',
      usageJsx: '<PointerTextDepth text="NOX FORGE" depth={1} speed={1} glow seed={7} />',
      props: [
        { key: 'text', label: 'Text', type: 'text', default: 'NOX FORGE' },
        { key: 'depth', label: 'Depth', type: 'range', default: 1, min: 0, max: 2, step: 0.1 },
        { key: 'speed', label: 'Speed', type: 'range', default: 1, min: 0.1, max: 3, step: 0.1 },
        { key: 'color', label: 'Gold', type: 'color', default: '#d4a24a' },
        { key: 'glow', label: 'Glow', type: 'boolean', default: true },
        { key: 'seed', label: 'Seed', type: 'range', default: 7, min: 1, max: 20, step: 1 },
      ],
      productionSafe: true,
    },
    Component: lazy(() => import('./PointerTextDepth')),
  },
  {
    meta: {
      id: 'hero-angled-gold-strike',
      name: 'Angled Gold Strikethrough',
      category: 'hero',
      sourceWebsite: 'nox-original',
      sourceFiles: [
        'AngledGoldStrike.tsx — pure CSS transition/scaleX-Keyframes, Strike zeichnet sich schräg über die Zeile (translateY-Sweep + scaleX), Multi-Line-Stagger deterministisch pro Index',
        'Referenz-Mechanik: „Bottom-to-Top Angled Text Strikethrough Effect in Pure CSS" (codemyui.com/bottom-to-top-angled-text-strikethrough-effect-in-pure-css/) — eigene NOX-Variante',
      ],
      mode: 'nox-adapted',
      complexity: 'low',
      dependencies: [],
      bestFor: ['Ausgehakte/veraltete Preise oder Claims', 'Hero-Subline-Markierungen', 'Editoriale Akzentzeilen mit Gold-Signatur'],
      performanceNotes:
        'Komplett CSS-only: transition/scaleX-Keyframes auf transform — Compositor-freundlich, kein rAF, kein JS pro Frame. Multi-Line-Stagger nur über animation-delay/transition-delay.',
      mobileNotes: 'Hover greift per :hover und :focus-visible; Touch-Nutzer steuern den Strike über die struck-Prop (controlled) oder sehen den Auto-Sweep (trigger="auto").',
      reducedMotionNotes: 'Keine Transition, keine Sweep-Animation: Der Strike ist nur sichtbar, wenn er kontrolliert gestrichen ist (struck-Prop) — als statische Gold-Linie; Media-Query deaktiviert animation/transition zusätzlich.',
      description:
        'Schräger Gold-Durchstrich (Winkel -20..20°, Gold-Gradient mit Glow-Kante), der bei Hover/Fokus oder als Auto-Sweep-Loop über die Zeile wischt — bottom-to-top-Sweep mit scaleX-Draw, Multi-Line-Stagger und kontrollierbarer struck-Prop für dauerhaft gestrichene Zustände.',
      importPath: '@/motion-arsenal/effects/hero/AngledGoldStrike',
      usageJsx: '<AngledGoldStrike lines={["NOX MOTION ARSENAL", "SIGNAL OVER NOISE"]} angle={-7} trigger="hover" />',
      props: [
        { key: 'color', label: 'Gold', type: 'color', default: '#d4a24a' },
        { key: 'angle', label: 'Angle (°)', type: 'range', default: -7, min: -20, max: 20, step: 1 },
        { key: 'thickness', label: 'Thickness (px)', type: 'range', default: 3, min: 1, max: 8, step: 1 },
        { key: 'speed', label: 'Speed', type: 'range', default: 1, min: 0.1, max: 3, step: 0.1 },
        { key: 'trigger', label: 'Trigger', type: 'select', default: 'hover', options: ['hover', 'auto'] },
        { key: 'struck', label: 'Struck', type: 'boolean', default: false },
      ],
      productionSafe: true,
    },
    Component: lazy(() => import('./AngledGoldStrike')),
  },
];
