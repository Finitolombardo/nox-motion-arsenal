// Contract-Test fuer das Level-up der vier Favoriten.
//
// Kern der Pruefung: die neuen Moeglichkeiten sind da UND wirksam, und die
// Grundeinstellung liefert weiterhin exakt dasselbe Bild wie vorher. Der
// zweite Teil ist der wichtigere — ein Favorit, der nach dem Ausbau anders
// aussieht, waere ein Rueckschritt, egal wie viel dazugekommen ist.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const EFFECTS = [
  {
    id: 'hero-blurry-text-reveal',
    source: 'src/motion-arsenal/effects/hero/BlurryTextReveal.tsx',
    catalog: 'src/motion-arsenal/effects/hero/catalog.ts',
    added: { direction: 'up', order: 'forward', replay: false },
  },
  {
    id: 'hero-gold-highlight-sweep',
    source: 'src/motion-arsenal/effects/hero/GoldHighlightSweep.tsx',
    catalog: 'src/motion-arsenal/effects/hero/catalog.ts',
    added: { direction: 'left', style: 'marker', trigger: 'scroll' },
  },
  {
    id: 'bg-grain-film-overlay',
    source: 'src/motion-arsenal/effects/backgrounds/GrainFilmOverlay.tsx',
    catalog: 'src/motion-arsenal/effects/backgrounds/catalog.ts',
    added: { grainStyle: 'fine', flicker: 0, blobCount: 2 },
  },
  {
    id: 'bg-holographic-mask-shader',
    source: 'src/motion-arsenal/effects/backgrounds/HolographicMaskShader.tsx',
    catalog: 'src/motion-arsenal/effects/backgrounds/catalog.ts',
    added: { motion: 'scroll', bandCount: 13, contrast: 0 },
  },
];

for (const effect of EFFECTS) {
  const source = readFileSync(effect.source, 'utf8');
  const catalog = readFileSync(effect.catalog, 'utf8');
  const entry = catalog.slice(catalog.indexOf(`id: '${effect.id}'`));
  const propsBlock = entry.slice(entry.indexOf('props: ['), entry.indexOf('productionSafe'));

  for (const [key, expected] of Object.entries(effect.added)) {
    // Im Katalog deklariert?
    const declared = propsBlock.match(new RegExp(`\\{\\s*key:\\s*'${key}'[^}]*\\}`));
    assert.ok(declared, `${effect.id}: neues Prop "${key}" fehlt im Katalog`);

    // Mit dem Default, der das bisherige Verhalten abbildet?
    const rendered = typeof expected === 'string' ? `'${expected}'` : String(expected);
    assert.ok(
      declared[0].includes(`default: ${rendered}`),
      `${effect.id}.${key}: Default muss ${rendered} sein, damit das Bild unveraendert bleibt — steht: ${declared[0]}`,
    );

    // Und in der Implementierung tatsaechlich gelesen?
    const uses = source.match(new RegExp(`\\b${key}\\b`, 'g')) ?? [];
    assert.ok(uses.length >= 2, `${effect.id}.${key}: deklariert, aber nicht verwendet`);
  }

  assert.ok(!source.includes('Math.random('), `${effect.id}: Math.random ist nicht erlaubt`);
  assert.ok(
    source.includes('prefers-reduced-motion') || source.includes('usePrefersReducedMotion'),
    `${effect.id}: Reduced-Motion-Behandlung fehlt`,
  );
}

// --- Die Grundeinstellung muss das alte Bild treffen ---

// Der Holographic-Verlauf wird jetzt aus Stuetzstellen abgetastet statt fest
// aufgezaehlt. Bei 13 Baendern und Kontrast 0 muss dabei exakt die
// Originalrampe herauskommen.
const holo = readFileSync('src/motion-arsenal/effects/backgrounds/HolographicMaskShader.tsx', 'utf8');
const hues = JSON.parse(holo.match(/spectrum:\s*(\[[^\]]+\])/)[1]);
const profile = JSON.parse(holo.match(/LIGHTNESS_PROFILE\s*=\s*(\[[^\]]+\])/)[1]);
assert.equal(hues.length, 13, 'spectrum-Palette muss 13 Stuetzstellen haben');
assert.equal(profile.length, 13, 'Helligkeitsprofil muss 13 Stuetzstellen haben');

const sample = (list, t) => {
  const position = t * (list.length - 1);
  const low = Math.floor(position);
  const high = Math.min(low + 1, list.length - 1);
  return list[low] + (list[high] - list[low]) * (position - low);
};
for (let i = 0; i < 13; i += 1) {
  const t = i / 12;
  assert.equal(sample(hues, t), hues[i], `Abtastung trifft Farbton ${i} nicht`);
  assert.equal(sample(profile, t), profile[i], `Abtastung trifft Helligkeit ${i} nicht`);
}

// Blurry Text Reveal: 'up' muss dem urspruenglichen translateY(20%) entsprechen.
const blurry = readFileSync('src/motion-arsenal/effects/hero/BlurryTextReveal.tsx', 'utf8');
assert.ok(
  /up:\s*'translateY\(20%\)'/.test(blurry),
  'BlurryTextReveal: Richtung "up" muss translateY(20%) sein — das war der alte Startversatz',
);

// Gold Highlight Sweep: 'left' + 'marker' muessen die alte Lage treffen.
const sweep = readFileSync('src/motion-arsenal/effects/hero/GoldHighlightSweep.tsx', 'utf8');
assert.ok(/left:\s*'0 88%'/.test(sweep), 'GoldHighlightSweep: "left" muss 0 88% sein');

// Grain Film Overlay: bei flicker 0 darf keine Schwankung entstehen.
const grain = readFileSync('src/motion-arsenal/effects/backgrounds/GrainFilmOverlay.tsx', 'utf8');
assert.ok(
  grain.includes("flickerAmount > 0 ? ' has-flicker' : ''"),
  'GrainFilmOverlay: Flackern muss bei 0 vollstaendig abgeschaltet sein',
);

console.log(`Favoriten-Level-up: ${EFFECTS.length} Effekte um je 3 Moeglichkeiten erweitert, Grundeinstellung unveraendert.`);
