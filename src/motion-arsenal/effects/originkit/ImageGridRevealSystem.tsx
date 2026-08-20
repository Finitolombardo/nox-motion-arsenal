import React, { useEffect, useMemo, useRef, useState } from 'react';


export type ImageGridRevealMode = 'sweep' | 'tiles' | 'ripple' | 'magnetic';
export type ImageGridRevealTrigger = 'enter' | 'auto' | 'click' | 'hover';
export type ImageGridDirection = 'up' | 'down' | 'left' | 'right' | 'center' | 'random';
export type ImageGridRevealPresetId = 'restaurant' | 'beauty' | 'fitness' | 'saas' | 'ecommerce' | 'luxury' | 'creator';


export interface ImageGridRevealSystemProps {
  src?: string; alt?: string; mode?: ImageGridRevealMode; trigger?: ImageGridRevealTrigger;
  direction?: ImageGridDirection; cellSize?: number; gap?: number; duration?: number;
  edgeNoise?: number; radius?: number; intensity?: number; rippleColors?: string[];
  background?: string; replay?: boolean; fit?: 'cover' | 'contain'; preset?: ImageGridRevealPresetId;
  style?: React.CSSProperties;
}


type Cell = { x:number; y:number; w:number; h:number; order:number; progress:number; target:number };
type Fit = { scale:number; dx:number; dy:number; sw:number; sh:number };


export const IMAGE_GRID_REVEAL_PRESETS: Record<ImageGridRevealPresetId, Partial<ImageGridRevealSystemProps>> = {
  restaurant: { mode:'tiles', trigger:'enter', direction:'center', cellSize:34, duration:1.05, edgeNoise:.18 },
  beauty: { mode:'ripple', trigger:'enter', cellSize:24, gap:2, duration:1.35, radius:180, rippleColors:['#fff7fb','#f6cfe1','#ffffff'] },
  fitness: { mode:'sweep', trigger:'enter', direction:'up', cellSize:22, duration:.72, edgeNoise:.32 },
  saas: { mode:'sweep', trigger:'enter', direction:'right', cellSize:18, duration:.8, edgeNoise:.16 },
  ecommerce: { mode:'magnetic', trigger:'hover', cellSize:22, gap:3, radius:150, intensity:7 },
  luxury: { mode:'tiles', trigger:'enter', direction:'random', cellSize:40, duration:1.8, edgeNoise:.08 },
  creator: { mode:'ripple', trigger:'click', cellSize:20, gap:2, duration:.95, radius:210, rippleColors:['#ffffff','#fed34d','#78371f','#d78b4e'] },
};


const DEFAULTS: Required<Omit<ImageGridRevealSystemProps,'preset'|'style'|'alt'>> & { alt?:string } = {
  src:'', alt:'', mode:'sweep', trigger:'enter', direction:'up', cellSize:24, gap:0,
  duration:1, edgeNoise:.2, radius:160, intensity:6, rippleColors:['#ffffff'], background:'#000000', replay:false, fit:'cover',
};
const clamp=(v:number,a=0,b=1)=>Math.max(a,Math.min(b,v));
const hash=(i:number)=>{const x=Math.sin(i*12.9898+78.233)*43758.5453;return x-Math.floor(x)};


function useReducedMotion(){
  const [reduced,setReduced]=useState(false);
  useEffect(()=>{if(typeof window==='undefined'||!window.matchMedia)return;const mq=window.matchMedia('(prefers-reduced-motion: reduce)');const sync=()=>setReduced(mq.matches);sync();mq.addEventListener?.('change',sync);return()=>mq.removeEventListener?.('change',sync)},[]);
  return reduced;
}
function fitImage(img:HTMLImageElement,w:number,h:number,fit:'cover'|'contain'):Fit{
  const sx=w/Math.max(1,img.naturalWidth),sy=h/Math.max(1,img.naturalHeight);const scale=fit==='cover'?Math.max(sx,sy):Math.min(sx,sy);const sw=img.naturalWidth*scale,sh=img.naturalHeight*scale;return{scale,sw,sh,dx:(w-sw)/2,dy:(h-sh)/2};
}
function sourceRect(f:Fit,cell:Cell){return{sx:(cell.x-f.dx)/f.scale,sy:(cell.y-f.dy)/f.scale,sw:cell.w/f.scale,sh:cell.h/f.scale}}


