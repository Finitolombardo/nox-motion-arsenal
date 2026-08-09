import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp, seededRandom, useInView, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { EASE, NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// GaugeNeedleSweep — NOX Data/System DNA.
// Analoges Gold-Tachometer: SVG-Skala zeichnet sich selbst, Ticks staggern
// deterministisch, die Nadel schwingt mit Feder-Overshoot auf den Zielwert
// und der Zahlenwert zählt parallel hoch. Einmalige Sequenz beim In-View:
// solange der Effekt außerhalb des Viewports ist, laufen KEINE CSS-Animationen
// (anim() liefert 'none'), erst beim In-View startet die Sequenz genau einmal
// (startedRef wird nur im Start-Zweig gesetzt). Reduced Motion setzt sofort
// den Endzustand ohne Animation. Danach 0 Laufzeitkosten (rAF nur während des
// Count-ups, dann gestoppt). Kein Canvas, kein WebGL.
// ---------------------------------------------------------------------------

export interface GaugeNeedleSweepProps {
  /** Zielwert auf der Skala. */
  value?: number;
  min?: number;
  max?: number;
  /** Anzahl Skalen-Ticks (inkl. Enden). */
  ticks?: number;
  /** Startposition der Nadel: 'min' = von 0, 'current' = vom aktuellen Wert. */
  sweep?: 'min' | 'current';
  /** Nadel-Überschwingen (0 = kein Overshoot, 1 = maximal). */
  overshoot?: number;
  speed?: number;
  color?: string;
  accentColor?: string;
  label?: string;
  unit?: string;
  /** Dezimalstellen des Wert-Labels. */
  decimals?: number;
  /** Maximale Breite des Gauges in px (SVG skaliert responsiv). */
  size?: number;
  seed?: number;
}

const START_DEG = -105;
const SWEEP_DEG = 210;
const CX = 100;
const CY = 100;
const RADIUS = 80;

const polar = (cx: number, cy: number, r: number, deg: number): [number, number] => {
  const rad = (deg * Math.PI) / 180;
  return [cx + r * Math.sin(rad), cy - r * Math.cos(rad)];
};

export function GaugeNeedleSweep({
  value = 75,
  min = 0,
  max = 100,
  ticks = 11,
  sweep = 'min',
  overshoot = 0.5,
  speed = 1,
  color = NOX_COLORS.gold,
  accentColor = NOX_COLORS.redBright,
  label = '',
  unit = '',
  decimals = 0,
  size = 320,
  seed = 7,
}: GaugeNeedleSweepProps) {
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef);

  const safeMin = Math.min(min, max);
  const safeMax = Math.max(min, max);
  const clampedValue = clamp(value, safeMin, safeMax);
  const sp = Math.max(0.2, speed);
  const tickCount = clamp(Math.round(ticks), 3, 31);
  const over = clamp(overshoot, 0, 1);

  // min === max: Skala hat keine Spannweite → Nadel bleibt bei START_DEG,
  // Werte bleiben endlich (keine Division durch 0).
  const span = safeMax - safeMin === 0 ? 1 : safeMax - safeMin;
  const startPct = sweep === 'min' ? 0 : clamp((clampedValue - safeMin) / span, 0, 1);
  const targetPct = (clampedValue - safeMin) / span;

  const rnd = useMemo(() => seededRandom(seed), [seed]);
  const ticksArr = useMemo(
    () =>
      Array.from({ length: tickCount }, (_, i) => ({
        pct: tickCount === 1 ? 0 : i / (tickCount - 1),
        // Deterministische Tick-Hierarchie (Haupttick länger) + Mikro-Variation.
        major: i % 2 === 0 || i === 0 || i === tickCount - 1,
        jitter: 0.5 + rnd() * 0.5,
      })),
    [tickCount, rnd],
  );

  // SVG-Bogen für die Skala (210° von START_DEG aus).
  const arc = useMemo(() => {
    const [x1, y1] = polar(CX, CY, RADIUS, START_DEG);
    const [x2, y2] = polar(CX, CY, RADIUS, START_DEG + SWEEP_DEG);
    return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${RADIUS} ${RADIUS} 0 1 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
  }, []);

  const [started, setStarted] = useState(false);
  const [counting, setCounting] = useState(false);
  const [display, setDisplay] = useState(startPct * span + safeMin);
  const startedRef = useRef(false);

  // Einmalige Sequenz: startet nur, wenn tatsächlich im Viewport.
  // startedRef wird AUSSCHLIESSLICH im Start-Zweig gesetzt — mountet der
  // Effekt below-fold, bleibt er false und die Sequenz startet beim ersten
  // In-View. Reduced Motion setzt direkt den Endzustand (auch dann gilt der
  // Effekt als "gestartet": keine spätere Animation mehr).
  // Wert-Änderungen nach dem Start: Label folgt (erneuter kurzer Count-up),
  // Nadel-Keyframes werden neu berechnet → Nadel zeigt auf den neuen Wert.
  useEffect(() => {
    if (startedRef.current) {
      if (reduced) {
        setDisplay(clampedValue);
        setCounting(false);
      } else {
        setCounting(true);
      }
      return;
    }
    if (reduced) {
      startedRef.current = true;
      setDisplay(clampedValue);
      setCounting(false);
      setStarted(true);
    } else if (inView) {
      startedRef.current = true;
      setCounting(true);
      setStarted(true);
    }
  }, [inView, reduced, clampedValue]);

  // Count-up des Wert-Labels — rAF nur während der Sweep-Sequenz, stoppt danach.
  useRafLoop(
    (dt, elapsed) => {
      const t = Math.min(elapsed / (0.9 / sp), 1);
      if (t >= 1) {
        setDisplay(clampedValue);
        setCounting(false);
        return;
      }
      // outExpo
      const eased = 1 - Math.pow(2, -10 * t);
      setDisplay(safeMin + (clampedValue - safeMin) * eased);
    },
    counting && !reduced,
  );

  const displayRounded = display.toFixed(decimals);
  const fromDeg = START_DEG + startPct * SWEEP_DEG;
  const toDeg = START_DEG + targetPct * SWEEP_DEG;
  const overDeg = (toDeg - fromDeg) * 0.06 * over;

  // Nadel per Web Animations API: startet beim In-View, restartet sauber bei
  // jedem Wertwechsel nach dem Start (CSS-Animationen restarten nicht bei
  // Keyframe-Änderung). Kein Remount — Fokus/State bleibt erhalten.
  const needleRef = useRef<SVGGElement>(null);
  useEffect(() => {
    const el = needleRef.current;
    if (!el || reduced || !started) return;
    const sweep = el.animate(
      [
        { transform: `rotate(${fromDeg.toFixed(2)}deg)` },
        { transform: `rotate(${(toDeg + overDeg).toFixed(2)}deg)`, offset: 0.72 },
        { transform: `rotate(${toDeg.toFixed(2)}deg)` },
      ],
      {
        duration: 950 / sp,
        delay: 550 / sp,
        easing: 'cubic-bezier(.34,1.56,.64,1)',
        fill: 'both',
      },
    );
    return () => sweep.cancel();
  }, [started, fromDeg, toDeg, overDeg, sp, reduced]);

  // Animation nur, wenn die Sequenz gestartet hat. reduced → nie animieren.
  // !started → 'none' (Effekt hängt im Ausgangszustand, Styles unten setzen
  // die initialen Werte). started → echte Sequenz.
  const anim = (name: string, dur: number, delay: number, ease: string = EASE.outExpo) =>
    reduced ? undefined : started ? `${name} ${dur.toFixed(2)}s ${ease} ${delay.toFixed(2)}s both` : 'none';

  return (
    <div
      ref={rootRef}
      className="gnds-root"
      style={{
        width: '100%',
        maxWidth: size,
        ['--gnds-color' as string]: color,
        ['--gnds-accent' as string]: accentColor,
      }}
    >
      <style>{`
        .gnds-root { position: relative; display: flex; flex-direction: column; align-items: center; gap: 6px; }
        .gnds-svg { width: 100%; height: auto; display: block; overflow: visible; }
        .gnds-track { fill: none; stroke: rgba(240,236,228,0.08); stroke-width: 7; stroke-linecap: round; }
        .gnds-scale { fill: none; stroke: var(--gnds-color); stroke-width: 7; stroke-linecap: round;
          filter: drop-shadow(0 0 6px color-mix(in srgb, var(--gnds-color) 45%, transparent)); }
        .gnds-tick { stroke: rgba(240,236,228,0.5); stroke-width: 2.5; stroke-linecap: round;
          opacity: 0; transform-origin: 100px 100px; }
        .gnds-tick.major { stroke-width: 3.5; stroke: rgba(240,236,228,0.82); }
        .gnds-needle-wrap { transform-origin: 100px 100px; }
        .gnds-needle { stroke: var(--gnds-accent); stroke-width: 3; stroke-linecap: round;
          filter: drop-shadow(0 0 5px color-mix(in srgb, var(--gnds-accent) 60%, transparent)); }
        .gnds-hub { fill: var(--gnds-accent); }
        .gnds-hub-ring { fill: rgba(3,4,8,0.9); stroke: color-mix(in srgb, var(--gnds-accent) 55%, transparent); stroke-width: 2; }
        .gnds-value { font: 700 30px/1 var(--mono, ui-monospace, monospace); color: var(--gnds-color);
          text-shadow: 0 0 14px color-mix(in srgb, var(--gnds-color) 40%, transparent);
          font-variant-numeric: tabular-nums; letter-spacing: 0.02em; }
        .gnds-unit { font: 600 11px/1 var(--mono, ui-monospace, monospace); color: rgba(240,236,228,0.38);
          letter-spacing: 0.22em; text-transform: uppercase; }
        .gnds-label { font: 600 10px/1 var(--mono, ui-monospace, monospace); color: rgba(240,236,228,0.55);
          letter-spacing: 0.26em; text-transform: uppercase; }
        @keyframes gndsDraw { to { stroke-dashoffset: 0; } }
        @keyframes gndsTickIn { to { opacity: 1; } }
      `}</style>

      <svg
        className="gnds-svg"
        viewBox="0 0 200 138"
        role="img"
        aria-label={`${label ? label + ': ' : ''}${displayRounded}${unit}`}
      >
        {/* Hintergrund-Track */}
        <path className="gnds-track" d={arc} />
        {/* Selbstzeichnende Skala — Ausgang: unsichtbar (offset 100), reduced: sofort gezeichnet */}
        <path
          className="gnds-scale"
          d={arc}
          pathLength={100}
          style={{
            strokeDasharray: 100,
            strokeDashoffset: reduced ? 0 : started ? undefined : 100,
            animation: anim('gndsDraw', 0.7 / sp, 0.1 / sp),
          }}
        />
        {/* Deterministische Ticks mit Stagger — Ausgang: opacity 0, reduced: sofort sichtbar */}
        {ticksArr.map((t, i) => {
          const deg = START_DEG + t.pct * SWEEP_DEG;
          const r1 = t.major ? 66 : 70;
          const [x1, y1] = polar(CX, CY, r1, deg);
          const [x2, y2] = polar(CX, CY, 74, deg);
          return (
            <line
              key={i}
              className={`gnds-tick${t.major ? ' major' : ''}`}
              x1={x1.toFixed(2)}
              y1={y1.toFixed(2)}
              x2={x2.toFixed(2)}
              y2={y2.toFixed(2)}
              style={{
                animation: anim('gndsTickIn', 0.25 / sp, (0.22 + i * 0.035) / sp),
                opacity: reduced ? 1 : started ? undefined : 0,
              }}
            />
          );
        })}
        {/* Nadel mit Overshoot — Ausgang: Startposition, reduced: sofort Zielposition.
            Nach Start übernimmt die WAAPI-Sequenz (needleRef) die Bewegung. */}
        <g
          ref={needleRef}
          className="gnds-needle-wrap"
          style={{
            transform: reduced || !started ? `rotate(${(reduced ? toDeg : fromDeg).toFixed(2)}deg)` : undefined,
          }}
        >
          <line className="gnds-needle" x1={CX} y1={CY} x2={CX} y2={30} />
          <circle className="gnds-hub-ring" cx={CX} cy={CY} r={9} />
          <circle className="gnds-hub" cx={CX} cy={CY} r={4.5} />
        </g>
      </svg>

      <div className="gnds-value">
        {displayRounded}
        {unit ? <span className="gnds-unit"> {unit}</span> : null}
      </div>
      {label ? <div className="gnds-label">{label}</div> : null}
    </div>
  );
}

export default GaugeNeedleSweep;
