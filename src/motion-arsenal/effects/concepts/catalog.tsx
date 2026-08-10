import React from 'react';
import type { EffectEntry } from '../../types';
import { ConceptEffectPreview } from './ConceptEffectPreview';

// Tupel je Konzept: [Name, Beschreibung, technische Skizze].
// Der Typ steht explizit da, weil die Liste inzwischen leer ist — alle
// Konzepte sind in echte Komponenten ueberfuehrt. Ohne die Annotation waere
// das leere Array `never[]` und die Auswertung unten wuerde nicht mehr
// typpruefen. Neue Konzepte koennen hier unveraendert wieder eingetragen
// werden.
type ConceptEntry = readonly [name: string, description: string, technicalBasis: string];

const entries: readonly ConceptEntry[] = [];

const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

/** Provenance for concepts intentionally removed from the visible gallery after consolidation. */
export const CONSOLIDATED_CONCEPTS: Record<string, string> = {
  'Magnetic Field Cards': 'cursor-magnetic-cta',
  'Warp Tunnel Depth': 'bg-nox-starfield-drift (Variante section-warp)',
  'CRT Screen Text': 'system-crt-screen-text',
  'Cube Spin Route Transition': 'transitions-cube-spin-route-transition',
  'Distorted Button Image Reveal': 'originkit-distorted-button-image-reveal',
  'Dynamic Palette Gradient': 'bg-dynamic-palette-gradient',
  'Dynamic Tooltip Fragments': 'overlays-dynamic-tooltip-fragments',
  'Frame Repeat Image Transition': 'transitions-frame-repeat-image-transition',
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