export function ImageGridRevealSystem(input:ImageGridRevealSystemProps={}){
  const preset=input.preset?IMAGE_GRID_REVEAL_PRESETS[input.preset]??{}:{};const p={...DEFAULTS,...preset,...input};
  const reduced=useReducedMotion();const hostRef=useRef<HTMLDivElement|null>(null);const canvasRef=useRef<HTMLCanvasElement|null>(null);const imageRef=useRef<HTMLImageElement|null>(null);const cellsRef=useRef<Cell[]>([]);const rafRef=useRef<number|null>(null);const startRef=useRef(0);const runningRef=useRef(false);const revealedRef=useRef(false);const pointerRef=useRef({x:-9999,y:-9999,inside:false});
  const effectiveCell=useMemo(()=>Math.max(6,Math.round(p.cellSize)),[p.cellSize]);
  const stop=()=>{if(rafRef.current!=null)cancelAnimationFrame(rafRef.current);rafRef.current=null;runningRef.current=false};
  const build=()=>{const host=hostRef.current,canvas=canvasRef.current;if(!host||!canvas)return;const rect=host.getBoundingClientRect();const w=Math.max(1,Math.round(rect.width)),h=Math.max(1,Math.round(rect.height));const dpr=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);canvas.style.width=`${w}px`;canvas.style.height=`${h}px`;const ctx=canvas.getContext('2d');if(!ctx)return;ctx.setTransform(dpr,0,0,dpr,0,0);const pitch=Math.max(4,effectiveCell+Math.max(0,p.gap));const cols=Math.ceil(w/pitch),rows=Math.ceil(h/pitch);const cells:Cell[]=[];for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const x=c*pitch,y=r*pitch,index=r*cols+c;let order=index/Math.max(1,cols*rows-1);if(p.direction==='down')order=1-r/Math.max(1,rows-1);else if(p.direction==='up')order=r/Math.max(1,rows-1);else if(p.direction==='left')order=1-c/Math.max(1,cols-1);else if(p.direction==='right')order=c/Math.max(1,cols-1);else if(p.direction==='center'){const dx=(c-(cols-1)/2)/Math.max(1,cols),dy=(r-(rows-1)/2)/Math.max(1,rows);order=clamp(Math.hypot(dx,dy)*2)}else if(p.direction==='random')order=hash(index);order=clamp(order+(hash(index+173)-.5)*p.edgeNoise);cells.push({x,y,w:Math.min(pitch,w-x),h:Math.min(pitch,h-y),order,progress:0,target:0})}cellsRef.current=cells};
  const draw=(now=performance.now())=>{const canvas=canvasRef.current,img=imageRef.current,host=hostRef.current;if(!canvas||!img||!host||!img.complete)return;const ctx=canvas.getContext('2d');if(!ctx)return;const rect=host.getBoundingClientRect(),w=rect.width,h=rect.height;const dpr=Math.min(2,window.devicePixelRatio||1);ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);ctx.fillStyle=p.background;ctx.fillRect(0,0,w,h);const f=fitImage(img,w,h,p.fit);const elapsed=(now-startRef.current)/1000,total=Math.max(.12,p.duration);let needsFrame=false;for(let i=0;i<cellsRef.current.length;i++){const cell=cellsRef.current[i];if(p.mode==='magnetic'){const cx=cell.x+cell.w/2,cy=cell.y+cell.h/2,d=Math.hypot(pointerRef.current.x-cx,pointerRef.current.y-cy),n=pointerRef.current.inside?clamp(1-d/Math.max(20,p.radius)):0;cell.target=Math.pow(n,Math.max(.15,1.5-p.intensity*.12));cell.progress+=(cell.target-cell.progress)*.16;if(Math.abs(cell.target-cell.progress)>.005)needsFrame=true}else if(p.mode==='ripple'){const cx=cell.x+cell.w/2,cy=cell.y+cell.h/2,dist=Math.hypot(cx-w/2,cy-h/2),wave=elapsed*Math.max(80,p.radius*1.4);cell.progress=clamp((wave-dist)/Math.max(20,p.radius*.35));if(cell.progress<1)needsFrame=true}else{const local=(elapsed/total-cell.order*(p.mode==='tiles'?.65:.72))/(p.mode==='tiles'?.35:.28);cell.progress=clamp(local);if(cell.progress<1)needsFrame=true}const pr=reduced?1:cell.progress;if(pr<=0)continue;const sr=sourceRect(f,cell);ctx.save();if(p.mode==='magnetic'){const cx=cell.x+cell.w/2,cy=cell.y+cell.h/2,r=Math.max(1,Math.hypot(cell.w,cell.h)*.5*pr);ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.clip()}else{const inset=(1-pr)*Math.min(cell.w,cell.h)*.48;ctx.globalAlpha=pr;ctx.beginPath();ctx.rect(cell.x+inset,cell.y+inset,Math.max(0,cell.w-inset*2),Math.max(0,cell.h-inset*2));ctx.clip()}ctx.drawImage(img,sr.sx,sr.sy,sr.sw,sr.sh,cell.x,cell.y,cell.w,cell.h);if(p.mode==='ripple'&&pr>0&&pr<1&&p.rippleColors.length){ctx.globalCompositeOperation='screen';ctx.globalAlpha=(1-pr)*.8;ctx.fillStyle=p.rippleColors[i%p.rippleColors.length];ctx.fillRect(cell.x,cell.y,cell.w,cell.h)}ctx.restore()}if(needsFrame||(p.mode==='magnetic'&&pointerRef.current.inside))rafRef.current=requestAnimationFrame(draw);else{rafRef.current=null;runningRef.current=false;if(p.mode!=='magnetic')revealedRef.current=true}};
  const play=()=>{if(reduced){startRef.current=performance.now()-p.duration*1000;cellsRef.current.forEach(c=>c.progress=1);draw();return}if(runningRef.current)return;if(!p.replay&&revealedRef.current&&p.mode!=='magnetic')return;cellsRef.current.forEach(c=>{c.progress=0;c.target=0});startRef.current=performance.now();runningRef.current=true;stop();runningRef.current=true;rafRef.current=requestAnimationFrame(draw)};
  useEffect(()=>{const img=new Image();img.crossOrigin='anonymous';img.decoding='async';imageRef.current=img;img.onload=()=>{build();if(reduced)play();else if(p.trigger==='auto')play();else draw()};img.src=p.src;return()=>{stop();imageRef.current=null}},[p.src]);
  useEffect(()=>{const host=hostRef.current;if(!host)return;const ro=new ResizeObserver(()=>{const wasRevealed=revealedRef.current;build();if(wasRevealed||reduced){cellsRef.current.forEach(c=>c.progress=1);draw()}});ro.observe(host);return()=>ro.disconnect()},[effectiveCell,p.gap,p.direction,p.edgeNoise,reduced]);
  useEffect(()=>{if(reduced||p.trigger!=='enter'||!hostRef.current)return;const node=hostRef.current;const io=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){play();if(!p.replay)io.disconnect()}},{threshold:.15});io.observe(node);return()=>io.disconnect()},[p.trigger,p.replay,reduced,p.mode,p.duration]);
  const onPointerMove=(e:React.PointerEvent<HTMLDivElement>)=>{if(p.mode!=='magnetic')return;const r=e.currentTarget.getBoundingClientRect();pointerRef.current={x:e.clientX-r.left,y:e.clientY-r.top,inside:true};if(!runningRef.current){runningRef.current=true;rafRef.current=requestAnimationFrame(draw)}};
  return <div ref={hostRef} role="img" aria-label={p.alt||undefined} onPointerMove={onPointerMove} onPointerLeave={()=>{pointerRef.current.inside=false}} onPointerEnter={()=>{if(p.trigger==='hover'&&p.mode!=='magnetic')play()}} onClick={()=>{if(p.trigger==='click')play()}} data-image-grid-mode={p.mode} style={{position:'relative',overflow:'hidden',width:'100%',height:'100%',minHeight:240,background:p.background,touchAction:p.mode==='magnetic'?'pan-y':undefined,...p.style}}><canvas ref={canvasRef} aria-hidden="true" style={{position:'absolute',inset:0,width:'100%',height:'100%',display:'block'}}/></div>;
}
export default ImageGridRevealSystem;
