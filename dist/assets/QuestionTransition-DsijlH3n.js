import{u as I,r as l,j as e}from"./index-CfWFdp0n.js";import{N as o,E as i}from"./motionPresets-D6LLYmvm.js";const f=[{q:"Welches SYSTEM treibt dich an?",a:["FORGE","SIGNAL","RANK","SCAN"]},{q:"Wie oft prüfst du deinen RANK?",a:["TÄGLICH","WÖCHENTLICH","BEI SIGNAL","NIE"]},{q:"Was startet dein nächster SCAN?",a:["PROFIL","MISSION","FORGE-RUN","SYSTEM-CHECK"]}];function C({duration:u=.95,blurAmount:h=10,accentColor:d=o.red,direction:g="forward",autoCycle:S=!0}){const p=I(),[c,b]=l.useState(0),[a,x]=l.useState("idle"),[w,R]=l.useState(1),E=l.useRef([]),$=l.useRef("idle");$.current=a,l.useEffect(()=>()=>E.current.forEach(clearTimeout),[]);const q=t=>(t%f.length+f.length)%f.length,y=t=>{if(p){b(m=>q(m+t));return}if($.current!=="idle")return;R(t),x("collapse");const r=u*1e3,s=(m,X)=>E.current.push(setTimeout(m,X));s(()=>x("sweep"),r*.36),s(()=>{b(m=>q(m+t)),x("expand")},r*.36+r*.24),s(()=>x("idle"),r*.36+r*.24+r*.55)};l.useEffect(()=>{if(!S||p)return;const t=setTimeout(()=>y(g==="back"?-1:1),2800);return()=>clearTimeout(t)},[c,S,p,g,u]);const n=u,v=f[c],T=a==="collapse"||a==="sweep"?{animation:`qtr-collapse ${n*.36}s ${i.sharpIn} forwards`}:a==="expand"?{animation:`qtr-expand ${n*.5}s ${i.outExpo} forwards`}:{},j=a==="collapse"?{animation:`qtr-line-in ${n*.36}s ${i.outQuint} forwards`}:a==="sweep"?{animation:`qtr-line-sweep ${n*.24}s ${i.inOutSoft} forwards`}:a==="expand"?{animation:`qtr-line-out ${n*.4}s ${i.outExpo} forwards`}:{opacity:0};return e.jsxs("div",{style:{position:"absolute",inset:0,overflow:"hidden",background:`radial-gradient(110% 90% at 50% 10%, #121014 0%, ${o.bg} 65%)`,display:"flex",flexDirection:"column",justifyContent:"center",padding:"clamp(12px, 3vw, 30px)",fontFamily:"system-ui, sans-serif",color:o.text,userSelect:"none"},children:[e.jsx("style",{children:`
        @keyframes qtr-collapse {
          from { transform: scaleY(1); filter: blur(0); opacity: 1; }
          to   { transform: scaleY(0.02); filter: blur(${h}px); opacity: 0.85; }
        }
        @keyframes qtr-expand {
          0%   { transform: scaleY(0.02); filter: blur(${h*.6}px); opacity: 0.9; }
          100% { transform: scaleY(1); filter: blur(0); opacity: 1; }
        }
        @keyframes qtr-line-in {
          from { opacity: 0; transform: translateX(0) scaleX(0.35); }
          to   { opacity: 1; transform: translateX(0) scaleX(1); }
        }
        @keyframes qtr-line-sweep {
          0%   { opacity: 1; transform: translateX(0) scaleX(1); }
          55%  { opacity: 1; transform: translateX(calc(var(--qtr-dir) * 26%)) scaleX(0.75); }
          100% { opacity: 1; transform: translateX(0) scaleX(1.05); }
        }
        @keyframes qtr-line-out {
          from { opacity: 1; transform: scaleX(1.05); }
          to   { opacity: 0; transform: scaleX(1.3); }
        }
        @keyframes qtr-child {
          from { opacity: 0; transform: translateX(calc(var(--qtr-dir) * 28px)) translateY(6px); }
          to   { opacity: 1; transform: translateX(0) translateY(0); }
        }
      `}),e.jsxs("div",{style:{position:"relative",flex:"0 1 auto","--qtr-dir":String(w)},children:[e.jsx("div",{style:{position:"absolute",left:"4%",right:"4%",top:"50%",height:2,borderRadius:2,background:`linear-gradient(90deg, transparent, ${d}, transparent)`,boxShadow:`0 0 12px 1px ${d}aa, 0 0 30px 4px ${d}44`,pointerEvents:"none",zIndex:2,opacity:0,...j}}),e.jsxs("div",{style:{transformOrigin:"50% 50%",willChange:"transform, filter",...T},children:[e.jsxs("div",{style:{fontFamily:"ui-monospace, monospace",fontSize:"clamp(9px, 1.4vw, 11px)",letterSpacing:"0.3em",color:o.textDim,marginBottom:6,...a==="expand"&&!p?{animation:`qtr-child ${n*.4}s ${i.outExpo} 0.02s both`}:{}},children:["NPC-TEST · FRAGE ",String(c+1).padStart(2,"0"),"/",String(f.length).padStart(2,"0")]},`h-${c}`),e.jsx("div",{style:{fontSize:"clamp(15px, 2.8vw, 24px)",fontWeight:700,letterSpacing:"-0.01em",marginBottom:"clamp(10px, 2.4vh, 20px)",...a==="expand"&&!p?{animation:`qtr-child ${n*.45}s ${i.outExpo} 0.08s both`}:{}},children:v.q},`q-${c}`),e.jsx("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"clamp(6px, 1vw, 10px)"},children:v.a.map((t,r)=>e.jsxs("button",{onClick:()=>y(1),style:{fontFamily:"ui-monospace, monospace",fontSize:"clamp(8px, 1.3vw, 11px)",letterSpacing:"0.16em",textAlign:"left",padding:"clamp(7px, 1.5vh, 12px) 12px",background:o.bgPanel,border:"1px solid #26262b",borderRadius:8,color:o.text,cursor:"pointer",...a==="expand"&&!p?{animation:`qtr-child ${n*.45}s ${i.outExpo} ${.14+r*.06}s both`}:{}},children:[e.jsx("span",{style:{color:d,marginRight:8},children:"▸"}),t]},`${c}-${r}`))})]})]}),e.jsx("div",{style:{display:"flex",justifyContent:"space-between",marginTop:"clamp(10px, 2.5vh, 22px)"},children:[["◀ ZURÜCK",-1],["WEITER ▶",1]].map(([t,r])=>e.jsx("button",{onClick:()=>y(r),style:{fontFamily:"ui-monospace, monospace",fontSize:"clamp(8px, 1.3vw, 11px)",letterSpacing:"0.2em",padding:"8px 18px",borderRadius:999,border:"1px solid #2c2c31",background:"transparent",color:o.textDim,cursor:"pointer",transition:"border-color 0.18s, color 0.18s"},onMouseEnter:s=>{s.currentTarget.style.borderColor=d,s.currentTarget.style.color=o.text},onMouseLeave:s=>{s.currentTarget.style.borderColor="#2c2c31",s.currentTarget.style.color=o.textDim},children:t},t))})]})}export{C as QuestionTransition,C as default};
