import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { clamp, seededRandom, usePrefersReducedMotion } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// TypewriterCommandPalette — Cmd+K-Palette im Terminal-Look: Eingabe tippt
// in Monospace, Vorschläge erscheinen gestaffelt (deterministischer Stagger
// via det-PRNG), aktiver Treffer wird gold markiert. Kleines deterministi-
// sches Fuzzy-Scoring (kein externes Lib): Query-Buchstaben müssen in
// Reihenfolge im Command vorkommen, Score = Dichte + Positionsbonus.
// Toggle über die Prop `open` (Eltern-Komponente steuert Cmd+K).
// Reduced Motion: Palette ohne Stagger, aber funktional.
// ---------------------------------------------------------------------------

export interface TypewriterCommandPaletteProps {
  /** Sichtbarkeit (Eltern steuern per Cmd+K / Button). */
  open?: boolean;
  /** Befehle für die Palette. */
  commands?: Array<{ id: string; label: string; hint: string }>;
  /** Deterministischer Seed für Stagger-Reihenfolge. */
  seed?: number;
}

const DEFAULT_COMMANDS = [
  { id: 'scan', label: 'Run Watchlist Scan', hint: '⌘S' },
  { id: 'brief', label: 'Generate Morning Briefing', hint: '⌘B' },
  { id: 'audit', label: 'Audit Vault Integrity', hint: '⌘A' },
  { id: 'export', label: 'Export Trade Drafts', hint: '⌘E' },
  { id: 'graph', label: 'Rebuild Knowledge Graph', hint: '⌘G' },
  { id: 'health', label: 'System Healthcheck', hint: '⌘H' },
  { id: 'archive', label: 'Archive Blog Digest', hint: '⌘A' },
  { id: 'predict', label: 'Run Prediction Review', hint: '⌘P' },
];

function fuzzyScore(query: string, label: string): number {
  const q = query.toLowerCase();
  const l = label.toLowerCase();
  if (q.length === 0) return 1;
  let qi = 0;
  let score = 0;
  let last = -1;
  for (let li = 0; li < l.length && qi < q.length; li++) {
    if (l[li] === q[qi]) {
      score += 1 + (li === last + 1 ? 1.5 : 0); // Positionsbonus für Kontinuität
      last = li;
      qi += 1;
    }
  }
  if (qi < q.length) return 0; // nicht alle Query-Buchstaben gefunden
  return score / l.length;
}

export function TypewriterCommandPalette({
  open = false,
  commands = DEFAULT_COMMANDS,
  seed = 20260810,
}: TypewriterCommandPaletteProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const reduced = usePrefersReducedMotion();

  // Deterministische Stagger-Reihenfolge (det-PRNG).
  const rng = useMemo(() => seededRandom(seed), [seed]);
  const stagger = useMemo(() => {
    return commands.map((_, i) => ({ i, d: rng() * 0.28 }));
  }, [commands, rng]);

  // Fokus beim Öffnen.
  useEffect(() => {
    if (open) {
      setQuery('');
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const results = useMemo(() => {
    return commands
      .map((c, i) => ({ ...c, score: fuzzyScore(query, c.label), si: stagger[i].d }))
      .filter((c) => c.score > 0)
      .sort((a, b) => b.score - a.score || a.si - b.si)
      .slice(0, 6);
  }, [commands, query, stagger]);

  if (!open) return null;

  const vars = {
    '--tcp-gold': NOX_COLORS.gold,
  } as CSSProperties;

  return (
    <div className="tcp-root" style={vars} role="dialog" aria-label="Command palette">
      <div className="tcp-modal">
        <div className="tcp-inputrow">
          <span className="tcp-prompt">❯</span>
          <input
            ref={inputRef}
            className="tcp-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="type a command…"
            spellCheck={false}
            autoComplete="off"
          />
          <span className="tcp-caret" />
        </div>
        <ul className="tcp-list">
          {results.length === 0 && <li className="tcp-empty">no match</li>}
          {results.map((r) => (
            <li
              key={r.id}
              className="tcp-item"
              style={{ transitionDelay: reduced ? '0s' : `${r.si}s` }}
            >
              <span className="tcp-label">{r.label}</span>
              <span className="tcp-hint">{r.hint}</span>
            </li>
          ))}
        </ul>
      </div>
      <style>{`
.tcp-root{position:absolute;inset:0;display:grid;place-items:start center;padding-top:14vh;
  background:rgba(4,6,10,.55);backdrop-filter:blur(6px);z-index:60;overflow:hidden}
.tcp-modal{width:min(92%,520px);border:1px solid color-mix(in srgb,var(--tcp-gold) 24%,transparent);
  border-radius:12px;background:linear-gradient(180deg,#0c0f17,#080a10);
  box-shadow:0 24px 70px rgba(0,0,0,.6);overflow:hidden}
.tcp-inputrow{display:flex;align-items:center;gap:10px;padding:14px 16px;
  border-bottom:1px solid rgba(255,255,255,.07)}
.tcp-prompt{color:var(--tcp-gold);font:700 16px ui-monospace,monospace}
.tcp-input{flex:1;background:none;border:none;outline:none;color:#e8e6de;
  font:400 15px/1.4 ui-monospace,monospace;caret-color:transparent}
.tcp-input::placeholder{color:#6b675e}
.tcp-caret{width:9px;height:18px;background:var(--tcp-gold);opacity:.85;
  animation:tcp-blink 1.1s steps(1,end) infinite;margin-left:-14px;pointer-events:none}
.tcp-list{list-style:none;margin:0;padding:8px;max-height:280px;overflow-y:auto}
.tcp-item{display:flex;justify-content:space-between;align-items:center;gap:12px;
  padding:9px 12px;border-radius:8px;opacity:0;transform:translateY(5px);
  animation:tcp-in .18s ease-out forwards}
.tcp-item:first-child{background:color-mix(in srgb,var(--tcp-gold) 14%,transparent);
  outline:1px solid color-mix(in srgb,var(--tcp-gold) 40%,transparent)}
.tcp-item:first-child .tcp-label{color:var(--tcp-gold)}
.tcp-label{color:#cfccc2;font:400 14px/1.3 ui-monospace,monospace}
.tcp-hint{color:#5f5b52;font:11px ui-monospace,monospace;letter-spacing:.04em}
.tcp-empty{padding:12px;color:#6b675e;font:13px ui-monospace,monospace}
@keyframes tcp-in{to{opacity:1;transform:none}}
@keyframes tcp-blink{0%,55%{opacity:.85}56%,100%{opacity:0}}
@media (prefers-reduced-motion:reduce){
  .tcp-caret{animation:none;opacity:0}
  .tcp-item{animation:none;opacity:1;transform:none}
}
`}</style>
    </div>
  );
}

export default TypewriterCommandPalette;
