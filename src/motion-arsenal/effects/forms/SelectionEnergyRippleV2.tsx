import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import { clamp, usePrefersReducedMotion } from '../../lib/animationUtils';
import {
  SELECTION_RIPPLE_ENERGIES,
  SELECTION_RIPPLE_ENERGY_PRESETS,
  SELECTION_RIPPLE_PRESETS,
  SELECTION_RIPPLE_VARIANTS,
  type SelectionRippleEnergy,
  type SelectionRippleVariant,
} from './SelectionEnergyRipple';

export interface SelectionEnergyRippleV2Props {
  accent?: string;
  sparkCount?: number;
  gravity?: number;
  variant?: SelectionRippleVariant;
  energy?: SelectionRippleEnergy;
  rippleScale?: number;
  showVariantSwitcher?: boolean;
  showEnergySwitcher?: boolean;
}

type Rgb = readonly [number, number, number];

type Spark = {
  x: number;
  y: number;
  px: number;
  py: number;
  vx: number;
  vy: number;
  life: number;
  total: number;
  size: number;
  color: Rgb;
};

type RippleEvent = {
  id: number;
  x: number;
  y: number;
};

const rgba = (rgb: Rgb, alpha: number) => `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${clamp(alpha, 0, 1)})`;
const finite = (value: number, fallback: number) => (Number.isFinite(value) ? value : fallback);

