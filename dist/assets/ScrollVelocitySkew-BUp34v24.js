import{r as n,u as q,m as D,v as H,x as C,q as d,j as s}from"./index-Mu6UxQSY.js";import{N as I}from"./motionPresets-DdDKkMP6.js";const E=["FORGE THE SIGNAL","VELOCITY IS TRUTH","NO AUTOPILOT","RANK OVER NOISE"],S=4,L=E.length*S,P=1500,N=(i,o)=>Number.isFinite(i)?i:o,U=(i,o)=>!Number.isFinite(o)||o<=0?0:(i%o+o)%o;function B({skewMax:i=10,damping:o=9,marqueeBase:M=40,accent:g=I.red}){const j=n.useRef(null),b=n.useRef(null),w=n.useRef(null),f=n.useRef(null),R=n.useRef(Array(L).fill(null)),v=q(),T=D(j,"160px"),h=n.useRef({lastTop:0,velocity:0,smooth:0,phases:Array(L).fill(0)}),F=d(Math.abs(N(i,10)),0,24),A=d(N(o,9),2,24),V=d(Math.abs(N(M,40)),0,220);return n.useEffect(()=>{const r=b.current;r&&(h.current.lastTop=r.scrollTop,T||(h.current.velocity=0,h.current.smooth=0))},[T]),n.useEffect(()=>{if(!v)return;const r=w.current;r&&(r.style.transform="none",r.style.filter="none",r.style.willChange="auto"),f.current&&(f.current.style.opacity="0",f.current.style.transform="none"),R.current.forEach(e=>{e&&(e.style.transform="translate3d(0,0,0)",e.style.letterSpacing="0.08em",e.style.willChange="auto")})},[v]),H(r=>{const e=b.current,a=w.current;if(!e||!a)return;const l=d(r,1/240,1/20),t=h.current,u=(e.scrollTop-t.lastTop)/l;t.lastTop=e.scrollTop;const x=d(u,-3200,3200);t.velocity=C(t.velocity,x,22,l),t.smooth=C(t.smooth,t.velocity,A,l),Math.abs(t.smooth)<.15&&Math.abs(t.velocity)<.15&&(t.smooth=0,t.velocity=0);const c=d(t.smooth/P,-1,1),p=Math.abs(c),$=-c*F,Y=c*1.15,k=p>.1?Math.min(1.8,p*1.8):0;a.style.willChange=p>.015?"transform, filter":"auto",a.style.transform=`perspective(1000px) skewY(${$.toFixed(2)}deg) rotateX(${Y.toFixed(2)}deg) translateZ(0)`,a.style.filter=k>.05?`blur(${k.toFixed(2)}px)`:"none";const O=f.current;O&&(O.style.opacity=(p*.28).toFixed(3),O.style.transform=`translate3d(0, ${(c*18).toFixed(1)}px, 0) scaleY(${(1+p*.2).toFixed(3)})`),R.current.forEach((m,y)=>{if(!m)return;const z=Math.max(m.scrollWidth/2,1),_=y%2===0?1:-1,W=V+Math.abs(t.smooth)*.34;t.phases[y]=U(t.phases[y]+_*W*l,z),m.style.willChange="transform",m.style.transform=`translate3d(${-t.phases[y].toFixed(1)}px,0,0)`,m.style.letterSpacing=`${(.08+p*.3).toFixed(3)}em`})},T&&!v),s.jsxs("div",{ref:j,className:"svs-root",style:{position:"absolute",inset:0,overflow:"hidden",background:"#08080a","--svs-accent":g},children:[s.jsx("style",{children:`
        .svs-root { isolation: isolate; contain: layout paint style; }
        .svs-root::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(circle at 50% 8%, color-mix(in srgb, var(--svs-accent) 11%, transparent), transparent 38%),
            linear-gradient(180deg, rgba(255,255,255,.018), transparent 32%, rgba(0,0,0,.24));
          z-index: 0;
        }
        .svs-scroll {
          scrollbar-width: thin;
          scrollbar-color: color-mix(in srgb, var(--svs-accent) 42%, #25252b) transparent;
          overscroll-behavior: contain;
        }
        .svs-scroll:focus-visible {
          outline: 1px solid color-mix(in srgb, var(--svs-accent) 75%, white);
          outline-offset: -3px;
        }
        .svs-row {
          overflow: hidden;
          white-space: nowrap;
          padding: 7px 0;
          border-top: 1px solid rgba(255,255,255,.075);
        }
        .svs-track {
          display: inline-block;
          white-space: nowrap;
          transform: translate3d(0,0,0);
        }
        .svs-copy { padding-right: clamp(28px, 4vw, 54px); }
        .svs-hint {
          text-align: center;
          font: 600 10px/1.3 var(--mono, ui-monospace, monospace);
          letter-spacing: .28em;
          color: rgba(240,236,228,.42);
          margin-bottom: 24px;
          padding-inline: 18px;
        }
        .svs-sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
        @media (max-width: 640px) {
          .svs-hint { font-size: 9px; letter-spacing: .2em; }
          .svs-row { padding-block: 5px; }
          .svs-copy { padding-right: 28px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .svs-track, .svs-content, .svs-velocity-glow {
            transform: none !important;
            filter: none !important;
            transition: none !important;
          }
        }
      `}),s.jsx("div",{ref:f,className:"svs-velocity-glow","aria-hidden":"true",style:{position:"absolute",inset:"24% -12%",pointerEvents:"none",opacity:0,background:"radial-gradient(ellipse at center, color-mix(in srgb, var(--svs-accent) 36%, transparent), transparent 68%)",filter:"blur(42px)",zIndex:0}}),s.jsxs("div",{ref:b,className:"svs-scroll",tabIndex:0,role:"region","aria-label":"Velocity reactive scrolling marquee","aria-describedby":"svs-description",style:{position:"absolute",inset:0,overflowY:"auto",overflowX:"hidden",zIndex:1},children:[s.jsx("p",{id:"svs-description",className:"svs-sr-only",children:"Scroll to change the speed, skew and tracking of the typography. Motion becomes static when reduced motion is preferred."}),s.jsxs("div",{ref:w,className:"svs-content",style:{padding:"40px 0 64px",transformOrigin:"50% 50%"},children:[s.jsx("div",{className:"svs-hint",children:v?"VELOCITY TYPOGRAPHY — REDUCED MOTION":"SCROLL FAST — CONTENT REACTS TO VELOCITY"}),s.jsx("div",{"aria-hidden":"true",children:Array.from({length:S}).map((r,e)=>s.jsx("div",{style:{marginBottom:e===S-1?12:52},children:E.map((a,l)=>{const t=e*E.length+l,u=t%2===1;return s.jsx("div",{className:"svs-row",children:s.jsx("div",{ref:x=>{R.current[t]=x},className:"svs-track",style:{fontSize:"clamp(25px, 5vw, 54px)",fontWeight:780,lineHeight:1.05,color:u?"transparent":I.text,WebkitTextStroke:u?`1px ${g}`:void 0,letterSpacing:"0.08em",textShadow:u?"none":"0 10px 30px rgba(0,0,0,.24)"},children:Array.from({length:8}).map((x,c)=>s.jsxs("span",{className:"svs-copy",children:[a," ",s.jsx("span",{style:{color:g,WebkitTextStroke:"0 transparent"},children:"◆"})," "]},c))})},`${e}-${a}`)})},e))})]})]})]})}export{B as ScrollVelocitySkew,B as default};
