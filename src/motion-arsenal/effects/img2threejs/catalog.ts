import { lazy } from 'react';
import type { EffectEntry } from '../../types';

// Assets rebuilt from a reference image via img2threejs (github.com/hoainho/
// img2threejs, Apache-2.0) — an agent-vision pipeline, not an ML mesh model:
// the agent inspects the reference, authors an ObjectSculptSpec (component
// hierarchy, materials, attachment contracts), and the skill's scripts
// generate a real, editable Three.js factory from it, gated pass-by-pass
// against a screenshot comparison. Output is genuine THREE.Group-producing
// TypeScript — not a binary GLB — which is why these effects also expose a
// "DOWNLOAD .GLB" button (via THREE.GLTFExporter) for anyone who wants an
// reusable procedural asset elsewhere.
export const IMG2THREEJS_CATALOG: EffectEntry[] = [
  {
    meta: {
      id: 'img2threejs-nox-orbital-station',
      name: 'NoxOrbitalStation',
      category: 'img2threejs',
      sourceWebsite: 'img2threejs',
      sourceFiles: [
        'github.com/hoainho/img2threejs — forge/stage2_spec + forge/stage3_build pipeline',
        'docs/PROVENANCE.md (public provenance and rights classification)',
      ],
      mode: 'nox-adapted',
      complexity: 'heavy',
      dependencies: ['three'],
      bestFor: ['Hero-Centerpiece', 'Produkt-/Asset-Showcase', 'Beweis: Bild → echtes 3D-Objekt'],
      performanceNotes: 'Echtes three.js: 16 Komponenten (Spine-Stack, Hub, 4 Solar-Arme, Dish+Boom, Docking-Node), OrbitControls fürs Drag-Rotieren, GLTFExporter für echten .glb-Download.',
      mobileNotes: 'OrbitControls unterstützen Touch-Drag nativ.',
      reducedMotionNotes: 'Auto-Rotate pausiert, Objekt steht still, Drag-Orbit bleibt möglich.',
      description:
        'Aus einem einzelnen Referenzbild (NOX-Orbitalstation-Render) über die img2threejs-Skill rekonstruiert: Agent-Vision liest das Bild, Python-Scripts erzwingen eine echte Spec (Komponenten, Attachments, Materialien), daraus generiert eine deterministische Pipeline den Three.js-Code — kein ML-Mesh, kein Photogrammetrie-Blob. Aktuell Blockout-Pass: Silhouette und Hierarchie stimmen (Spine, Hub, X-Solar-Arme, Dish, Docking-Node), Materialien sind noch Platzhalter. "DOWNLOAD .GLB" exportiert die Szene als echte Datei.',
      importPath: '@/motion-arsenal/effects/img2threejs/NoxOrbitalStation',
      usageJsx: '<NoxOrbitalStation lighting="neutral" spinDirection="clockwise" spinSpeed={0.6} />',
      props: [
        { key: 'lighting', label: 'Lighting', type: 'select', default: 'neutral', options: ['neutral', 'grazing', 'reference'], group: 'Look' },
        { key: 'exposure', label: 'Exposure', type: 'range', default: 1.1, min: 0.4, max: 2, step: 0.05, group: 'Look' },
        { key: 'backgroundColor', label: 'Background', type: 'color', default: '#05060a', group: 'Look' },
        { key: 'spinDirection', label: 'Spin Direction', type: 'select', default: 'clockwise', options: ['clockwise', 'counter-clockwise'], group: 'Motion' },
        { key: 'spinSpeed', label: 'Spin Speed', type: 'range', default: 0.6, min: 0, max: 3, step: 0.1, group: 'Motion' },
        { key: 'azimuth', label: 'Camera Azimuth', type: 'range', default: 12, min: -180, max: 180, step: 5, group: 'Camera' },
        { key: 'elevation', label: 'Camera Elevation', type: 'range', default: 8, min: -60, max: 60, step: 2, group: 'Camera' },
        { key: 'margin', label: 'Camera Distance', type: 'range', default: 1.3, min: 1, max: 2.5, step: 0.05, group: 'Camera' },
      ],
      improvementStatus: 'improved',
      lastImprovedAt: '2026-08-09T02:00:00.000Z',
      lastImprovedBy: 'skilltree',
      improvementVersion: '1.1.0',
      improvementChangelog: [
        'Die drei Look-Dev-Setups der Factory (neutral, grazing, reference) sind jetzt von aussen waehlbar — sie lagen bisher ungenutzt im Code.',
        'Drehrichtung umkehrbar, Tempo regelbar; Speed 0 haelt die Rotation an, ohne die Maussteuerung zu sperren.',
        'Kamerawinkel und Abstand einstellbar statt fest auf 12/8 Grad.',
        'Belichtung und Szenenhintergrund frei setzbar.',
      ],
      productionSafe: false,
      status: 'experimental',
      clickToRun: true,
      fullBleed: true,
    },
    Component: lazy(() => import('./NoxOrbitalStation')),
  },
];
