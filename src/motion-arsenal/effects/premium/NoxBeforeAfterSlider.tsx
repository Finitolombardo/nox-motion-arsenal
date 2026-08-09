import React, { useEffect, useId, useRef, useState } from 'react';

export type BeforeAfterVariant = 'website-redesign' | 'local-seo' | 'brand-refresh';

export interface NoxBeforeAfterSliderProps {
  variant?: BeforeAfterVariant;
  position?: number;
  orientation?: 'horizontal' | 'vertical';
  showLabels?: boolean;
  beforeImage?: string;
  afterImage?: string;
  beforeLabel?: string;
  afterLabel?: string;
  step?: number;
  accentColor?: string;
  onPositionChange?: (position: number) => void;
}

const PRESETS: Record<BeforeAfterVariant, { before: string; after: string; beforeLabel: string; afterLabel: string; title: string }> = {
  'website-redesign': {
    before: 'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1600&q=82',
    after: 'https://images.unsplash.com/photo-1559028012-481c04fa702d?auto=format&fit=crop&w=1600&q=82',
    beforeLabel: 'Before · generic site', afterLabel: 'After · conversion system', title: 'Website transformation',
  },
  'local-seo': {
    before: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1600&q=82',
    after: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1600&q=82',
    beforeLabel: 'Before · low visibility', afterLabel: 'After · local demand capture', title: 'Local growth transformation',
  },
  'brand-refresh': {
    before: 'https://images.unsplash.com/photo-1545235617-9465d2a55698?auto=format&fit=crop&w=1600&q=82',
    after: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?auto=format&fit=crop&w=1600&q=82',
    beforeLabel: 'Before · inconsistent brand', afterLabel: 'After · premium identity', title: 'Brand transformation',
  },
};

function clamp(value: number) {
  if (!Number.isFinite(value)) return 50;
  return Math.max(0, Math.min(100, value));
}

function clampStep(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.max(0.25, Math.min(25, value));
}

