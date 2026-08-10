import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import { usePrefersReducedMotion } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// SlidingPillTabs — NOX OriginKit DNA.
// Tab-Leiste, bei der eine Pille unter den aktiven Reiter gleitet. Die Position
// kommt aus einem einmaligen Messen per getBoundingClientRect und wird als
// Transform gesetzt — CSS Anchor Positioning wäre die elegantere Lösung, trägt
// aber noch nicht überall, und ein stiller Fallback ist hier mehr wert als die
// neuere Syntax. Gemessen wird nur bei Wechsel und Resize, nicht pro Frame.
// Als echte Tablist gebaut: Pfeiltasten, Home/End und roving tabindex.
// ---------------------------------------------------------------------------

export interface SlidingPillTabsProps {
  /** Reiter, mit / getrennt. */
  tabs?: string;
  /** Aktiver Reiter (0-basiert). */
  activeIndex?: number;
  /** Optik der Pille. */
  pill?: 'gold' | 'glass' | 'outline';
  /** Charakter des Übergangs. */
  ease?: 'elastic' | 'smooth' | 'snap';
  /** Farbe der Pille. */
  color?: string;
}

const EASINGS: Record<string, string> = {
  elastic: 'cubic-bezier(.34,1.56,.64,1)',
  smooth: 'cubic-bezier(.22,1,.36,1)',
  snap: 'cubic-bezier(.2,0,0,1)',
};

const DURATIONS: Record<string, string> = {
  elastic: '.52s',
  smooth: '.38s',
  snap: '.2s',
};

export function SlidingPillTabs({
  tabs = 'Overview / Motion / Data',
  activeIndex = 0,
  pill = 'gold',
  ease = 'elastic',
  color = NOX_COLORS.gold,
}: SlidingPillTabsProps) {
  const reduced = usePrefersReducedMotion();
  const listRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const labels = useMemo(
    () => tabs.split('/').map((t) => t.trim()).filter(Boolean),
    [tabs],
  );

  const [active, setActive] = useState(() => clampIndex(activeIndex, labels.length));
  const [pillBox, setPillBox] = useState<{ x: number; w: number } | null>(null);

  useEffect(() => {
    setActive(clampIndex(activeIndex, labels.length));
  }, [activeIndex, labels.length]);

  const measure = useCallback(() => {
    const list = listRef.current;
    const tab = tabRefs.current[active];
    if (!list || !tab) return;
    const listRect = list.getBoundingClientRect();
    const tabRect = tab.getBoundingClientRect();
    setPillBox({ x: tabRect.left - listRect.left, w: tabRect.width });
  }, [active]);

  // Layout-Effect, damit die Pille nie einen Frame lang falsch steht.
  useLayoutEffect(measure, [measure, labels]);

  useEffect(() => {
    const list = listRef.current;
    if (!list || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [measure]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const last = labels.length - 1;
    let next = active;
    if (event.key === 'ArrowRight') next = active >= last ? 0 : active + 1;
    else if (event.key === 'ArrowLeft') next = active <= 0 ? last : active - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = last;
    else return;
    event.preventDefault();
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  const style = {
    '--spt-color': color,
    '--spt-ease': EASINGS[ease] ?? EASINGS.elastic,
    '--spt-dur': reduced ? '0s' : (DURATIONS[ease] ?? DURATIONS.elastic),
    '--spt-x': `${pillBox?.x ?? 0}px`,
    '--spt-w': `${pillBox?.w ?? 0}px`,
  } as React.CSSProperties;

  return (
    <div className="nox-spt" style={style}>
      <style>{CSS}</style>
      <div
        ref={listRef}
        className={`nox-spt__list is-${pill}`}
        role="tablist"
        aria-label="Ansicht"
        onKeyDown={onKeyDown}
      >
        {/* Erst nach dem Messen einblenden, sonst blitzt sie links auf. */}
        <span className="nox-spt__pill" aria-hidden="true" data-ready={pillBox ? 'true' : 'false'} />
        {labels.map((label, index) => (
          <button
            key={`${label}-${index}`}
            ref={(node) => {
              tabRefs.current[index] = node;
            }}
            type="button"
            role="tab"
            id={`nox-spt-tab-${index}`}
            aria-selected={active === index}
            aria-controls={`nox-spt-panel-${index}`}
            tabIndex={active === index ? 0 : -1}
            className={`nox-spt__tab${active === index ? ' is-active' : ''}`}
            onClick={() => setActive(index)}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        className="nox-spt__panel"
        role="tabpanel"
        id={`nox-spt-panel-${active}`}
        aria-labelledby={`nox-spt-tab-${active}`}
        tabIndex={0}
      >
        <span className="nox-spt__panel-label">{labels[active]}</span>
      </div>
    </div>
  );
}

function clampIndex(value: number, length: number) {
  if (!Number.isFinite(value) || length === 0) return 0;
  return Math.min(Math.max(Math.round(value), 0), length - 1);
}

const CSS = String.raw`
.nox-spt { display:grid; place-content:center; gap:18px; width:100%; height:100%; padding:clamp(16px,4vw,36px); font-family:var(--sans,system-ui,sans-serif); }
.nox-spt__list { position:relative; display:flex; gap:4px; padding:5px; border-radius:999px; border:1px solid rgba(236,231,219,.09); background:rgba(255,255,255,.026); }
.nox-spt__pill { position:absolute; top:5px; bottom:5px; left:0; width:var(--spt-w); border-radius:999px; opacity:0; transform:translateX(var(--spt-x)); transition:transform var(--spt-dur) var(--spt-ease), width var(--spt-dur) var(--spt-ease); }
.nox-spt__pill[data-ready="true"] { opacity:1; }
.nox-spt__list.is-gold .nox-spt__pill { background:linear-gradient(100deg, var(--spt-color), color-mix(in srgb, var(--spt-color) 55%, #fff)); box-shadow:0 5px 18px color-mix(in srgb, var(--spt-color) 32%, transparent); }
.nox-spt__list.is-glass .nox-spt__pill { background:rgba(255,255,255,.11); backdrop-filter:blur(8px); border:1px solid rgba(255,255,255,.16); }
.nox-spt__list.is-outline .nox-spt__pill { background:transparent; border:1.5px solid var(--spt-color); }
.nox-spt__tab { position:relative; z-index:1; padding:9px 20px; border:0; border-radius:999px; background:transparent; color:rgba(236,231,219,.5); font:inherit; font-size:13px; font-weight:600; cursor:pointer; transition:color .26s ease; white-space:nowrap; }
.nox-spt__tab:focus-visible { outline:2px solid var(--spt-color); outline-offset:2px; }
.nox-spt__list.is-gold .nox-spt__tab.is-active { color:#14100a; }
.nox-spt__list.is-glass .nox-spt__tab.is-active, .nox-spt__list.is-outline .nox-spt__tab.is-active { color:#f4efe4; }
.nox-spt__panel { display:grid; place-items:center; min-height:74px; padding:18px; border-radius:14px; border:1px solid rgba(236,231,219,.07); background:rgba(255,255,255,.014); }
.nox-spt__panel:focus-visible { outline:2px solid var(--spt-color); outline-offset:2px; }
.nox-spt__panel-label { color:rgba(236,231,219,.34); font-size:11px; letter-spacing:.26em; text-transform:uppercase; }
@media (prefers-reduced-motion:reduce) { .nox-spt__pill, .nox-spt__tab { transition:none; } }
`;

export default SlidingPillTabs;
