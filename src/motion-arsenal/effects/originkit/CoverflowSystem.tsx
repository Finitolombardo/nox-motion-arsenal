import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';


export type CoverflowMode = 'slat' | 'depth';
export type CoverflowPresetId = 'restaurant' | 'beauty' | 'automotive' | 'ecommerce' | 'luxury' | 'creator';
export interface CoverflowItem { src?: string; srcUrl?: string; alt?: string; title?: string }
export interface CoverflowSystemProps {
  items?: CoverflowItem[];
  mode?: CoverflowMode;
  activeWidth?: number; activeHeight?: number;
  sideWidth?: number; sideHeight?: number;
  gap?: number; depth?: number; tilt?: number; sideTilt?: number;
  sideOpacity?: number; sideScale?: number; radius?: number;
  autoplay?: boolean; autoplayDirection?: 'leftToRight' | 'rightToLeft'; autoplayDelay?: number;
  duration?: number; loop?: boolean; arrows?: boolean; keyboard?: boolean; clickToSelect?: boolean;
  title?: boolean; reducedMotion?: boolean; preset?: CoverflowPresetId; style?: React.CSSProperties;
}


export const COVERFLOW_PRESETS: Record<CoverflowPresetId, Partial<CoverflowSystemProps>> = {
  restaurant: { mode:'depth', activeWidth:520, activeHeight:360, sideScale:.78, gap:24, tilt:7, sideOpacity:.72, duration:.65 },
  beauty: { mode:'depth', activeWidth:500, activeHeight:600, sideScale:.82, gap:20, tilt:5, sideOpacity:.78, duration:.75 },
  automotive: { mode:'slat', activeWidth:640, activeHeight:390, sideWidth:95, sideHeight:320, gap:18, depth:180, duration:.52 },
  ecommerce: { mode:'slat', activeWidth:520, activeHeight:520, sideWidth:82, sideHeight:390, gap:14, depth:140, duration:.45 },
  luxury: { mode:'depth', activeWidth:580, activeHeight:420, sideScale:.72, gap:30, tilt:4, sideOpacity:.58, duration:.9 },
  creator: { mode:'slat', activeWidth:560, activeHeight:420, sideWidth:76, sideHeight:350, gap:12, depth:200, duration:.48 },
};
const DEFAULTS: Required<Omit<CoverflowSystemProps,'preset'|'style'|'items'|'reducedMotion'>> = {
  mode:'depth', activeWidth:560, activeHeight:420, sideWidth:90, sideHeight:320, gap:24, depth:220,
  tilt:7, sideTilt:3, sideOpacity:.68, sideScale:.76, radius:12, autoplay:false,
  autoplayDirection:'rightToLeft', autoplayDelay:4, duration:.6, loop:true, arrows:true, keyboard:true,
  clickToSelect:true, title:true,
};
const FALLBACK: CoverflowItem[] = [
  {src:'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',title:'01'},
  {src:'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80',title:'02'},
  {src:'https://images.unsplash.com/photo-1494522358652-f30e61a60313?auto=format&fit=crop&w=1200&q=80',title:'03'},
];
const mod=(v:number,n:number)=>((v%n)+n)%n;
const shortest=(i:number,pos:number,n:number)=>{let r=i-pos; while(r>n/2)r-=n; while(r<-n/2)r+=n; return r};
function srcOf(i:CoverflowItem){return i.srcUrl?.trim()||i.src||''}
function useReducedMotionFlag(explicit?:boolean){const [m,setM]=useState(false);useEffect(()=>{if(explicit!=null){setM(explicit);return}if(!window.matchMedia)return;const q=window.matchMedia('(prefers-reduced-motion: reduce)');const sync=()=>setM(q.matches);sync();q.addEventListener?.('change',sync);return()=>q.removeEventListener?.('change',sync)},[explicit]);return m}


