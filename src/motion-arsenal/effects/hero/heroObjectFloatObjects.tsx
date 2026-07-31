import type { CSSProperties, ReactNode } from 'react';
import { glyphPath } from '../../lib/svgUtils';
import type { HeroObjectVariant } from './heroObjectFloatPresets';
import { NoxFloatingCardOS } from './NoxFloatingCardOS';

interface HeroObjectVisualProps {
  variant: HeroObjectVariant;
  seed: number;
}

const seamAngles = [0, 45, 90, 135, 180, 225, 270, 315];

function ForgeRelic({ seed }: { seed: number }) {
  const path = glyphPath(seed * 13 + 3, 120);
  return (
    <div className="hof-object hof-relic">
      {seamAngles.map((angle) => (
        <span key={angle} className="hof-seam" style={{ transform: `translateX(-50%) rotate(${angle}deg)` }} />
      ))}
      <div className="hof-relic-core">
        <svg className="hof-relic-mark" viewBox="0 0 120 120" aria-hidden="true">
          <path d={path} fill="none" stroke="var(--hof-accent)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d={path} fill="none" stroke="var(--hof-light)" strokeOpacity=".38" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </div>
      <div className="hof-scan" />
      <div className="hof-glare" />
    </div>
  );
}

function NexusCube() {
  const faceContent: ReactNode = (
    <>
      <div className="hof-grid" />
      <span className="hof-node" style={{ left: '18%', top: '22%' }} />
      <span className="hof-node" style={{ left: '67%', top: '16%' }} />
      <span className="hof-node" style={{ left: '72%', top: '66%' }} />
      <span className="hof-node" style={{ left: '24%', top: '73%' }} />
      <span className="hof-node" style={{ left: '48%', top: '46%', width: 13, height: 13 }} />
      <span className="hof-route" style={{ left: '22%', top: '25%', width: '40%', transform: 'rotate(-9deg)' }} />
      <span className="hof-route" style={{ left: '52%', top: '49%', width: '31%', transform: 'rotate(39deg)' }} />
      <span className="hof-route" style={{ left: '29%', top: '68%', width: '31%', transform: 'rotate(-41deg)' }} />
    </>
  );
  return (
    <div className="hof-object hof-cube">
      <div className="hof-cube-face front">{faceContent}<div className="hof-scan" /></div>
      <div className="hof-cube-face back"><div className="hof-grid" /></div>
      <div className="hof-cube-face right"><div className="hof-grid" /></div>
      <div className="hof-cube-face left"><div className="hof-grid" /></div>
      <div className="hof-cube-face top"><div className="hof-grid" /></div>
      <div className="hof-cube-face bottom"><div className="hof-grid" /></div>
    </div>
  );
}

function RevenuePrism() {
  const bars = [38, 54, 72, 94];
  return (
    <div className="hof-object hof-prism">
      <div className="hof-prism-inner" />
      <div className="hof-bars">
        {bars.map((height, index) => (
          <span key={height} className="hof-bar" style={{ height: `${height}%`, animationDelay: `${index * 0.18}s` }} />
        ))}
      </div>
      <div className="hof-arrow" />
      <div className="hof-scan" />
      <div className="hof-glare" />
    </div>
  );
}

function AutomationKernel() {
  const circuits: CSSProperties[] = [
    { left: '5%', top: '28%', width: '31%', transform: 'rotate(14deg)' },
    { left: '63%', top: '31%', width: '31%', transform: 'rotate(-18deg)' },
    { left: '7%', top: '70%', width: '31%', transform: 'rotate(-13deg)' },
    { left: '62%', top: '68%', width: '32%', transform: 'rotate(18deg)' },
  ];
  const ports: CSSProperties[] = [
    { left: '2%', top: '25%' }, { right: '2%', top: '25%' }, { left: '2%', bottom: '25%' }, { right: '2%', bottom: '25%' },
  ];
  return (
    <div className="hof-object hof-chip">
      {circuits.map((style, index) => <span key={index} className="hof-circuit" style={style} />)}
      {ports.map((style, index) => <span key={index} className="hof-port" style={style} />)}
      <div className="hof-chip-core">
        <svg viewBox="0 0 100 100" style={{ width: '62%', filter: 'drop-shadow(0 0 8px var(--hof-accent))' }} aria-hidden="true">
          <path d="M50 8 82 26v48L50 92 18 74V26Z" fill="none" stroke="var(--hof-accent)" strokeWidth="4" />
          <path d="M50 25 68 36v28L50 75 32 64V36Z" fill="none" stroke="var(--hof-light)" strokeOpacity=".62" strokeWidth="2" />
          <circle cx="50" cy="50" r="7" fill="var(--hof-light)" />
        </svg>
      </div>
      <div className="hof-scan" />
      <div className="hof-glare" />
    </div>
  );
}

function SignalOrb() {
  const dots: CSSProperties[] = [
    { left: '24%', top: '33%', animationDelay: '.1s' },
    { left: '62%', top: '24%', animationDelay: '.55s' },
    { left: '70%', top: '61%', animationDelay: '1.1s' },
    { left: '35%', top: '70%', animationDelay: '1.55s' },
    { left: '47%', top: '45%', width: 10, height: 10, animationDelay: '.3s' },
  ];
  return (
    <>
      <div className="hof-object hof-orb">
        <div className="hof-grid" />
        {dots.map((style, index) => <span key={index} className="hof-pulse-dot" style={style} />)}
        <div className="hof-scan" />
        <div className="hof-glare" />
      </div>
      <div className="hof-orb-ring" />
    </>
  );
}

export function HeroObjectVisual({ variant, seed }: HeroObjectVisualProps) {
  switch (variant) {
    case 'nox-floating-card-os':
      return <NoxFloatingCardOS />;
    case 'project-x-nexus-cube':
      return <NexusCube />;
    case 'revenue-ascension-prism':
      return <RevenuePrism />;
    case 'automation-kernel-chip':
      return <AutomationKernel />;
    case 'signal-resonance-orb':
      return <SignalOrb />;
    case 'forge-obsidian-relic':
    default:
      return <ForgeRelic seed={seed} />;
  }
}
