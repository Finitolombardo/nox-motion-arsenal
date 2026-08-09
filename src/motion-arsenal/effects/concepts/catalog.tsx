import React from 'react';
import type { EffectEntry } from '../../types';
import { ConceptEffectPreview } from './ConceptEffectPreview';

const entries = [
  ['Bayer Dither Dissolve', 'Bayer-geditherter Abschnittswechsel mit Gold-Kante.', 'Canvas ImageData auf reduzierter Auflösung.'],
  ['Inverse Glow Cursor', 'Invertierter Cursor-Spot mit nachziehendem Akzent-Ring.', 'CSS mix-blend-mode und transform-only rAF.'],
  ['Lenticular Tilt', 'Interlaced Multi-Frame-Bild reagiert auf Tilt und Pointer.', 'WebGL Textur-Slices.'],
  ['Elastic Lag Grid', 'Gestaffeltes Grid folgt der Scrolltiefe mit elastischem Lag.', 'CSS Vars und transform-only rAF.'],
  ['Glyph Matrix Rain', 'Deterministischer Glyphen-Regen als Terminal-Textur.', 'Canvas-Spalten mit PRNG.'],
  ['Kinetic Twist Typo', 'Drehende Display-Typografie für große Marken-Statements.', 'SVG-Skeleton, optionaler Shader.'],
  ['Path-Follow Hero Scroll', 'Hero folgt einer SVG-Kurve durch die Scroll-Choreografie.', 'SVG path lookup und transforms.'],
  ['Progressive Blur Stack', 'Fokus-Stack mit abgestuften Blur- und Opacity-Ebenen.', 'CSS @property und backdrop-filter.'],
  ['Magnetic Field Cards', 'Karten ziehen sich in einem begrenzten Feld zum Cursor.', 'Distanz-basierte Transform-Offsets.'],
  ['Scroll-Synced Typo Background', 'Große Marken-Typografie rotiert subtil mit der Scrolltiefe.', 'CSS Scroll-Driven Animations mit Fallback.'],
  ['Aurora Borealis Background', 'Ruhige, goldgesäumte Gradient-Atmosphäre ohne Canvas.', 'Transform-animierte Gradient-Blobs.'],
  ['Scroll-Driven CSS Reveal', 'Progressive In-View-Reveals mit nativen Scroll-Timelines.', 'animation-timeline: view() und IO Fallback.'],
  ['Lenticular Scroll Image', 'Scroll-synchroner Interlace-Wechsel durch vorbereitete Bildframes.', 'Sprite-Strip und CSS-Maske.'],
  ['Backdrop Blur Grain Overlay', 'Material-Overlay aus Backdrop Blur, Grain und Goldkante.', 'backdrop-filter mit statischem SVG-Grain.'],
  ['View Transition API Cross-Fade', 'Dunkelraum-optimierter nativer Crossfade für DOM-Zustände.', 'document.startViewTransition mit Fallback.'],
  ['GSAP Flip Gallery Morph', 'Galerie-Kachel wächst per FLIP in den Detail-View.', 'FLIP transforms mit Fokus-Dialog-Fallback.'],
  ['Holographic Type Effect', 'Irideszente Gold-Typografie mit kontrollierter Lichtmaske.', 'background-clip und CSS masks.'],
  ['Dithered Data Heatmap', 'Dichtebasierte Heatmap im Bayer-Print-Look.', 'DOM-Zellen mit SVG Pattern.'],
  ['Infinite Parallax Loop', 'Entkoppelter Endlos-Loop mit Parallax-Faktoren.', 'GSAP Observer Proxy-Scroll.'],
  ['Grid Blind Mask Reveal', 'Gestaffelte Grid-Maske legt die neue Ebene frei.', 'SVG Mask mit deterministischem Stagger.'],
  ['Polaroid Stack Scroll', 'Gestreute Polaroids ordnen sich zu einem Stack.', 'Transform-, blur- und opacity-Scrub.'],
  ['Horizontal Pin Gallery', 'Gepinnte horizontale Bilderstrecke mit Fortschrittsrail.', 'ScrollTrigger pin/scrub mit vertikalem Fallback.'],
  ['Layered Zoom Dolly', 'Mehrere 2D-Ebenen erzeugen eine räumliche Kamerafahrt.', 'CSS perspective und translateZ.'],
  ['SVG Metric Graph Draw', 'Eine Kennzahlenkurve zeichnet sich beim Scrollen.', 'SVG stroke-dashoffset.'],
  ['Tumbler Vault OTP', 'Mechanische OTP-Eingabe mit rollenden Ziffern.', 'CSS transform-Räder, Paste und Keyboard Support.'],
  ['Peel Reveal Modal', 'Eine aufrollende Ecke enthüllt einen Dialog.', 'Gradient-Curl und CSS transforms.'],
  ['Canvas Line Typography', 'Linien-Ornamente bilden eine technische Marken-Wordmark.', 'Canvas einmalig bei Mount und Resize.'],
  ['Squiggly Distortion Text', 'Feine SVG-Displacement-Wellen beleben Headlines.', 'feTurbulence und feDisplacementMap.'],
  ['Dotted World Map Connect', 'Dekorative Punktkarte mit animierten Verbindungspfaden.', 'Vorgerendertes SVG-Punktfeld und CSS Arcs.'],
] as const;

const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

/** Provenance for concepts intentionally removed from the visible gallery after consolidation. */
export const CONSOLIDATED_CONCEPTS: Partial<Record<(typeof entries)[number][0], string>> = {
  'Magnetic Field Cards': 'cursor-magnetic-cta',
};

export const CONCEPTS_CATALOG: EffectEntry[] = entries
  .filter(([name]) => !CONSOLIDATED_CONCEPTS[name])
  .map(([name, description, technicalBasis], tone) => ({
    meta: {
      id: `concept-${slug(name)}`,
      name: name.replace(/[^A-Za-z0-9]/g, ''),
      displayName: name,
      category: 'concepts',
      sourceWebsite: 'nox-original',
      sourceFiles: [`NOX-Arsenal_Neue-Effekte_2026-08-01-02.zip / Effekte/${name}.md`],
      mode: 'nox-concept',
      complexity: technicalBasis.includes('WebGL') || technicalBasis.includes('GSAP') ? 'high' : 'medium',
      dependencies: [],
      bestFor: ['Experimentelle Motion- und Interaktionsprototypen'],
      performanceNotes: 'Interaktive Prototyp-Preview: Produktions-Performance noch nicht validiert.',
      mobileNotes: 'Mobile-Verhalten vor Produktion separat verifizieren.',
      reducedMotionNotes: 'Statische, vollständig lesbare Endansicht ist vorgesehen.',
      description,
      technicalBasis,
      importPath: '@/motion-arsenal/effects/concepts',
      usageJsx: `<${name.replace(/[^A-Za-z0-9]/g, '')} />`,
      props: [],
      updatedAt: '2026-08-02T10:09:00.000Z',
      improvementStatus: 'needs-review',
      improvementVersion: '0.1.0',
      productionSafe: false,
      status: 'experimental',
    },
    Component: () => <ConceptEffectPreview kind={slug(name)} name={name} tone={tone} />,
  }));
