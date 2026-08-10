import { useMemo, useState, type CSSProperties } from 'react';
import { seededRandom, usePrefersReducedMotion } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// ViewTransitionListFilter — Filter-Chips sortieren eine Liste: Jedes Item
// trägt eine deterministisch generierte `view-transition-name` (sanitized
// aus der Item-ID, NIE der Index — sonst vertauschen sich Snapshot-
// Zuordnungen beim Reorder). Der Filter-Click läuft in
// `document.startViewTransition(() => setFilter(f))` — der Browser morpht
// die Items nativ an ihre neue Position (FLIP ohne Library). Feature-Detect
// + prefers-reduced-motion-Guard (Fallback: direkter Update).
// ---------------------------------------------------------------------------

export interface ViewTransitionListFilterProps {
  /** Items mit id + label + Kategorie. */
  items?: Array<{ id: string; label: string; group: string }>;
  /** Deterministischer Seed für view-transition-names. */
  seed?: number;
}

const DEFAULT_ITEMS = [
  { id: 'alpha-01', label: 'Alpha Signal', group: 'signals' },
  { id: 'beta-02', label: 'Beta Carrier', group: 'carriers' },
  { id: 'gamma-03', label: 'Gamma Pulse', group: 'pulses' },
  { id: 'delta-04', label: 'Delta Wave', group: 'signals' },
  { id: 'epsilon-05', label: 'Epsilon Link', group: 'carriers' },
  { id: 'zeta-06', label: 'Zeta Burst', group: 'pulses' },
  { id: 'eta-07', label: 'Eta Drift', group: 'signals' },
  { id: 'theta-08', label: 'Theta Lock', group: 'carriers' },
];

const GROUPS = ['all', 'signals', 'carriers', 'pulses'];

function sanitizeViewTransitionName(id: string): string {
  return `nvt-${id.replace(/[^a-z0-9-_]/gi, '-').toLowerCase()}`;
}

export function ViewTransitionListFilter({
  items = DEFAULT_ITEMS,
  seed = 20260810,
}: ViewTransitionListFilterProps) {
  const [filter, setFilter] = useState('all');
  const reduced = usePrefersReducedMotion();

  // Deterministische view-transition-names aus der Item-ID.
  const rng = useMemo(() => seededRandom(seed), [seed]);
  const names = useMemo(() => {
    const map = new Map<string, string>();
    for (const it of items) {
      const base = sanitizeViewTransitionName(it.id);
      map.set(it.id, map.has(it.id) ? `${base}-${Math.floor(rng() * 1e6)}` : base);
    }
    return map;
  }, [items, rng]);

  const visible = useMemo(
    () => (filter === 'all' ? items : items.filter((it) => it.group === filter)),
    [items, filter]
  );

  const applyFilter = (f: string) => {
    if (f === filter) return;
    // Feature-Detect + Reduced-Motion-Guard.
    const supports = typeof document !== 'undefined' && 'startViewTransition' in document;
    if (!supports || reduced) {
      setFilter(f);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc = document as any;
    doc.startViewTransition(() => setFilter(f));
  };

  const vars = {
    '--nvt-gold': NOX_COLORS.gold,
  } as CSSProperties;

  return (
    <div className="nvt-root" style={vars}>
      <div className="nvt-chips">
        {GROUPS.map((g) => (
          <button
            key={g}
            type="button"
            className={`nvt-chip ${filter === g ? 'nvt-chip--active' : ''}`}
            onClick={() => applyFilter(g)}
          >
            {g}
          </button>
        ))}
      </div>
      <ul className="nvt-list">
        {visible.map((it) => (
          <li
            key={it.id}
            className="nvt-item"
            style={{ viewTransitionName: names.get(it.id) } as CSSProperties}
          >
            <span className="nvt-dot" />
            <span className="nvt-label">{it.label}</span>
            <span className="nvt-group">{it.group}</span>
          </li>
        ))}
      </ul>
      <style>{`
.nvt-root{position:absolute;inset:0;display:flex;flex-direction:column;gap:16px;
  padding:6%;overflow:hidden;
  background:radial-gradient(120% 90% at 50% 30%,#0d1019,#06080c)}
.nvt-chips{display:flex;gap:8px;flex-wrap:wrap}
.nvt-chip{background:none;border:1px solid rgba(255,255,255,.16);color:#8a8578;
  font:600 11px/1 ui-monospace,monospace;letter-spacing:.1em;padding:9px 14px;
  border-radius:999px;cursor:pointer;transition:border-color .2s,color .2s,background .2s}
.nvt-chip:hover{border-color:var(--nvt-gold);color:var(--nvt-gold)}
.nvt-chip--active{background:var(--nvt-gold);border-color:var(--nvt-gold);color:#0a0c10}
.nvt-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px;
  max-height:60%;overflow-y:auto}
.nvt-item{display:flex;align-items:center;gap:12px;padding:13px 16px;border-radius:10px;
  background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07)}
.nvt-dot{width:8px;height:8px;border-radius:50%;background:var(--nvt-gold);
  box-shadow:0 0 10px color-mix(in srgb,var(--nvt-gold) 60%,transparent)}
.nvt-label{flex:1;color:#e8e6de;font:500 14px/1.3 ui-monospace,monospace}
.nvt-group{color:#5f5b52;font:10px ui-monospace,monospace;letter-spacing:.14em;
  text-transform:uppercase}
`}</style>
    </div>
  );
}

export default ViewTransitionListFilter;
