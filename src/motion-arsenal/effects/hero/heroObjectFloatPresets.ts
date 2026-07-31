export type HeroObjectVariant =
  | 'nox-floating-card-os'
  | 'forge-obsidian-relic'
  | 'project-x-nexus-cube'
  | 'revenue-ascension-prism'
  | 'automation-kernel-chip'
  | 'signal-resonance-orb';

export type HeroObjectShellVariant =
  | 'classic-glass-card'
  | 'obsidian-plaque'
  | 'frosted-command-panel'
  | 'museum-slab'
  | 'holo-sigil-tablet';

export type HeroObjectEnergy = 'calm' | 'charged' | 'overdrive';

export interface HeroObjectPreset {
  id: HeroObjectVariant;
  shortLabel: string;
  label: string;
  kicker: string;
  reference: string;
  accent: string;
  secondary: string;
  light: string;
  background: string;
  bestFor: string[];
}

export interface HeroObjectShellPreset {
  id: HeroObjectShellVariant;
  shortLabel: string;
  label: string;
  reference: string;
  bestFor: string[];
}

export interface HeroObjectEnergyPreset {
  id: HeroObjectEnergy;
  label: string;
  speed: number;
  amplitude: number;
  tilt: number;
  glow: number;
  orbit: number;
}

export const HERO_OBJECT_VARIANTS: HeroObjectVariant[] = [
  'nox-floating-card-os',
  'forge-obsidian-relic',
  'project-x-nexus-cube',
  'revenue-ascension-prism',
  'automation-kernel-chip',
  'signal-resonance-orb',
];

export const HERO_OBJECT_SHELL_VARIANTS: HeroObjectShellVariant[] = [
  'classic-glass-card',
  'obsidian-plaque',
  'frosted-command-panel',
  'museum-slab',
  'holo-sigil-tablet',
];

export const HERO_OBJECT_ENERGIES: HeroObjectEnergy[] = ['calm', 'charged', 'overdrive'];

export const HERO_OBJECT_DEFAULT_SHELL: Record<HeroObjectVariant, HeroObjectShellVariant> = {
  'nox-floating-card-os': 'classic-glass-card',
  'forge-obsidian-relic': 'classic-glass-card',
  'project-x-nexus-cube': 'frosted-command-panel',
  'revenue-ascension-prism': 'museum-slab',
  'automation-kernel-chip': 'frosted-command-panel',
  'signal-resonance-orb': 'holo-sigil-tablet',
};

export const HERO_OBJECT_SHELL_PRESETS: Record<HeroObjectShellVariant, HeroObjectShellPreset> = {
  'classic-glass-card': {
    id: 'classic-glass-card',
    shortLabel: 'GLASS',
    label: 'Classic Glass Card',
    reference: 'motion:hero-object-float-shell@classic-glass-card',
    bestFor: ['premium product card', 'NOX Forge artifact', 'clean dark hero'],
  },
  'obsidian-plaque': {
    id: 'obsidian-plaque',
    shortLabel: 'OBSIDIAN',
    label: 'Obsidian Plaque',
    reference: 'motion:hero-object-float-shell@obsidian-plaque',
    bestFor: ['ritual artifact', 'luxury dark product', 'forge identity'],
  },
  'frosted-command-panel': {
    id: 'frosted-command-panel',
    shortLabel: 'FROST',
    label: 'Frosted Command Panel',
    reference: 'motion:hero-object-float-shell@frosted-command-panel',
    bestFor: ['agent dashboard', 'Project X', 'technical system hero'],
  },
  'museum-slab': {
    id: 'museum-slab',
    shortLabel: 'MUSEUM',
    label: 'Museum Glass Slab',
    reference: 'motion:hero-object-float-shell@museum-slab',
    bestFor: ['high-ticket offer', 'editorial product display', 'premium showcase'],
  },
  'holo-sigil-tablet': {
    id: 'holo-sigil-tablet',
    shortLabel: 'HOLO',
    label: 'Holo Sigil Tablet',
    reference: 'motion:hero-object-float-shell@holo-sigil-tablet',
    bestFor: ['AI growth system', 'signal intelligence', 'futuristic product hero'],
  },
};

