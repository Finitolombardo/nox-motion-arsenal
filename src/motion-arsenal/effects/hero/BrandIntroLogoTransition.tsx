import { useState, type UIEvent } from 'react';
import { clamp, smoothstep, usePrefersReducedMotion } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

export interface BrandIntroLogoTransitionProps {
  brand?: string;
  tagline?: string;
  accent?: string;
  distance?: number;
  showGuide?: boolean;
}

const mix = (from: number, to: number, t: number) => from + (to - from) * t;

export function BrandIntroLogoTransition({
  brand = 'ATELIER',
  tagline = 'FORM · RHYTHM · PRESENCE',
  accent = '#d5b277',
  distance = 1,
  showGuide = true,
}: BrandIntroLogoTransitionProps) {
  const reduced = usePrefersReducedMotion();
  const [rawProgress, setRawProgress] = useState(reduced ? 1 : 0);

  const onScroll = (event: UIEvent<HTMLDivElement>) => {
    if (reduced) return;
    const element = event.currentTarget;
    const max = Math.max(element.scrollHeight - element.clientHeight, 1);
    setRawProgress(clamp((element.scrollTop / max) * distance, 0, 1));
  };

  const progress = reduced ? 1 : rawProgress;
  const logoProgress = smoothstep(0.04, 0.58, progress);
  const revealProgress = smoothstep(0.38, 0.92, progress);
  const navProgress = smoothstep(0.48, 0.72, progress);
  const logoLeft = mix(50, 8.5, logoProgress);
  const logoTop = mix(47, 7.5, logoProgress);
  const logoScale = mix(1, 0.23, logoProgress);
  const imageInset = mix(34, 0, revealProgress);

  return (
    <div onScroll={onScroll} style={{ position: 'absolute', inset: 0, overflowY: reduced ? 'hidden' : 'auto', overflowX: 'hidden', overscrollBehavior: 'contain', scrollbarWidth: 'none', background: '#090909', color: NOX_COLORS.text }}>
      <style>{`
        .bilt-scroll::-webkit-scrollbar { display: none; }
        @media (max-width: 640px) {
          .bilt-nav-center { display: none !important; }
          .bilt-copy { left: 7% !important; right: 7% !important; bottom: 8% !important; }
          .bilt-copy h2 { font-size: clamp(30px, 10vw, 52px) !important; max-width: 10ch !important; }
          .bilt-frame { inset: 15% 5% 21% 5% !important; }
        }
      `}</style>
      <div className="bilt-scroll" style={{ position: 'relative', height: reduced ? '100%' : '220%' }}>
        <section style={{ position: 'sticky', top: 0, height: '100vh', minHeight: 420, overflow: 'hidden', background: 'radial-gradient(90% 70% at 50% 100%, rgba(213,178,119,0.08), transparent 60%), #090909' }}>
          <div aria-hidden style={{ position: 'absolute', inset: 0, opacity: 0.3, backgroundImage: 'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '52px 52px', maskImage: 'linear-gradient(to bottom, black, transparent 82%)' }} />
          <div className="bilt-frame" style={{ position: 'absolute', inset: '13% 8% 16% 8%', overflow: 'hidden', clipPath: `inset(${imageInset}% ${imageInset * 0.34}% ${imageInset * 0.55}% ${imageInset * 0.34}% round 2px)`, opacity: mix(0.2, 1, revealProgress), transform: `scale(${mix(1.08, 1, revealProgress)})`, transformOrigin: '50% 50%', background: `radial-gradient(58% 80% at 72% 32%, ${accent}55 0%, transparent 62%), radial-gradient(70% 90% at 28% 78%, rgba(91,72,48,0.72) 0%, transparent 68%), linear-gradient(132deg, #1c1916 0%, #40372e 48%, #11100f 100%)`, boxShadow: '0 35px 90px rgba(0,0,0,0.48)' }}>
            <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(115deg, transparent 15%, rgba(255,255,255,0.12) 42%, transparent 63%)', transform: `translateX(${mix(-42, 18, revealProgress)}%)`, opacity: 0.5 }} />
          </div>
          <header style={{ position: 'absolute', inset: '0 5.5% auto 5.5%', height: '15%', minHeight: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', pointerEvents: 'none', zIndex: 5 }}>
            <div />
            <nav className="bilt-nav-center" aria-label="Demo-Navigation" style={{ display: 'flex', gap: 'clamp(18px, 3vw, 42px)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', opacity: navProgress }}><span>Journal</span><span>Studio</span><span>Kontakt</span></nav>
            <div style={{ width: 34, height: 1, background: 'currentColor', opacity: navProgress, boxShadow: '0 7px 0 currentColor, 0 -7px 0 currentColor' }} />
          </header>
          <div aria-label={`${brand} Markenlogo`} style={{ position: 'absolute', left: `${logoLeft}%`, top: `${logoTop}%`, zIndex: 8, transform: `translate(-50%, -50%) scale(${logoScale})`, transformOrigin: '50% 50%', whiteSpace: 'nowrap', fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 'clamp(70px, 15vw, 190px)', fontWeight: 400, letterSpacing: '-0.055em', lineHeight: 0.82, color: '#f3efe8', textShadow: '0 8px 42px rgba(0,0,0,0.45)' }}>{brand}</div>
          <div className="bilt-copy" style={{ position: 'absolute', zIndex: 6, left: '11%', right: '11%', bottom: '9%', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, opacity: revealProgress, transform: `translateY(${mix(28, 0, revealProgress)}px)` }}>
            <div><div style={{ marginBottom: 10, fontSize: 9, letterSpacing: '0.34em', textTransform: 'uppercase', color: accent }}>{tagline}</div><h2 style={{ margin: 0, maxWidth: '12ch', fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 'clamp(38px, 6vw, 78px)', fontWeight: 400, lineHeight: 0.92, letterSpacing: '-0.045em' }}>Eine Marke wird zur Navigation.</h2></div>
            <div style={{ maxWidth: 220, fontSize: 11, lineHeight: 1.55, color: 'rgba(243,239,232,0.68)' }}>Scroll koppelt Wortmarke, Navigation und Bild-Enthüllung zu einer einzigen ruhigen Choreografie.</div>
          </div>
          {showGuide && !reduced && <div aria-hidden style={{ position: 'absolute', right: '2.8%', top: '50%', transform: 'translateY(-50%) rotate(90deg)', transformOrigin: 'center', fontSize: 8, letterSpacing: '0.38em', color: 'rgba(243,239,232,0.42)', opacity: 1 - smoothstep(0.1, 0.35, progress) }}>SCROLL</div>}
        </section>
      </div>
    </div>
  );
}

export default BrandIntroLogoTransition;