const STYLES = `
.ser2-root{--ser2-primary:255,76,56;--ser2-secondary:218,155,65;--ser2-success:112,238,166;position:absolute;inset:0;overflow:hidden;isolation:isolate;font-family:var(--sans,sans-serif);container-type:size}.ser2-root *{box-sizing:border-box}.ser2-grid{position:absolute;inset:0;opacity:.1;background-image:linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:30px 30px;mask-image:radial-gradient(ellipse at center,#000 18%,transparent 78%)}.ser2-aura{position:absolute;inset:-35%;background:conic-gradient(from 125deg at 50% 50%,transparent 0 20%,rgba(var(--ser2-primary),.1) 29%,transparent 41% 58%,rgba(var(--ser2-secondary),.08) 68%,transparent 80%);filter:blur(48px);animation:ser2-aura 24s linear infinite}.ser2-vignette{position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 36%,rgba(0,0,0,.68) 100%);pointer-events:none}.ser2-top{position:absolute;left:14px;right:14px;top:14px;z-index:10;display:flex;justify-content:space-between;align-items:flex-start;gap:10px;pointer-events:none}.ser2-controls{display:flex;flex-wrap:wrap;gap:5px;pointer-events:auto;max-width:min(70%,390px)}.ser2-pill{appearance:none;border:1px solid rgba(255,255,255,.1);background:rgba(4,4,8,.65);color:rgba(255,255,255,.46);border-radius:999px;padding:6px 9px;font:700 7.5px/1 var(--mono,monospace);letter-spacing:.12em;cursor:pointer;backdrop-filter:blur(10px);transition:border-color .2s ease,color .2s ease,transform .2s ease}.ser2-pill:hover{transform:translateY(-1px);border-color:rgba(var(--ser2-secondary),.35);color:rgba(255,255,255,.78)}.ser2-pill[data-active='true']{color:rgb(var(--ser2-success));border-color:rgba(var(--ser2-primary),.55);box-shadow:0 0 16px rgba(var(--ser2-primary),.18)}.ser2-pill:focus-visible,.ser2-option:focus-visible,.ser2-copy:focus-visible{outline:2px solid rgb(var(--ser2-secondary));outline-offset:3px}.ser2-counter{position:absolute;right:16px;top:62px;z-index:8;border:1px solid rgba(var(--ser2-secondary),.34);border-radius:12px;padding:9px 13px;background:rgba(10,8,5,.72);backdrop-filter:blur(12px);font:750 9px/1 var(--mono,monospace);letter-spacing:.14em;color:rgb(var(--ser2-secondary));box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 20px 50px -34px rgba(var(--ser2-secondary),.9)}.ser2-counter[data-flash='true']{animation:ser2-counter .58s cubic-bezier(.34,1.56,.64,1) both}.ser2-counter-value{font-size:15px;color:rgb(var(--ser2-success));margin-right:5px}.ser2-panel{position:absolute;left:50%;top:52%;width:min(90%,500px);transform:translate(-50%,-50%);padding:clamp(18px,3.7cqw,36px);border-radius:24px;border:1px solid rgba(var(--ser2-success),.12);background:linear-gradient(155deg,rgba(255,255,255,.06),rgba(9,9,14,.76));box-shadow:inset 0 1px 0 rgba(255,255,255,.1),inset 0 0 48px rgba(0,0,0,.36),0 44px 110px -60px rgba(var(--ser2-primary),.85);backdrop-filter:blur(15px);overflow:hidden}.ser2-panel::before{content:'';position:absolute;inset:0;background:linear-gradient(115deg,transparent 35%,rgba(var(--ser2-success),.055) 49%,transparent 61%);transform:translateX(-75%);animation:ser2-sweep 8s ease-in-out infinite;pointer-events:none}.ser2-kicker{font:700 7.5px/1 var(--mono,monospace);letter-spacing:.31em;color:rgba(var(--ser2-secondary),.72);margin-bottom:9px}.ser2-question{font-size:clamp(17px,3cqw,27px);font-weight:830;line-height:1.07;letter-spacing:-.03em;color:rgb(var(--ser2-success));max-width:31ch;margin-bottom:18px}.ser2-options{display:flex;flex-direction:column;gap:7px}.ser2-option{position:relative;text-align:left;padding:12px 14px;border-radius:11px;border:1px solid rgba(var(--ser2-success),.09);background:rgba(8,8,12,.64);color:rgba(var(--ser2-success),.5);font:750 10px/1 var(--mono,monospace);letter-spacing:.13em;cursor:pointer;overflow:hidden;transition:transform .32s cubic-bezier(.16,1,.3,1),border-color .25s ease,background .25s ease,color .25s ease,opacity .25s ease}.ser2-option:hover{border-color:rgba(var(--ser2-secondary),.4);color:rgba(var(--ser2-success),.8);transform:translateX(4px)}.ser2-option[data-selected='true']{border-color:rgba(var(--ser2-primary),.82);background:linear-gradient(90deg,rgba(var(--ser2-primary),.19),rgba(var(--ser2-secondary),.06));color:rgb(var(--ser2-success));transform:translateX(7px);box-shadow:0 0 25px -12px rgba(var(--ser2-primary),.92)}.ser2-option[data-dim='true']{opacity:.43}.ser2-index{display:inline-flex;width:25px;color:rgba(var(--ser2-secondary),.82)}.ser2-option-line{position:absolute;left:0;top:0;bottom:0;width:2px;background:linear-gradient(180deg,transparent,rgb(var(--ser2-primary)),transparent);transform:scaleY(0);transition:transform .32s cubic-bezier(.16,1,.3,1)}.ser2-option[data-selected='true'] .ser2-option-line{transform:scaleY(1)}.ser2-ripple-scale{position:absolute;inset:0;pointer-events:none;z-index:6}.ser2-ripple{position:absolute;width:82px;height:82px;border:1.5px solid rgb(var(--ser2-primary));border-radius:50%;pointer-events:none;transform:translate(-50%,-50%) scale(.08);filter:drop-shadow(0 0 12px rgba(var(--ser2-primary),.75));animation:ser2-ring .86s cubic-bezier(.16,1,.3,1) both}.ser2-ripple::after{content:'';position:absolute;inset:17%;border:1px solid rgba(var(--ser2-secondary),.8);border-radius:inherit}.ser2-canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:7}.ser2-footer{position:absolute;left:16px;bottom:15px;z-index:8}.ser2-title{font-size:10px;font-weight:800;letter-spacing:.16em;color:rgb(var(--ser2-success));text-transform:uppercase}.ser2-footer-kicker{margin-top:5px;font:700 7px/1 var(--mono,monospace);letter-spacing:.25em;color:rgba(var(--ser2-success),.34)}.ser2-copy{position:absolute;right:16px;bottom:14px;z-index:8;border:1px solid rgba(255,255,255,.1);background:rgba(4,4,8,.64);color:rgba(255,255,255,.54);padding:7px 10px;border-radius:8px;font:700 8px/1 var(--mono,monospace);letter-spacing:.12em;cursor:pointer}.ser2-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}@keyframes ser2-aura{to{transform:rotate(360deg)}}@keyframes ser2-sweep{0%,14%{transform:translateX(-80%);opacity:.2}55%{opacity:1}88%,100%{transform:translateX(110%);opacity:.2}}@keyframes ser2-ring{0%{transform:translate(-50%,-50%) scale(.08);opacity:.95}100%{transform:translate(-50%,-50%) scale(5.4);opacity:0}}@keyframes ser2-counter{0%{transform:scale(1)}28%{transform:scale(1.16);box-shadow:0 0 28px rgba(var(--ser2-secondary),.72)}100%{transform:scale(1)}}@media(max-width:650px){.ser2-top{gap:6px}.ser2-controls{max-width:72%}.ser2-counter{top:auto;bottom:14px;right:14px}.ser2-panel{top:52%;width:94%;padding:17px}.ser2-copy,.ser2-footer{display:none}}@media(max-height:560px){.ser2-panel{top:54%;padding:13px 16px}.ser2-question{margin-bottom:10px}.ser2-options{gap:5px}.ser2-option{padding:9px 12px}}@media(prefers-reduced-motion:reduce){.ser2-aura,.ser2-panel::before,.ser2-ripple,.ser2-counter{animation:none!important}.ser2-option,.ser2-pill{transition:none!important}}
`;