export const HERO_OBJECT_PRESETS: Record<HeroObjectVariant, HeroObjectPreset> = {
  'nox-floating-card-os': {
    id: 'nox-floating-card-os',
    shortLabel: 'CARD OS',
    label: 'NOX Floating Card OS',
    kicker: 'SIGNAL TO OPERATOR COMMAND',
    reference: 'motion:hero-object-float@nox-floating-card-os',
    accent: '#b7352d',
    secondary: '#e2b56f',
    light: '#fff6e8',
    background: 'radial-gradient(76% 70% at 50% 54%, rgba(183,53,45,.18), transparent 68%), linear-gradient(180deg, #090708 0%, #030304 100%)',
    bestFor: ['NOX revenue stage', 'scroll-driven product narrative', 'operator-controlled automation'],
  },
  'forge-obsidian-relic': {
    id: 'forge-obsidian-relic',
    shortLabel: 'RELIC',
    label: 'Obsidian Forge Relic',
    kicker: 'FORGED SYSTEM CORE',
    reference: 'motion:hero-object-float@forge-obsidian-relic',
    accent: '#ff553d',
    secondary: '#d89b42',
    light: '#fff1da',
    background: 'radial-gradient(80% 72% at 50% 58%, rgba(129,29,18,.24), transparent 65%), linear-gradient(180deg, #090708 0%, #030304 100%)',
    bestFor: ['NOX Forge', 'skill unlock hero', 'premium artifact reveal'],
  },
  'project-x-nexus-cube': {
    id: 'project-x-nexus-cube',
    shortLabel: 'NEXUS',
    label: 'Project-X Nexus Cube',
    kicker: 'AGENT ORCHESTRATION',
    reference: 'motion:hero-object-float@project-x-nexus-cube',
    accent: '#7b7cff',
    secondary: '#2de2d2',
    light: '#edf7ff',
    background: 'radial-gradient(72% 70% at 50% 52%, rgba(75,71,190,.23), transparent 67%), linear-gradient(180deg, #070711 0%, #030306 100%)',
    bestFor: ['Project X', 'agent command center', 'AI orchestration product'],
  },
  'revenue-ascension-prism': {
    id: 'revenue-ascension-prism',
    shortLabel: 'PRISM',
    label: 'Revenue Ascension Prism',
    kicker: 'PIPELINE TO SCALE',
    reference: 'motion:hero-object-float@revenue-ascension-prism',
    accent: '#f0b64d',
    secondary: '#ff6d3f',
    light: '#fff7df',
    background: 'radial-gradient(80% 74% at 50% 55%, rgba(164,106,24,.22), transparent 66%), linear-gradient(180deg, #0c0905 0%, #030302 100%)',
    bestFor: ['Global Sales OS', 'high-ticket offer', 'revenue engine hero'],
  },
  'automation-kernel-chip': {
    id: 'automation-kernel-chip',
    shortLabel: 'KERNEL',
    label: 'Automation Kernel Chip',
    kicker: 'TRIGGER // LOGIC // ACTION',
    reference: 'motion:hero-object-float@automation-kernel-chip',
    accent: '#54d98c',
    secondary: '#31a9ff',
    light: '#e9fff4',
    background: 'radial-gradient(76% 72% at 50% 55%, rgba(36,137,93,.20), transparent 67%), linear-gradient(180deg, #050b08 0%, #020403 100%)',
    bestFor: ['automation systems', 'n8n workflows', 'operations platform'],
  },
  'signal-resonance-orb': {
    id: 'signal-resonance-orb',
    shortLabel: 'ORBIT',
    label: 'Signal Resonance Orb',
    kicker: 'DEMAND IN MOTION',
    reference: 'motion:hero-object-float@signal-resonance-orb',
    accent: '#ff4f9a',
    secondary: '#7d6cff',
    light: '#fff1fb',
    background: 'radial-gradient(78% 75% at 50% 52%, rgba(143,38,105,.22), transparent 68%), linear-gradient(180deg, #0b050a 0%, #030203 100%)',
    bestFor: ['AI Growth Engine', 'signal intelligence', 'content and demand system'],
  },
};

export const HERO_OBJECT_ENERGY_PRESETS: Record<HeroObjectEnergy, HeroObjectEnergyPreset> = {
  calm: { id: 'calm', label: 'CALM', speed: 0.72, amplitude: 0.7, tilt: 0.72, glow: 0.66, orbit: 0.65 },
  charged: { id: 'charged', label: 'CHARGED', speed: 1, amplitude: 1, tilt: 1, glow: 1, orbit: 1 },
  overdrive: { id: 'overdrive', label: 'OVERDRIVE', speed: 1.42, amplitude: 1.28, tilt: 1.18, glow: 1.42, orbit: 1.5 },
};