export function CoverflowSystem(input:CoverflowSystemProps={}){
  const preset=input.preset?COVERFLOW_PRESETS[input.preset]??{}:{}; const p={...DEFAULTS,...preset,...input};
  const list=input.items?.length?input.items:FALLBACK; const n=list.length; const reduced=useReducedMotionFlag(input.reducedMotion);
  const [display,setDisplay]=useState(0); const targetRef=useRef(0); const displayRef=useRef(0); const rafRef=useRef<number|null>(null); const lastRef=useRef(0); const dwellRef=useRef(0); const hoveredRef=useRef(false);
  const stop=()=>{if(rafRef.current!=null)cancelAnimationFrame(rafRef.current);rafRef.current=null;lastRef.current=0};
  const frame=useCallback((now:number)=>{const dt=lastRef.current?Math.min(.05,(now-lastRef.current)/1000):0;lastRef.current=now;const diff=targetRef.current-displayRef.current;const speed=reduced?1000:Math.max(2,6/Math.max(.15,p.duration));if(Math.abs(diff)>.001){const k=1-Math.exp(-speed*dt);displayRef.current+=diff*k;if(Math.abs(diff)<.004)displayRef.current=targetRef.current;setDisplay(displayRef.current);dwellRef.current=0}else if(p.autoplay&&!hoveredRef.current&&n>1){dwellRef.current+=dt;if(dwellRef.current>=Math.max(.5,p.autoplayDelay)){dwellRef.current=0;targetRef.current+=p.autoplayDirection==='leftToRight'?-1:1}}rafRef.current=requestAnimationFrame(frame)},[n,p.autoplay,p.autoplayDelay,p.autoplayDirection,p.duration,reduced]);
  const ensure=useCallback(()=>{if(rafRef.current==null)rafRef.current=requestAnimationFrame(frame)},[frame]);
  useEffect(()=>{ensure();return stop},[ensure]);
  const go=useCallback((delta:number)=>{if(n<2)return;targetRef.current+=delta;ensure()},[n,ensure]);
  const goTo=useCallback((idx:number)=>{if(!n)return;const base=Math.round(targetRef.current);let delta=idx-mod(base,n);if(p.loop){if(delta>n/2)delta-=n;if(delta<-n/2)delta+=n}targetRef.current=base+delta;ensure()},[n,p.loop,ensure]);
  const active=mod(Math.round(display),Math.max(1,n));
  const onKey=(e:React.KeyboardEvent)=>{if(!p.keyboard)return;if(e.key==='ArrowLeft'){e.preventDefault();go(-1)}else if(e.key==='ArrowRight'){e.preventDefault();go(1)}};
  const visible=useMemo(()=>list.map((item,i)=>({item,i})),[list]);
  return <div role="region" aria-roledescription="carousel" tabIndex={0} onKeyDown={onKey} onPointerEnter={()=>{hoveredRef.current=true}} onPointerLeave={()=>{hoveredRef.current=false}} data-coverflow-mode={p.mode} style={{position:'relative',overflow:'hidden',minHeight:Math.max(p.activeHeight,p.sideHeight)+70,outline:'none',perspective:1400,...p.style}}>
    <div style={{position:'absolute',inset:0,transformStyle:'preserve-3d'}}>
      {visible.map(({item,i})=>{const rel=shortest(i,display,n),a=Math.abs(rel),isActive=a<.5;if(a>4)return null;const sign=Math.sign(rel)||1;let x=0,z=0,rotateY=0,rotateZ=0,w=p.activeWidth,h=p.activeHeight,opacity=1,scale=1;
        if(p.mode==='slat'){const blend=Math.min(1,a);w=p.activeWidth+(p.sideWidth-p.activeWidth)*blend;h=p.activeHeight+(p.sideHeight-p.activeHeight)*blend;x=rel*(p.activeWidth*.5+p.sideWidth*.5+p.gap);z=-a*p.depth;rotateY=-sign*Math.min(72,a*34);opacity=1-a*.13;}
        else{x=rel*(p.activeWidth*p.sideScale+p.gap);z=-a*p.depth;rotateY=-rel*p.tilt;rotateZ=rel*p.sideTilt;scale=Math.max(.4,1-a*(1-p.sideScale));opacity=Math.max(.05,isActive?1:p.sideOpacity*(1-Math.max(0,a-1)*.2));}
        const src=srcOf(item);return <button key={i} type="button" aria-current={isActive?'true':undefined} aria-label={item.title||item.alt||`Slide ${i+1}`} onClick={()=>{if(p.clickToSelect)goTo(i)}} style={{position:'absolute',left:'50%',top:'50%',width:w,height:h,transform:`translate(-50%,-50%) translateX(${x}px) translateZ(${z}px) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`,opacity,transition:reduced?'none':`width ${p.duration}s cubic-bezier(.22,1,.36,1), height ${p.duration}s cubic-bezier(.22,1,.36,1), opacity ${p.duration}s ease`,border:0,padding:0,borderRadius:p.radius,overflow:'hidden',background:'#111',boxShadow:isActive?'0 24px 70px rgba(0,0,0,.5)':'0 12px 36px rgba(0,0,0,.35)',cursor:p.clickToSelect&&!isActive?'pointer':'default',zIndex:100-Math.round(a*10),transformStyle:'preserve-3d'}}>
          {src&&<img src={src} alt={item.alt||''} draggable={false} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>}
          {p.title&&item.title&&<span style={{position:'absolute',left:18,bottom:16,color:'#fff',fontSize:isActive?18:12,fontWeight:700,textAlign:'left',textShadow:'0 2px 18px rgba(0,0,0,.7)'}}>{item.title}</span>}
        </button>})}
    </div>
    {p.arrows&&n>1&&<><button type="button" aria-label="Previous" onClick={()=>go(-1)} style={{position:'absolute',left:14,top:'50%',zIndex:200,transform:'translateY(-50%)'}}>‹</button><button type="button" aria-label="Next" onClick={()=>go(1)} style={{position:'absolute',right:14,top:'50%',zIndex:200,transform:'translateY(-50%)'}}>›</button></>}
    <span aria-live="polite" style={{position:'absolute',width:1,height:1,overflow:'hidden',clip:'rect(0 0 0 0)'}}>{`Slide ${active+1} of ${n}`}</span>
  </div>;
}
export default CoverflowSystem;
