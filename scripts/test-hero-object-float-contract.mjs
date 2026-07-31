import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const component = readFileSync(join(root, 'src/motion-arsenal/effects/hero/HeroObjectFloat.tsx'), 'utf8');
const objects = readFileSync(join(root, 'src/motion-arsenal/effects/hero/heroObjectFloatObjects.tsx'), 'utf8');
const shells = readFileSync(join(root, 'src/motion-arsenal/effects/hero/heroObjectFloatShells.tsx'), 'utf8');
const shellStyles = readFileSync(join(root, 'src/motion-arsenal/effects/hero/heroObjectGlassShellStyles.ts'), 'utf8');
const presets = readFileSync(join(root, 'src/motion-arsenal/effects/hero/heroObjectFloatPresets.ts'), 'utf8');
const styles = readFileSync(join(root, 'src/motion-arsenal/effects/hero/heroObjectFloatStyles.ts'), 'utf8');
const catalog = readFileSync(join(root, 'src/motion-arsenal/effects/hero/catalog.ts'), 'utf8');
const manifest = JSON.parse(readFileSync(join(root, 'public/agent-manifests/hero-object-float-variants.json'), 'utf8'));

const variants = [
  'nox-floating-card-os',
  'forge-obsidian-relic',
  'project-x-nexus-cube',
  'revenue-ascension-prism',
  'automation-kernel-chip',
  'signal-resonance-orb',
];
const shellVariants = [
  'classic-glass-card',
  'obsidian-plaque',
  'frosted-command-panel',
  'museum-slab',
  'holo-sigil-tablet',
];
const energies = ['calm', 'charged', 'overdrive'];

for (const id of variants) {
  if (!presets.includes(id)) throw new Error(`missing hero object preset: ${id}`);
  const ref = `motion:hero-object-float@${id}`;
  if (!presets.includes(ref) || !manifest.variants.some((entry) => entry.reference === ref)) {
    throw new Error(`missing stable hero object reference: ${ref}`);
  }
}
for (const id of shellVariants) {
  if (!presets.includes(id) || !shellStyles.includes(`hof-shell-${id}`)) {
    throw new Error(`missing glass shell implementation: ${id}`);
  }
  const ref = `motion:hero-object-float-shell@${id}`;
  if (!presets.includes(ref) || !manifest.shells.some((entry) => entry.reference === ref)) {
    throw new Error(`missing stable glass shell reference: ${ref}`);
  }
}
for (const energy of energies) {
  if (!presets.includes(`'${energy}'`) || !manifest.energies.includes(energy)) {
    throw new Error(`missing hero object energy: ${energy}`);
  }
}
if (manifest.variants.length !== variants.length) throw new Error('hero object manifest variant count mismatch');
if (manifest.shells.length !== shellVariants.length) throw new Error('glass shell manifest variant count mismatch');
if (!component.includes('showVariantSwitcher') || !component.includes('showShellSwitcher') || !component.includes('showEnergySwitcher')) {
  throw new Error('production switcher controls missing');
}
if (!component.includes('TAP TO IMPULSE') || !styles.includes('hof-impact')) throw new Error('pointer impact system missing');
if (!objects.includes('hof-cube-face') || !objects.includes('hof-prism') || !objects.includes('hof-chip') || !objects.includes('hof-orb')) {
  throw new Error('semantic object geometries are incomplete');
}
if (!shells.includes('HeroObjectGlassShell') || !shellStyles.includes('backdrop-filter') || !shellStyles.includes('hof-shell-caustic')) {
  throw new Error('premium glass shell layers are incomplete');
}
if (!styles.includes('transform-style:preserve-3d') || !styles.includes('hof-orbit')) throw new Error('CSS 3D/orbit system missing');
if (!catalog.includes("id: 'hero-object-float'")) throw new Error('hero object catalog entry missing');
if (`${component}\n${objects}\n${shells}\n${presets}`.includes('Math.random')) throw new Error('hero object system must remain deterministic');
if (/fetch\s*\(|XMLHttpRequest|WebSocket/.test(`${component}\n${objects}\n${shells}`)) throw new Error('hero object system must not issue runtime network requests');

console.log('hero object float contract: ok');
