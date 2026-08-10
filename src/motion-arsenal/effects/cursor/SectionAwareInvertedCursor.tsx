import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { clamp, useInView, usePointer, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';

// ---------------------------------------------------------------------------
// SectionAwareInvertedCursor — NOX-Adaptation von Immersive Gardens
// kontextbewusstem Custom-Cursor. Die Farbe wechselt explizit zwischen
// Gold (#d4af37) auf dunklen Sektionen und Near-Black (#0a0a0b) auf hellen
// Sektionen. Ein träger Folge-Ring verstärkt die elegante Bewegung.
//
// Regeln:
//   • usePointer(rootRef) → pointer.current.x/y (nicht destructured)
//   • useRafLoop(cb, running) mit running = !reduced && inView
//   • IntersectionObserver für [data-cursor-theme]-Sektionen, io.disconnect()
//   • Kein Math.random, kein fetch
//   • Reduced Motion: rAF stoppt, Follower-Ring aus, Transition 0s
// ---------------------------------------------------------------------------

export interface SectionAwareInvertedCursorProps {
  /** Durchmesser des Haupt-Cursor-Punkts in px (4–40). */
  size?: number;
  /** Durchmesser des Folge-Rings in px (10–80). */
  followSize?: number;
  /** Trägheit des Folge-Rings (0.05–0.5). */
  followLag?: number;
  /** Dauer des Farbwechsels in Sekunden (0.1–1.0). */
  transitionDuration?: number;
  /** Cursor-Farbe auf dunklem Grund. */
  darkColor?: string;
  /** Cursor-Farbe auf hellem Grund. */
  lightColor?: string;
  /** Darstellungsmodus des Cursors. */
  mode?: 'dot' | 'ring' | 'dot+ring';
  /** Custom-Cursor auf Touch-Geräten ausblenden. */
  hideOnTouch?: boolean;
}

export function SectionAwareInvertedCursor({
  size = 12,
  followSize = 40,
  followLag = 0.15,
  transitionDuration = 0.5,
  darkColor = '#d4af37',
  lightColor = '#0a0a0b',
  mode = 'dot',
  hideOnTouch = true,
}: SectionAwareInvertedCursorProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const followRef = useRef<HTMLDivElement | null>(null);

  const reduced = usePrefersReducedMotion();
  const inView = useInView(rootRef);
  const pointer = usePointer(rootRef);

  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  // themeRef verhindert Re-Render-Spam: nur bei echtem Wechsel setTheme.
  const themeRef = useRef<'light' | 'dark'>('dark');
  const applyTheme = (value: string | null) => {
    if (value !== 'light' && value !== 'dark') return;
    if (themeRef.current !== value) {
      themeRef.current = value;
      setTheme(value);
    }
  };

  const safeSize = clamp(size, 4, 40);
  const safeFollowSize = clamp(followSize, 10, 80);
  const safeLag = clamp(followLag, 0.05, 0.5);
  const safeDuration = clamp(transitionDuration, 0.1, 1.0);

  const cursorPos = useRef({ x: 0, y: 0 });
  const followPos = useRef({ x: 0, y: 0 });
  // Latch: Position wird nur zugewiesen, solange der Pointer im Root ist.
  const latch = useRef({ inside: false });

  // Sektions-Erkennung: die sichtbarste [data-cursor-theme]-Sektion gewinnt.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const sections = root.querySelectorAll('[data-cursor-theme]');
    if (sections.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        let best: IntersectionObserverEntry | null = null;
        for (const entry of entries) {
          if (!best || entry.intersectionRatio > best.intersectionRatio) {
            best = entry;
          }
        }
        if (best) {
          applyTheme(best.target.getAttribute('data-cursor-theme'));
        }
      },
      { root, threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    sections.forEach((section) => io.observe(section));
    return () => io.disconnect();
  }, []);

  // Pointer-Enter/Leave als Latch für die Position-Zuweisung.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const onEnter = () => {
      latch.current.inside = true;
    };
    const onLeave = () => {
      latch.current.inside = false;
    };
    root.addEventListener('pointerenter', onEnter);
    root.addEventListener('pointerleave', onLeave);
    return () => {
      root.removeEventListener('pointerenter', onEnter);
      root.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  // Position-Update nur, wenn !reduced && inView (running-Guard).
  useRafLoop((dt) => {
    const cursor = cursorRef.current;
    const follow = followRef.current;
    if (!cursor) return;
    if (!latch.current.inside) return;

    const root = rootRef.current;
    const width = root?.clientWidth ?? 0;
    const height = root?.clientHeight ?? 0;

    // tx/ty = echte Mausposition (normalisiert 0..1). WICHTIG: usePointer setzt
    // x/y NIE (bleiben 0.5 = Container-Mitte) — tx/ty ist die Zielposition.
    const targetX = pointer.current.tx * width;
    const targetY = pointer.current.ty * height;

    // Sektion unter der Maus bestimmen (primär, wie immersive-g): der Cursor
    // wechselt die Farbe dort, wo er gerade schwebt — auch wenn mehrere
    // Sektionen gleichzeitig im Viewport sind. elementFromPoint liefert das
    // oberste Element an der Mausposition; closest findet die Theme-Sektion.
    if (root) {
      const rect = root.getBoundingClientRect();
      const el = document.elementFromPoint(rect.left + targetX, rect.top + targetY);
      const section = el?.closest?.('[data-cursor-theme]') ?? null;
      applyTheme(section?.getAttribute('data-cursor-theme') ?? null);
    }

    // Haupt-Cursor: straffer Follow (20 % pro Frame ≈ 12 bei 60 fps).
    cursorPos.current.x += (targetX - cursorPos.current.x) * 0.2;
    cursorPos.current.y += (targetY - cursorPos.current.y) * 0.2;
    cursor.style.transform = `translate3d(${cursorPos.current.x - safeSize / 2}px, ${cursorPos.current.y - safeSize / 2}px, 0)`;

    // Folge-Ring: konfigurierbare Trägheit.
    if (follow && (mode === 'ring' || mode === 'dot+ring')) {
      followPos.current.x += (targetX - followPos.current.x) * safeLag;
      followPos.current.y += (targetY - followPos.current.y) * safeLag;
      follow.style.transform = `translate3d(${followPos.current.x - safeFollowSize / 2}px, ${followPos.current.y - safeFollowSize / 2}px, 0)`;
    }
  }, !reduced && inView);

  const cursorColor = theme === 'dark' ? darkColor : lightColor;

  const vars = {
    '--sac-size': `${safeSize}px`,
    '--sac-follow-size': `${safeFollowSize}px`,
    '--sac-cursor-color': cursorColor,
    '--sac-transition': reduced ? '0s' : `${safeDuration}s`,
  } as CSSProperties;

  const showDot = mode === 'dot' || mode === 'dot+ring';
  const showRing = mode === 'ring' || mode === 'dot+ring';

  return (
    <div
      ref={rootRef}
      className={`sac-root${hideOnTouch ? ' sac-root--hide-touch' : ''}`}
      style={vars}
    >
      {/* Demo-Sektionen, damit der Farbwechsel in der Vorschau sichtbar ist. */}
      <div className="sac-section sac-section--dark" data-cursor-theme="dark">
        <span className="sac-section-label">Dark Section</span>
      </div>
      <div className="sac-section sac-section--light" data-cursor-theme="light">
        <span className="sac-section-label">Light Section</span>
      </div>

      {/* Cursor-Layer: dekorativ, keine Pointer-Events. */}
      <div className="sac-cursor-layer" aria-hidden="true">
        {showDot && <div ref={cursorRef} className="sac-cursor" />}
        {showRing && <div ref={followRef} className="sac-follow" />}
      </div>

      <style>{`
        .sac-root {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          isolation: isolate;
        }
        .sac-section {
          position: relative;
          width: 100%;
          height: 50%;
          display: grid;
          place-items: center;
          user-select: none;
        }
        .sac-section--dark {
          background: #0a0a0b;
          color: #d4af37;
        }
        .sac-section--light {
          background: #e8e8e8;
          color: #0a0a0b;
        }
        .sac-section-label {
          font-family: var(--display, system-ui, sans-serif);
          font-size: 12px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          opacity: 0.55;
        }
        .sac-cursor-layer {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 10;
        }
        .sac-cursor {
          position: absolute;
          left: 0;
          top: 0;
          width: var(--sac-size);
          height: var(--sac-size);
          border-radius: 50%;
          background: var(--sac-cursor-color);
          transition: background var(--sac-transition) cubic-bezier(.445,.05,.55,.95);
          will-change: transform;
        }
        .sac-follow {
          position: absolute;
          left: 0;
          top: 0;
          width: var(--sac-follow-size);
          height: var(--sac-follow-size);
          border-radius: 50%;
          border: 1.5px solid var(--sac-cursor-color);
          transition: border-color var(--sac-transition) cubic-bezier(.445,.05,.55,.95);
          will-change: transform;
        }
        @media (prefers-reduced-motion: reduce) {
          .sac-cursor,
          .sac-follow {
            transition-duration: 0s !important;
          }
        }
        @media (pointer: coarse) {
          .sac-root--hide-touch .sac-cursor-layer {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

export default SectionAwareInvertedCursor;