function seededUnit(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export function SelectionEnergyRippleV2({
  accent,
  sparkCount = 14,
  gravity = 480,
  variant = 'lock-in-shockwave',
  energy = 'charged',
  rippleScale = 1,
  showVariantSwitcher = true,
  showEnergySwitcher = true,
}: SelectionEnergyRippleV2Props) {
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const counterRef = useRef<HTMLDivElement>(null);
  const sparksRef = useRef<Spark[]>([]);
  const rafRef = useRef<number | null>(null);
  const timerIds = useRef(new Set<number>());
  const rippleId = useRef(0);
  const seedRef = useRef(1);
  const lastFrameRef = useRef(0);
  const canvasSizeRef = useRef({ w: 0, h: 0, dpr: 0 });

  const [activeVariant, setActiveVariant] = useState<SelectionRippleVariant>(variant);
  const [activeEnergy, setActiveEnergy] = useState<SelectionRippleEnergy>(energy);
  const [selected, setSelected] = useState<number | null>(null);
  const [count, setCount] = useState(0);
  const [combo, setCombo] = useState(1);
  const [ripples, setRipples] = useState<RippleEvent[]>([]);
  const [flashToken, setFlashToken] = useState(0);
  const [copied, setCopied] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => setActiveVariant(variant), [variant]);
  useEffect(() => setActiveEnergy(energy), [energy]);

  const schedule = (callback: () => void, delay: number) => {
    const id = window.setTimeout(() => {
      timerIds.current.delete(id);
      callback();
    }, delay);
    timerIds.current.add(id);
    return id;
  };

  useEffect(() => () => {
    timerIds.current.forEach((id) => window.clearTimeout(id));
    timerIds.current.clear();
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  const preset = SELECTION_RIPPLE_PRESETS[activeVariant];
  const energyPreset = SELECTION_RIPPLE_ENERGY_PRESETS[activeEnergy];
  const safeSparkCount = clamp(Math.round(finite(sparkCount, 14)), 4, 48);
  const safeGravity = clamp(finite(gravity, 480), -1600, 2400);
  const safeRippleScale = clamp(Math.abs(finite(rippleScale, 1)), 0.25, 3);

  const resolvedPrimary = useMemo<Rgb>(() => {
    if (!accent || !/^#[0-9a-f]{6}$/i.test(accent)) return preset.primary;
    return [Number.parseInt(accent.slice(1, 3), 16), Number.parseInt(accent.slice(3, 5), 16), Number.parseInt(accent.slice(5, 7), 16)];
  }, [accent, preset.primary]);

  const ensureCanvas = () => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return null;
    const rect = root.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    const previous = canvasSizeRef.current;
    if (previous.w !== width || previous.h !== height || previous.dpr !== dpr) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvasSizeRef.current = { w: width, h: height, dpr };
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, width, height };
  };

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const syncCanvasSize = () => { ensureCanvas(); };
    syncCanvasSize();
    const observer = new ResizeObserver(syncCanvasSize);
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  const runFrame = (now: number) => {
    const surface = ensureCanvas();
    if (!surface) {
      rafRef.current = null;
      return;
    }
    const dt = clamp(lastFrameRef.current ? (now - lastFrameRef.current) / 1000 : 1 / 60, 1 / 240, 1 / 24);
    lastFrameRef.current = now;
    const { ctx, width, height } = surface;
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'lighter';

    const alive: Spark[] = [];
    for (const spark of sparksRef.current) {
      spark.life -= dt;
      if (spark.life <= 0) continue;
      spark.px = spark.x;
      spark.py = spark.y;
      spark.vy += safeGravity * dt;
      spark.x += spark.vx * dt;
      spark.y += spark.vy * dt;
      const progress = clamp(1 - spark.life / spark.total, 0, 1);
      const alpha = Math.sin(progress * Math.PI) * energyPreset.glow;
      ctx.strokeStyle = rgba(spark.color, alpha * 0.48);
      ctx.lineWidth = Math.max(0.7, spark.size * 0.58);
      ctx.beginPath();
      ctx.moveTo(spark.x, spark.y);
      ctx.lineTo(spark.px - spark.vx * 0.018, spark.py - spark.vy * 0.018);
      ctx.stroke();
      ctx.fillStyle = rgba(spark.color, alpha);
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, spark.size * (0.8 + progress * 0.75), 0, Math.PI * 2);
      ctx.fill();
      alive.push(spark);
    }
    sparksRef.current = alive;

    if (alive.length > 0 && !reduced) {
      rafRef.current = requestAnimationFrame(runFrame);
    } else {
      ctx.clearRect(0, 0, width, height);
      rafRef.current = null;
      lastFrameRef.current = 0;
    }
  };

  const startCanvas = () => {
    if (reduced || rafRef.current !== null) return;
    lastFrameRef.current = 0;
    rafRef.current = requestAnimationFrame(runFrame);
  };

  const addRipple = (x: number, y: number) => {
    const id = ++rippleId.current;
    setRipples((current) => [...current.slice(-3), { id, x, y }]);
    schedule(() => setRipples((current) => current.filter((item) => item.id !== id)), 1050);
  };

  const getOrigin = (event: MouseEvent<HTMLButtonElement>) => {
    const root = rootRef.current?.getBoundingClientRect();
    if (!root) return null;
    if (event.detail === 0 || event.clientX === 0 || event.clientY === 0) {
      const button = event.currentTarget.getBoundingClientRect();
      return { root, x: button.left - root.left + button.width / 2, y: button.top - root.top + button.height / 2 };
    }
    return { root, x: event.clientX - root.left, y: event.clientY - root.top };
  };

  const select = (index: number, event: MouseEvent<HTMLButtonElement>) => {
    const origin = getOrigin(event);
    if (!origin) return;
    const wasSelected = selected;
    setSelected(index);
    setCombo((value) => Math.min(9, wasSelected === null || wasSelected === index ? value : value + 1));
    if (!reduced) addRipple(origin.x, origin.y);

    const complete = () => {
      setCount((value) => {
        const next = value + 1;
        setAnnouncement(`${preset.options[index]} locked. ${next} choices confirmed.`);
        return next;
      });
      setFlashToken((value) => value + 1);
    };

    if (reduced) {
      complete();
      return;
    }

    const target = counterRef.current?.getBoundingClientRect();
    const tx = target ? target.left - origin.root.left + target.width / 2 : origin.root.width - 45;
    const ty = target ? target.top - origin.root.top + target.height / 2 : 42;
    const totalSparks = clamp(Math.round(safeSparkCount * energyPreset.sparks), 4, 48);
    let longestFlight = 0;

    for (let i = 0; i < totalSparks; i++) {
      const seed = seedRef.current++;
      const u1 = seededUnit(seed);
      const u2 = seededUnit(seed + 13);
      const u3 = seededUnit(seed + 29);
      const flight = (0.48 + u1 * 0.28) / energyPreset.speed;
      longestFlight = Math.max(longestFlight, flight);
      const spread = (u2 - 0.5) * 94 * energyPreset.glow;
      const vx = (tx - origin.x) / flight + spread;
      const vy = (ty - origin.y) / flight - 0.5 * safeGravity * flight + (u3 - 0.5) * 70;
      sparksRef.current.push({
        x: origin.x,
        y: origin.y,
        px: origin.x,
        py: origin.y,
        vx,
        vy,
        life: flight,
        total: flight,
        size: 1.05 + seededUnit(seed + 41) * 1.75,
        color: seededUnit(seed + 53) > 0.5 ? preset.secondary : resolvedPrimary,
      });
    }

    startCanvas();
    schedule(complete, Math.round(longestFlight * 1000));
  };

  const copyReference = async () => {
    try {
      await navigator.clipboard.writeText(`${preset.reference} + energy:${activeEnergy}`);
      setCopied(true);
      schedule(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  const style = {
    '--ser2-primary': resolvedPrimary.join(','),
    '--ser2-secondary': preset.secondary.join(','),
    '--ser2-success': preset.success.join(','),
    background: preset.background,
  } as CSSProperties;

  return (
    <div ref={rootRef} className="ser2-root" data-variant={activeVariant} data-energy={activeEnergy} style={style}>
      <style>{STYLES}</style>
      <div className="ser2-grid" />
      <div className="ser2-aura" />
      <div className="ser2-vignette" />

      <div className="ser2-top">
        {showVariantSwitcher ? (
          <div className="ser2-controls" aria-label="Selection ripple variants">
            {SELECTION_RIPPLE_VARIANTS.map((id) => (
              <button key={id} type="button" className="ser2-pill" aria-pressed={id === activeVariant} data-active={id === activeVariant} onClick={() => { setActiveVariant(id); setSelected(null); }}>
                {SELECTION_RIPPLE_PRESETS[id].shortLabel}
              </button>
            ))}
          </div>
        ) : <span />}
        {showEnergySwitcher ? (
          <div className="ser2-controls" aria-label="Selection energy">
            {SELECTION_RIPPLE_ENERGIES.map((id) => (
              <button key={id} type="button" className="ser2-pill" aria-pressed={id === activeEnergy} data-active={id === activeEnergy} onClick={() => setActiveEnergy(id)}>
                {SELECTION_RIPPLE_ENERGY_PRESETS[id].label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div ref={counterRef} className="ser2-counter" data-flash={flashToken > 0 ? 'true' : 'false'} key={flashToken} aria-label={`${count} choices locked`}>
        <span className="ser2-counter-value">{count}</span> LOCKED <span style={{ color: rgba(preset.primary, .48), marginLeft: 7 }}>×{combo}</span>
      </div>

      <div className="ser2-panel">
        <div className="ser2-kicker">{preset.kicker}</div>
        <div className="ser2-question">{preset.question}</div>
        <div className="ser2-options">
          {preset.options.map((option, index) => (
            <button
              key={option}
              type="button"
              className="ser2-option"
              aria-pressed={selected === index}
              data-selected={selected === index}
              data-dim={selected !== null && selected !== index}
              onClick={(event) => select(index, event)}
            >
              <span className="ser2-option-line" />
              <span className="ser2-index">0{index + 1}</span>
              {option}
            </button>
          ))}
        </div>
      </div>

      {ripples.map((ripple) => (
        <div
          key={ripple.id}
          className="ser2-ripple-scale"
          style={{ transform: `scale(${safeRippleScale})`, transformOrigin: `${ripple.x}px ${ripple.y}px` }}
        >
          <div className="ser2-ripple" style={{ left: ripple.x, top: ripple.y }} />
        </div>
      ))}

      <canvas ref={canvasRef} className="ser2-canvas" aria-hidden="true" />
      <div className="ser2-footer"><div className="ser2-title">{preset.label}</div><div className="ser2-footer-kicker">SELECT // COLLAPSE // CONFIRM</div></div>
      <button type="button" className="ser2-copy" onClick={copyReference}>{copied ? 'COPIED' : 'COPY CONFIG'}</button>
      <div className="ser2-sr" aria-live="polite">{announcement}</div>
    </div>
  );
}

export default SelectionEnergyRippleV2;