export function NoxBeforeAfterSlider({
  variant = 'website-redesign',
  position = 52,
  orientation = 'horizontal',
  showLabels = true,
  beforeImage,
  afterImage,
  beforeLabel,
  afterLabel,
  step = 1,
  accentColor = '#ffffff',
  onPositionChange,
}: NoxBeforeAfterSliderProps) {
  const preset = PRESETS[variant];
  const [value, setValue] = useState(clamp(position));
  const [dragging, setDragging] = useState(false);
  const [focused, setFocused] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const pendingValueRef = useRef<number | null>(null);
  const inputId = useId();
  const titleId = useId();
  const descriptionId = useId();
  const vertical = orientation === 'vertical';
  const safeStep = clampStep(step);

  const resolvedBeforeLabel = beforeLabel ?? preset.beforeLabel;
  const resolvedAfterLabel = afterLabel ?? preset.afterLabel;

  useEffect(() => setValue(clamp(position)), [position]);

  useEffect(() => () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
  }, []);

  const commitValue = (next: number) => {
    const clamped = clamp(next);
    setValue(clamped);
    onPositionChange?.(clamped);
  };

  const schedulePointerValue = (next: number) => {
    pendingValueRef.current = clamp(next);
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const pending = pendingValueRef.current;
      pendingValueRef.current = null;
      if (pending !== null) commitValue(pending);
    });
  };

  const setFromPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return;
    const next = vertical
      ? ((event.clientY - rect.top) / rect.height) * 100
      : ((event.clientX - rect.left) / rect.width) * 100;
    schedulePointerValue(next);
  };

  const releasePointer = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragging(false);
  };

  const clip = vertical
    ? `inset(0 0 ${100 - value}% 0)`
    : `inset(0 ${100 - value}% 0 0)`;

  return (
    <div className="nbas-stage">
      <style>{`
        .nbas-stage{position:absolute;inset:0;display:grid;place-items:center;padding:clamp(14px,3vw,30px);background:radial-gradient(circle at 50% 18%,rgba(201,48,48,.13),transparent 42%),#070708;color:#f4f1ea;font-family:var(--sans,system-ui,sans-serif)}
        .nbas-frame{position:relative;width:min(980px,100%);height:min(72vh,620px);min-height:320px;overflow:hidden;border:1px solid rgba(255,255,255,.12);border-radius:clamp(18px,3vw,30px);background:#111;box-shadow:0 34px 100px -42px rgba(0,0,0,.95);touch-action:none;isolation:isolate;cursor:ew-resize}
        .nbas-frame.vertical{cursor:ns-resize}
        .nbas-frame.dragging{box-shadow:0 36px 110px -40px rgba(0,0,0,.98),0 0 0 1px color-mix(in srgb,var(--nbas-accent) 30%,transparent)}
        .nbas-image{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;user-select:none;pointer-events:none}.nbas-after{filter:saturate(.78) brightness(.68)}.nbas-before{clip-path:var(--nbas-clip);filter:saturate(1.02) contrast(1.04)}
        .nbas-overlay{position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(0,0,0,.04),rgba(0,0,0,.45));z-index:2}.nbas-divider{position:absolute;z-index:5;background:var(--nbas-accent);box-shadow:0 0 0 1px rgba(0,0,0,.35),0 0 24px color-mix(in srgb,var(--nbas-accent) 50%,transparent);pointer-events:none}
        .nbas-divider.horizontal{top:0;bottom:0;left:var(--nbas-value);width:2px;transform:translateX(-1px)}.nbas-divider.vertical{left:0;right:0;top:var(--nbas-value);height:2px;transform:translateY(-1px)}
        .nbas-handle{position:absolute;left:50%;top:50%;width:52px;height:52px;display:grid;place-items:center;border-radius:50%;border:1px solid color-mix(in srgb,var(--nbas-accent) 85%,transparent);background:rgba(8,8,10,.76);backdrop-filter:blur(14px);transform:translate(-50%,-50%) scale(1);font-size:20px;box-shadow:0 8px 30px rgba(0,0,0,.45);transition:transform .18s ease,box-shadow .18s ease}
        .nbas-frame.dragging .nbas-handle{transform:translate(-50%,-50%) scale(1.08);box-shadow:0 10px 34px rgba(0,0,0,.5),0 0 28px color-mix(in srgb,var(--nbas-accent) 26%,transparent)}
        .nbas-frame.focused .nbas-handle{outline:3px solid color-mix(in srgb,var(--nbas-accent) 65%,transparent);outline-offset:4px}
        .nbas-label{position:absolute;z-index:6;top:18px;padding:8px 12px;border:1px solid rgba(255,255,255,.14);border-radius:999px;background:rgba(7,7,9,.68);backdrop-filter:blur(12px);font:700 10px/1 var(--mono,monospace);letter-spacing:.11em;text-transform:uppercase;pointer-events:none}.nbas-label.before{left:18px}.nbas-label.after{right:18px}
        .nbas-frame.vertical .nbas-label.before{top:18px;left:18px;right:auto}.nbas-frame.vertical .nbas-label.after{top:auto;right:18px;bottom:18px}
        .nbas-input{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:inherit;z-index:8;margin:0}.nbas-title{position:absolute;left:20px;bottom:18px;z-index:6;font-size:clamp(18px,3vw,34px);font-weight:760;letter-spacing:-.04em;text-shadow:0 2px 18px rgba(0,0,0,.7);pointer-events:none;max-width:min(70%,620px)}
        .nbas-frame.vertical .nbas-title{bottom:50%;transform:translateY(50%)}
        .nbas-sr{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}
        @media(max-width:620px){.nbas-frame{height:62vh;min-height:360px}.nbas-label{top:12px;font-size:8px;padding:7px 9px}.nbas-label.before{left:12px}.nbas-label.after{right:12px}.nbas-handle{width:46px;height:46px}.nbas-title{left:14px;bottom:14px;max-width:74%;font-size:clamp(17px,6vw,26px)}}
        @media(max-height:520px){.nbas-frame{height:82vh;min-height:260px}.nbas-title{font-size:clamp(16px,3vw,24px)}}
        @media(prefers-reduced-motion:reduce){.nbas-before,.nbas-after,.nbas-divider,.nbas-handle{transition:none!important}}
      `}</style>
      <div
        ref={rootRef}
        className={`nbas-frame ${vertical ? 'vertical' : 'horizontal'}${dragging ? ' dragging' : ''}${focused ? ' focused' : ''}`}
        style={{
          '--nbas-value': `${value}%`,
          '--nbas-clip': clip,
          '--nbas-accent': accentColor,
        } as React.CSSProperties}
        role="group"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onPointerDown={(event) => {
          if (event.pointerType === 'mouse' && event.button !== 0) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          setDragging(true);
          setFromPointer(event);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) setFromPointer(event);
        }}
        onPointerUp={releasePointer}
        onPointerCancel={releasePointer}
      >
        <img className="nbas-image nbas-after" src={afterImage ?? preset.after} alt="" aria-hidden="true" draggable={false} />
        <img className="nbas-image nbas-before" src={beforeImage ?? preset.before} alt="" aria-hidden="true" draggable={false} />
        <div className="nbas-overlay" />
        {showLabels && <>
          <span className="nbas-label before">{resolvedBeforeLabel}</span>
          <span className="nbas-label after">{resolvedAfterLabel}</span>
        </>}
        <div className={`nbas-divider ${orientation}`}>
          <span className="nbas-handle" aria-hidden="true">{vertical ? '↕' : '↔'}</span>
        </div>
        <div id={titleId} className="nbas-title">{preset.title}</div>
        <span id={descriptionId} className="nbas-sr">
          Compare {resolvedBeforeLabel} with {resolvedAfterLabel}. Use arrow keys or drag to change the reveal position.
        </span>
        <input
          id={inputId}
          className="nbas-input"
          type="range"
          min="0"
          max="100"
          step={safeStep}
          value={value}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(event) => commitValue(Number(event.target.value))}
          aria-label="Before and after comparison position"
          aria-orientation={orientation}
          aria-valuetext={`${Math.round(value)}% ${resolvedBeforeLabel}, ${Math.round(100 - value)}% ${resolvedAfterLabel}`}
        />
      </div>
    </div>
  );
}

export default NoxBeforeAfterSlider;
