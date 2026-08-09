import { useEffect, useId, useRef, useState } from 'react';
import { clamp, useInView, usePrefersReducedMotion } from '../../lib/animationUtils';
import { NOX_COLORS, EASE } from '../../lib/motionPresets';

export interface LockUnlockScanProps {
  accent?: string;
  scanSpeed?: number;
  autoRelock?: boolean;
  relockDelay?: number;
  defaultUnlocked?: boolean;
}

export function LockUnlockScan({
  accent = NOX_COLORS.gold,
  scanSpeed = 1,
  autoRelock = true,
  relockDelay = 4500,
  defaultUnlocked = false,
}: LockUnlockScanProps) {
  const [unlocked, setUnlocked] = useState(defaultUnlocked);
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef);
  const relockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rawId = useId();
  const noiseId = `lus-noise-${rawId.replace(/:/g, '')}`;
  const safeScanSpeed = clamp(Number.isFinite(scanSpeed) ? scanSpeed : 1, 0.2, 4);
  const safeRelockDelay = clamp(Number.isFinite(relockDelay) ? relockDelay : 4500, 800, 20000);
  const visualUnlocked = unlocked || reduced;

  useEffect(() => {
    return () => {
      if (relockTimer.current) clearTimeout(relockTimer.current);
    };
  }, []);

  const unlock = () => {
    if (unlocked) return;
    setUnlocked(true);
    if (relockTimer.current) clearTimeout(relockTimer.current);
    if (autoRelock && !reduced) {
      relockTimer.current = setTimeout(() => {
        setUnlocked(false);
        relockTimer.current = null;
      }, safeRelockDelay);
    }
  };

  return (
    <div
      ref={rootRef}
      style={{
        position: 'absolute',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        background: 'radial-gradient(100% 100% at 50% 120%, #14100a 0%, #0a0a0b 60%)',
        fontFamily: 'var(--sans, sans-serif)',
        contain: 'layout paint style',
      }}
    >
      <style>{`
        @keyframes lus-scanline { 0% { transform: translateY(-42px); } 100% { transform: translateY(calc(100% + 42px)); } }
        @keyframes lus-flash { 0% { opacity: 0; } 12% { opacity: 0.9; } 100% { opacity: 0; } }
        @keyframes lus-trace { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
        @keyframes lus-item { from { opacity: 0; transform: translateY(9px); } to { opacity: 1; transform: none; } }
        @keyframes lus-led { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
        .lus-card:focus-visible { outline: 2px solid ${accent}; outline-offset: 5px; }
        @media (prefers-reduced-motion: reduce) { .lus-a { animation: none !important; transition: none !important; } }
      `}</style>

      <button
        type="button"
        className="lus-card"
        onClick={unlock}
        aria-pressed={visualUnlocked}
        aria-label={visualUnlocked ? 'Forge module unlocked' : 'Unlock Forge module'}
        style={{
          appearance: 'none',
          textAlign: 'left',
          position: 'relative',
          width: 'min(82%, 340px)',
          borderRadius: 14,
          border: '1px solid #26262d',
          background: '#121215',
          padding: '18px 20px 20px',
          cursor: visualUnlocked ? 'default' : 'pointer',
          overflow: 'hidden',
          color: 'inherit',
          filter: visualUnlocked ? 'none' : 'saturate(0.4) brightness(0.75)',
          transition: `filter 0.6s ${EASE.outQuint}, border-color 0.35s ease, box-shadow 0.35s ease`,
          boxShadow: visualUnlocked ? `0 18px 52px rgba(0,0,0,0.38), 0 0 28px ${accent}18` : '0 18px 44px rgba(0,0,0,0.32)',
          touchAction: 'manipulation',
        }}
      >
        {!visualUnlocked && inView && (
          <>
            <div
              className="lus-a"
              aria-hidden
              style={{
                position: 'absolute',
                inset: '0 0 auto 0',
                height: 34,
                background: `linear-gradient(180deg, transparent, ${accent}26, transparent)`,
                animation: `lus-scanline ${2.4 / safeScanSpeed}s linear infinite`,
                pointerEvents: 'none',
              }}
            />
            <svg
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.045, pointerEvents: 'none' }}
              aria-hidden
            >
              <filter id={noiseId}>
                <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="1" />
              </filter>
              <rect width="100%" height="100%" filter={`url(#${noiseId})`} />
            </svg>
          </>
        )}

        {unlocked && !reduced && (
          <div
            className="lus-a"
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(180deg, ${accent}55, transparent 60%)`,
              animation: 'lus-flash 0.8s ease-out both',
              pointerEvents: 'none',
            }}
          />
        )}

        {unlocked && !reduced && (
          <svg aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            <rect
              className="lus-a"
              x="1"
              y="1"
              width="calc(100% - 2px)"
              height="calc(100% - 2px)"
              rx="13"
              fill="none"
              stroke={accent}
              strokeWidth="1.5"
              pathLength={1}
              strokeDasharray={1}
              style={{ animation: `lus-trace 0.9s ${EASE.outExpo} both` }}
            />
          </svg>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
          <span style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, letterSpacing: '0.22em', color: NOX_COLORS.textDim }}>
            MODULE // BLACK FORGE
          </span>
          <span
            className="lus-a"
            aria-hidden
            style={{
              width: 8,
              height: 8,
              flex: '0 0 auto',
              borderRadius: '50%',
              background: visualUnlocked ? accent : NOX_COLORS.red,
              boxShadow: `0 0 8px ${visualUnlocked ? accent : NOX_COLORS.red}`,
              animation: reduced || !inView ? undefined : 'lus-led 1.6s ease-in-out infinite',
            }}
          />
        </div>

        {visualUnlocked ? (
          <div key="open">
            {['30-TAGE-PROTOKOLL', 'Zugriff gewährt. Das Modul ist entsiegelt.', '▸ Protokoll starten'].map((text, index) => (
              <div
                key={text}
                className="lus-a"
                style={{
                  animation: reduced || !unlocked ? undefined : `lus-item 0.45s ${EASE.outExpo} ${0.35 + index * 0.12}s both`,
                  fontSize: index === 0 ? 19 : 12.5,
                  fontWeight: index === 0 ? 750 : 400,
                  color: index === 0 ? NOX_COLORS.text : index === 2 ? accent : NOX_COLORS.textDim,
                  marginBottom: 7,
                  fontFamily: index === 2 ? 'var(--mono, monospace)' : undefined,
                  letterSpacing: index === 2 ? '0.12em' : undefined,
                }}
              >
                {text}
              </div>
            ))}
          </div>
        ) : (
          <div key="locked">
            <div style={{ fontSize: 19, fontWeight: 750, color: NOX_COLORS.text, marginBottom: 7, letterSpacing: '0.04em' }}>
              ▮▮▮▮▮ ▮▮▮▮▮▮▮▮
            </div>
            <div style={{ fontSize: 12.5, color: NOX_COLORS.textDim }}>Gesperrt. Aktivieren zum Entsiegeln.</div>
            <div style={{ marginTop: 12, fontFamily: 'var(--mono, monospace)', fontSize: 10, letterSpacing: '0.2em', color: NOX_COLORS.red }}>
              ⬢ LOCKED
            </div>
          </div>
        )}
      </button>
    </div>
  );
}

export default LockUnlockScan;
