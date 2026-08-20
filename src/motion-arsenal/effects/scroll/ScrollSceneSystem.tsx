import { useMemo, useRef, useState, type CSSProperties } from 'react';
import { clamp, damp, lerp, smoothstep, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { EASE, NOX_COLORS } from '../../lib/motionPresets';
import { glyphPath } from '../../lib/svgUtils';


export type ScrollSceneLayout = 'free' | 'pinned';
export type ScrollScenePresetId =
  | 'restaurant'
  | 'beauty'
  | 'fitness'
  | 'local-service'
  | 'real-estate'
  | 'automotive'
  | 'healthcare'
  | 'finance'
  | 'saas'
  | 'ecommerce'
  | 'luxury'
  | 'creator';


export interface ScrollScenePreset {
  label: string;
  layout: ScrollSceneLayout;
  stations: number;
  damping: number;
  spin: number;
  morph: number;
  showRail: boolean;
  rotatePerSection: number;
  scalePulse: number;
  colorShift: boolean;
  objectScale: number;
  depth: number;
  accent: string;
}


export const SCROLL_SCENE_PRESETS: Record<ScrollScenePresetId, ScrollScenePreset> = {
  restaurant: { label: 'Restaurant / Hospitality', layout: 'pinned', stations: 4, damping: 8, spin: .62, morph: .42, showRail: false, rotatePerSection: 58, scalePulse: .12, colorShift: true, objectScale: 1.04, depth: .58, accent: '#D89B5B' },
  beauty: { label: 'Beauty / Wellness', layout: 'free', stations: 4, damping: 10, spin: .42, morph: .82, showRail: false, rotatePerSection: 48, scalePulse: .08, colorShift: true, objectScale: .94, depth: .44, accent: '#D9A8B8' },
  fitness: { label: 'Fitness / Sport', layout: 'pinned', stations: 5, damping: 7, spin: 1.35, morph: .72, showRail: true, rotatePerSection: 126, scalePulse: .24, colorShift: true, objectScale: 1.08, depth: .9, accent: '#FF5B2E' },
  'local-service': { label: 'Handwerk / Local Service', layout: 'free', stations: 4, damping: 8, spin: .8, morph: .42, showRail: true, rotatePerSection: 74, scalePulse: .12, colorShift: false, objectScale: 1, depth: .55, accent: '#F2B544' },
  'real-estate': { label: 'Immobilien', layout: 'pinned', stations: 4, damping: 11, spin: .32, morph: .28, showRail: false, rotatePerSection: 44, scalePulse: .06, colorShift: false, objectScale: 1.02, depth: .36, accent: '#C8B38A' },
  automotive: { label: 'Automotive', layout: 'pinned', stations: 5, damping: 8, spin: 1.15, morph: .48, showRail: true, rotatePerSection: 112, scalePulse: .16, colorShift: true, objectScale: 1.08, depth: .82, accent: '#C5D0D9' },
  healthcare: { label: 'Healthcare / Praxis', layout: 'free', stations: 4, damping: 12, spin: .25, morph: .35, showRail: false, rotatePerSection: 38, scalePulse: .04, colorShift: false, objectScale: .9, depth: .28, accent: '#69B8B4' },
  finance: { label: 'Kanzlei / Finance', layout: 'free', stations: 4, damping: 12, spin: .22, morph: .2, showRail: true, rotatePerSection: 34, scalePulse: .03, colorShift: false, objectScale: .94, depth: .24, accent: '#B8A46B' },
  saas: { label: 'SaaS / Tech', layout: 'pinned', stations: 4, damping: 8, spin: .92, morph: .66, showRail: true, rotatePerSection: 92, scalePulse: .16, colorShift: true, objectScale: 1, depth: .72, accent: '#62A7FF' },
  ecommerce: { label: 'E-Commerce', layout: 'pinned', stations: 5, damping: 8, spin: .85, morph: .55, showRail: true, rotatePerSection: 84, scalePulse: .18, colorShift: true, objectScale: 1.04, depth: .68, accent: '#F078B8' },
  luxury: { label: 'Luxury / Premium', layout: 'free', stations: 4, damping: 13, spin: .18, morph: .58, showRail: false, rotatePerSection: 28, scalePulse: .03, colorShift: false, objectScale: .92, depth: .22, accent: '#C5A56B' },
  creator: { label: 'Creator / Personal Brand', layout: 'pinned', stations: 5, damping: 7, spin: 1.05, morph: .88, showRail: true, rotatePerSection: 104, scalePulse: .22, colorShift: true, objectScale: 1.06, depth: .78, accent: '#B86CFF' },
};


export interface ScrollSceneSystemProps {
  preset?: ScrollScenePresetId;
  layout?: ScrollSceneLayout;
  stations?: number;
  damping?: number;
  spin?: number;
  morph?: number;
  showRail?: boolean;
  rotatePerSection?: number;
  scalePulse?: number;
  colorShift?: boolean;
  objectScale?: number;
  depth?: number;
  accent?: string;
  seed?: number;
}


interface SceneStation {
  x: number;
  y: number;
  rot: number;
  tilt: number;
  scale: number;
  br: [number, number, number, number];
  label: string;
  body: string;
}


const STATIONS: SceneStation[] = [
  { x: 24, y: 26, rot: 0, tilt: -12, scale: 1, br: [50, 50, 50, 50], label: 'ORIGIN', body: 'Set the first signal and establish the visual anchor.' },
  { x: 70, y: 31, rot: 108, tilt: 8, scale: .8, br: [14, 14, 14, 14], label: 'LOCK', body: 'Compress the scene into a deliberate second state.' },
  { x: 32, y: 52, rot: 238, tilt: -8, scale: 1.2, br: [62, 38, 58, 42], label: 'FLOW', body: 'Release the object into the middle narrative beat.' },
  { x: 71, y: 64, rot: 338, tilt: 12, scale: .92, br: [30, 70, 26, 74], label: 'SHIFT', body: 'Change emphasis without changing the scroll engine.' },
  { x: 45, y: 76, rot: 458, tilt: -4, scale: 1.28, br: [50, 50, 50, 50], label: 'PEAK', body: 'Reach the highest-energy product or story frame.' },
  { x: 52, y: 43, rot: 548, tilt: 6, scale: 1.02, br: [22, 78, 44, 56], label: 'SEAL', body: 'Resolve the scene in a stable final state.' },
];


function mixCorner(a: SceneStation['br'], b: SceneStation['br'], f: number, morph: number) {
  const m = (v: number) => 50 + (v - 50) * morph;
  const r = a.map((value, index) => lerp(m(value), m(b[index]), f));
  return `${r[0].toFixed(1)}% ${r[1].toFixed(1)}% ${r[2].toFixed(1)}% ${r[3].toFixed(1)}% / ${r[3].toFixed(1)}% ${r[2].toFixed(1)}% ${r[1].toFixed(1)}% ${r[0].toFixed(1)}%`;
}


export function ScrollSceneSystem(props: ScrollSceneSystemProps) {
  const preset = SCROLL_SCENE_PRESETS[props.preset ?? 'saas'];
  const layout = props.layout ?? preset.layout;
  const stationCount = clamp(Math.round(props.stations ?? preset.stations), 2, STATIONS.length);
  const defs = STATIONS.slice(0, stationCount);
  const damping = Math.max(2, props.damping ?? preset.damping);
  const spin = props.spin ?? preset.spin;
  const morph = clamp(props.morph ?? preset.morph, 0, 1);
  const showRail = props.showRail ?? preset.showRail;
  const rotatePerSection = props.rotatePerSection ?? preset.rotatePerSection;
  const scalePulse = clamp(props.scalePulse ?? preset.scalePulse, 0, .4);
  const colorShift = props.colorShift ?? preset.colorShift;
  const objectScale = Math.max(.55, props.objectScale ?? preset.objectScale);
  const depth = clamp(props.depth ?? preset.depth, 0, 1);
  const accent = props.accent ?? preset.accent;
  const seed = props.seed ?? 11;
  const reduced = usePrefersReducedMotion();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const objectRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const smooth = useRef(reduced ? 1 : 0);
  const ghostSmooth = useRef(reduced ? 1 : 0);
  const [active, setActive] = useState(reduced ? stationCount - 1 : 0);
  const glyph = useMemo(() => glyphPath(seed * 13 + 3, 120), [seed]);


  useRafLoop((dt) => {
    const scroller = scrollerRef.current;
    const object = objectRef.current;
    if (!scroller || !object) return;
    const raw = scroller.scrollTop / Math.max(1, scroller.scrollHeight - scroller.clientHeight);
    smooth.current = damp(smooth.current, raw, damping, dt);
    ghostSmooth.current = damp(ghostSmooth.current, raw, damping * .46, dt);
    const t = smooth.current * (stationCount - 1);
    const index = clamp(Math.floor(t), 0, stationCount - 2);
    const f = smoothstep(0, 1, t - index);
    const a = defs[index];
    const b = defs[index + 1];
    const current = clamp(Math.round(t), 0, stationCount - 1);
    setActive((previous) => previous === current ? previous : current);


    if (layout === 'free') {
      const x = lerp(a.x, b.x, f);
      const y = lerp(a.y, b.y, f);
      const rotation = lerp(a.rot, b.rot, f) * spin;
      const scale = lerp(a.scale, b.scale, f) * objectScale;
      object.style.left = `${x}%`;
      object.style.top = `${y}%`;
      object.style.transform = `translate(-50%,-50%) rotate(${rotation.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
      object.style.borderRadius = mixCorner(a.br, b.br, f, morph);
      const ghost = ghostRef.current;
      if (ghost) {
        const gt = ghostSmooth.current * (stationCount - 1);
        const gi = clamp(Math.floor(gt), 0, stationCount - 2);
        const gf = smoothstep(0, 1, gt - gi);
        const ga = defs[gi];
        const gb = defs[gi + 1];
        ghost.style.left = `${lerp(ga.x, gb.x, gf)}%`;
        ghost.style.top = `${lerp(ga.y, gb.y, gf)}%`;
        ghost.style.transform = `translate(-50%,-50%) rotate(${(lerp(ga.rot, gb.rot, gf) * spin).toFixed(1)}deg) scale(${(lerp(ga.scale, gb.scale, gf) * objectScale * (1 + depth * .16)).toFixed(3)})`;
        ghost.style.borderRadius = mixCorner(ga.br, gb.br, gf, morph);
      }
    } else {
      const rotationY = t * rotatePerSection * spin;
      const tilt = lerp(a.tilt, b.tilt, f);
      const breathing = 1 + Math.sin(t * Math.PI) * scalePulse * .35;
      const scale = lerp(a.scale, b.scale, f) * objectScale * breathing;
      object.style.transform = `rotateX(${tilt.toFixed(1)}deg) rotateY(${rotationY.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
      const stage = stageRef.current;
      if (stage && colorShift) stage.style.setProperty('--sss-accent', defs[current].label === 'LOCK' ? '#D4A24A' : accent);
    }
  }, !reduced);


  const final = defs[stationCount - 1];
  const initial = reduced ? final : defs[0];
  const freeRest: CSSProperties = {
    left: `${initial.x}%`, top: `${initial.y}%`,
    transform: `translate(-50%,-50%) rotate(${(initial.rot * spin).toFixed(1)}deg) scale(${(initial.scale * objectScale).toFixed(3)})`,
    borderRadius: mixCorner(initial.br, initial.br, 0, morph),
  };


  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', containerType: 'size', background: `radial-gradient(120% 100% at 18% 0%, color-mix(in srgb, ${accent} 10%, #101014) 0%, #09090b 62%)` }}>
      <style>{`
        .sss-scroll { scrollbar-width: thin; scrollbar-color: rgba(240,236,228,.18) transparent; }
        .sss-scroll::-webkit-scrollbar { width: 6px; }
        .sss-scroll::-webkit-scrollbar-thumb { background: rgba(240,236,228,.14); border-radius: 3px; }
        .sss-copy { transition: opacity .45s ${EASE.outExpo}, transform .45s ${EASE.outBack}; }
        .sss-copy[data-active="false"] { opacity:.28; transform:translateX(7px); }
        .sss-copy[data-active="true"] { opacity:1; transform:translateX(0); }
        @media (prefers-reduced-motion: reduce) { .sss-copy { transition:none !important; opacity:1 !important; transform:none !important; } }
      `}</style>


      {layout === 'free' ? (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
          <div ref={ghostRef} style={{ position: 'absolute', width: 'min(20cqw,20cqh)', aspectRatio: '1', border: `1px dashed ${accent}`, opacity: .24 + depth * .24, filter: `blur(${.5 + depth * 2}px)`, ...freeRest }} />
          <div ref={objectRef} style={{ position: 'absolute', width: 'min(20cqw,20cqh)', aspectRatio: '1', background: `linear-gradient(135deg,${accent},rgba(10,10,11,.92) 78%)`, boxShadow: `0 0 ${20 + depth * 30}px color-mix(in srgb, ${accent} 38%, transparent)`, willChange: 'transform,border-radius,left,top', ...freeRest }}>
            <div style={{ position:'absolute', inset:'30%', borderRadius:'inherit', border:'1px solid rgba(255,255,255,.32)' }} />
          </div>
          {showRail && <div style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', display:'grid', gap:10 }}>{defs.map((station,index)=><span key={station.label} style={{ width:7,height:7,borderRadius:'50%',background:index===active?accent:'rgba(255,255,255,.18)',boxShadow:index===active?`0 0 10px ${accent}`:'none',transform:index===active?'scale(1.5)':'scale(1)',transition:`all .35s ${EASE.outBack}` }} />)}</div>}
        </div>
      ) : (
        <div ref={stageRef} style={{ position:'absolute', inset:0, pointerEvents:'none', ['--sss-accent' as string]: accent }}>
          <div style={{ position:'absolute', left:'8%', top:'50%', transform:'translateY(-50%)', width:'min(36cqw,36cqh)', aspectRatio:'1', perspective:900 }}>
            <div ref={objectRef} style={{ position:'relative', width:'100%', height:'100%', transformStyle:'preserve-3d', transform: reduced ? `rotateX(${final.tilt}deg) rotateY(${(stationCount-1)*rotatePerSection*spin}deg) scale(${final.scale*objectScale})` : `rotateX(${initial.tilt}deg) scale(${initial.scale*objectScale})`, willChange:'transform' }}>
              {[-2,-1,0,1,2].map((z)=><div key={z} style={{ position:'absolute', inset:0, transform:`translateZ(${z*(12+depth*8)}px) rotate(${z*8}deg)`, border:'1px solid var(--sss-accent)', borderRadius:16, background:z===0?'rgba(20,16,18,.86)':'rgba(255,255,255,.02)', opacity:1-Math.abs(z)*.17, boxShadow:z===0?`0 0 ${24+depth*30}px color-mix(in srgb,var(--sss-accent) 34%,transparent)`:undefined }} />)}
              <svg viewBox="0 0 120 120" style={{ position:'absolute', inset:'18%', transform:`translateZ(${28+depth*14}px)`, overflow:'visible' }}><path d={glyph} fill="none" stroke="var(--sss-accent)" strokeWidth={2.4} strokeLinecap="round" /></svg>
            </div>
          </div>
        </div>
      )}


      <div ref={scrollerRef} className="sss-scroll" style={{ position:'absolute', inset:0, zIndex:2, overflowY:'auto', overflowX:'hidden' }}>
        {defs.map((station,index)=><section key={station.label} style={{ height:'100cqh', display:'flex', alignItems:layout==='pinned'?'center':'flex-end', justifyContent:layout==='pinned'?'flex-end':'flex-start', padding:'clamp(12px,5%,38px)' }}>
          <div className="sss-copy" data-active={reduced?'true':String(index===active)} style={{ width:layout==='pinned'?'min(46%,360px)':'auto', borderLeft:layout==='pinned'?`2px solid ${accent}`:undefined, paddingLeft:layout==='pinned'?14:0 }}>
            <div style={{ fontFamily:'var(--mono,monospace)', fontSize:10, letterSpacing:'.3em', color:accent }}>SCENE {String(index+1).padStart(2,'0')} // {station.label}</div>
            <div style={{ marginTop:5, fontSize:'clamp(14px,3.7cqw,25px)', fontWeight:760, color:NOX_COLORS.text }}>{station.label}</div>
            {layout==='pinned' && <div style={{ marginTop:8, maxWidth:340, fontSize:'clamp(10px,2.1cqw,13px)', lineHeight:1.5, color:NOX_COLORS.textDim }}>{station.body}</div>}
          </div>
        </section>)}
      </div>
      <div style={{ position:'absolute', top:12, left:14, zIndex:4, pointerEvents:'none', fontFamily:'var(--mono,monospace)', fontSize:9, letterSpacing:'.28em', color:NOX_COLORS.textDim }}>SCROLL SCENE // {layout.toUpperCase()}</div>
    </div>
  );
}


export default ScrollSceneSystem;
