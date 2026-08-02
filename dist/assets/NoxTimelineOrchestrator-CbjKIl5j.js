import{u as C,r as l,v as F,x as P,q as j,j as a}from"./index-CfWFdp0n.js";import{e as O,N as p,b as z}from"./motionPresets-D6LLYmvm.js";const N={"revenue-os":{label:"Revenue OS",eyebrow:"SIGNAL → REVENUE",accent:"201, 48, 48",success:"57, 255, 139",nodes:[{id:"signal",label:"Signals",detail:"Intent detected",x:12,y:27,at:[0,.15],from:{x:-42,y:0}},{id:"agents",label:"Agent Stack",detail:"Context enriched",x:34,y:60,at:[.12,.29],from:{x:0,y:48}},{id:"automation",label:"Automation",detail:"Flow executed",x:56,y:23,at:[.26,.43],from:{x:0,y:-48}},{id:"followup",label:"Follow-up",detail:"Timing optimized",x:76,y:57,at:[.4,.58],from:{x:42,y:0}},{id:"cta",label:"Revenue Loop",detail:"System compounding",x:89,y:29,at:[.62,.82],from:{x:0,y:32}}]},"agent-ops":{label:"Agent Ops",eyebrow:"MISSION → EXECUTION",accent:"117, 92, 255",success:"82, 214, 255",nodes:[{id:"brief",label:"Operator Brief",detail:"Scope locked",x:11,y:54,at:[0,.14],from:{x:-44,y:0}},{id:"router",label:"Task Router",detail:"Agent selected",x:31,y:25,at:[.11,.28],from:{x:0,y:-46}},{id:"workers",label:"Worker Mesh",detail:"Parallel execution",x:53,y:59,at:[.25,.43],from:{x:0,y:50}},{id:"review",label:"Quality Gate",detail:"Evidence checked",x:74,y:25,at:[.4,.58],from:{x:40,y:0}},{id:"cta",label:"Mission Complete",detail:"Audit persisted",x:90,y:53,at:[.62,.82],from:{x:0,y:34}}]},"launch-sequence":{label:"Launch",eyebrow:"BUILD → MARKET",accent:"255, 145, 61",success:"255, 220, 92",nodes:[{id:"position",label:"Positioning",detail:"Promise sharpened",x:11,y:26,at:[0,.14],from:{x:-42,y:0}},{id:"offer",label:"Offer Stack",detail:"Value engineered",x:31,y:58,at:[.11,.28],from:{x:0,y:48}},{id:"asset",label:"Launch Assets",detail:"Pages deployed",x:53,y:25,at:[.25,.43],from:{x:0,y:-48}},{id:"traffic",label:"Distribution",detail:"Demand activated",x:74,y:58,at:[.4,.58],from:{x:42,y:0}},{id:"cta",label:"Market Signal",detail:"Feedback captured",x:90,y:29,at:[.62,.82],from:{x:0,y:34}}]}},X={calm:{speed:.72,damping:7.5,glow:.58,lineWidth:1.1},charged:{speed:1,damping:6,glow:1,lineWidth:1.4},overdrive:{speed:1.32,damping:4.8,glow:1.42,lineWidth:1.8}},T=[[0,1,.29],[1,2,.43],[2,3,.57],[3,4,.81]];function q(x,u,R){const[v,w]=u.at,b=j((x-v)/(w-v),0,1),g=R?z(b):O(b);return{opacity:O(b),dx:u.from.x*(1-g),dy:u.from.y*(1-g),scale:.86+.14*g}}function V({progress:x=-1,playSpeed:u=.16,overshoot:R=!0,variant:v="revenue-os",energy:w="charged",showVariantSwitcher:b=!0,showLegend:g=!0}){const m=C(),[f,D]=l.useState(v),A=l.useRef([]),L=l.useRef([]),k=l.useRef(null),$=l.useRef(null),S=l.useRef(0),e=N[f],s=X[w],E=l.useMemo(()=>e.nodes,[e]);F((t,y)=>{const i=y*u*s.speed%1.28,d=x>=0?j(x,0,1):i>1?1:i;S.current=P(S.current,d,s.damping,t);const o=S.current;E.forEach((c,h)=>{const r=A.current[h];if(!r)return;const n=q(o,c,R);r.style.opacity=n.opacity.toFixed(3),r.style.transform=`translate(-50%, -50%) translate(${n.dx.toFixed(2)}px, ${n.dy.toFixed(2)}px) scale(${n.scale.toFixed(3)})`,r.style.setProperty("--node-progress",String(n.opacity))}),T.forEach(([,,c],h)=>{const r=L.current[h];if(!r)return;const n=j((o-c)/.14,0,1),I=Number(r.dataset.len??100);r.style.strokeDashoffset=String(I*(1-O(n))),r.style.opacity=n>0?"1":"0"}),k.current&&(k.current.style.transform=`scaleX(${o.toFixed(4)})`),$.current&&($.current.style.left=`${8+o*84}%`,$.current.style.opacity=o>.01&&o<.99?"1":"0")},!m);const M=m?1:0;return a.jsxs("div",{style:{position:"absolute",inset:0,overflow:"hidden",background:`radial-gradient(circle at 50% 42%, rgba(${e.accent}, 0.08), transparent 52%), ${p.bg}`,containerType:"size"},children:[a.jsx("style",{children:`
        .nto-node {
          --node-progress: 0;
          position: absolute;
          transform: translate(-50%, -50%);
          min-width: clamp(92px, 15cqw, 148px);
          border: 1px solid rgba(${e.accent}, 0.38);
          background: linear-gradient(145deg, rgba(22,22,27,.96), rgba(12,12,15,.9));
          border-radius: 11px;
          padding: 9px 12px 8px;
          color: ${p.text};
          box-shadow: 0 0 calc(16px + 18px * var(--node-progress)) rgba(${e.accent}, ${.11*s.glow});
          white-space: nowrap;
          will-change: transform, opacity;
        }
        .nto-node::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(110deg, transparent 25%, rgba(255,255,255,.07), transparent 72%);
          transform: translateX(calc(-130% + 230% * var(--node-progress)));
          pointer-events: none;
        }
        .nto-node.nto-cta {
          border-color: rgba(${e.success}, 0.48);
          box-shadow: 0 0 calc(18px + 20px * var(--node-progress)) rgba(${e.success}, ${.1*s.glow});
        }
        .nto-label {
          font: 700 clamp(8px, 1.45cqw, 11px)/1.1 var(--mono, monospace);
          letter-spacing: .14em;
          text-transform: uppercase;
        }
        .nto-detail {
          margin-top: 5px;
          font: 500 clamp(7px, 1.15cqw, 9px)/1.2 var(--mono, monospace);
          letter-spacing: .06em;
          color: ${p.textDim};
        }
        .nto-line {
          stroke: rgba(${e.accent}, 0.72);
          stroke-width: ${s.lineWidth};
          filter: drop-shadow(0 0 ${Math.round(5*s.glow)}px rgba(${e.accent}, .72));
        }
        .nto-switch {
          border: 1px solid rgba(255,255,255,.1);
          background: rgba(10,10,13,.72);
          color: ${p.textDim};
          border-radius: 999px;
          padding: 5px 8px;
          font: 700 8px/1 var(--mono, monospace);
          letter-spacing: .08em;
          cursor: pointer;
        }
        .nto-switch[data-active='true'] {
          color: ${p.text};
          border-color: rgba(${e.accent}, .55);
          background: rgba(${e.accent}, .14);
        }
        @media (max-width: 460px) {
          .nto-detail { display: none; }
          .nto-node { min-width: 70px; padding: 8px 9px; }
        }
      `}),a.jsxs("div",{style:{position:"absolute",top:14,left:16,zIndex:3,pointerEvents:"none"},children:[a.jsxs("div",{style:{fontFamily:"var(--mono, monospace)",fontSize:9,letterSpacing:".35em",color:p.textDim},children:[e.eyebrow," // ",m?"END-STATE":x>=0?"SCROLL-SYNC":w.toUpperCase()]}),g&&a.jsxs("div",{style:{marginTop:6,fontFamily:"var(--mono, monospace)",fontSize:8,letterSpacing:".12em",color:`rgba(${e.accent}, .78)`},children:[e.label.toUpperCase()," · ONE TIMELINE CONTROLLER · DOM + SVG"]})]}),b&&a.jsx("div",{style:{position:"absolute",top:12,right:14,zIndex:4,display:"flex",gap:5},children:Object.keys(N).map(t=>a.jsx("button",{type:"button",className:"nto-switch","data-active":f===t,onClick:()=>{S.current=0,D(t)},"aria-pressed":f===t,children:N[t].label},t))}),a.jsxs("div",{style:{position:"absolute",inset:"15% 4% 17% 4%"},children:[a.jsx("svg",{style:{position:"absolute",inset:0,width:"100%",height:"100%"},viewBox:"0 0 100 100",preserveAspectRatio:"none","aria-hidden":"true",children:T.map(([t,y],i)=>{const d=E[t],o=E[y],c=Math.hypot(o.x-d.x,o.y-d.y)*1.2;return a.jsx("line",{ref:h=>{L.current[i]=h},className:"nto-line",x1:d.x,y1:d.y,x2:o.x,y2:o.y,"data-len":c,strokeDasharray:c,strokeDashoffset:m?0:c,opacity:m?1:0,vectorEffect:"non-scaling-stroke"},`${f}-${i}`)})}),E.map((t,y)=>a.jsxs("div",{ref:i=>{A.current[y]=i},className:`nto-node ${t.id==="cta"?"nto-cta":""}`,style:{left:`${t.x}%`,top:`${t.y}%`,opacity:M},children:[a.jsx("div",{className:"nto-label",children:t.label}),a.jsx("div",{className:"nto-detail",children:t.detail})]},`${f}-${t.id}`))]}),a.jsx("div",{style:{position:"absolute",left:"8%",right:"8%",bottom:18,height:1,background:"rgba(240,236,228,.1)"},children:a.jsx("div",{ref:k,style:{position:"absolute",inset:0,transformOrigin:"left",transform:`scaleX(${M})`,background:`linear-gradient(to right, rgba(${e.accent},.88), rgba(${e.success},.72))`}})}),a.jsx("div",{ref:$,"aria-hidden":"true",style:{position:"absolute",bottom:14,width:9,height:9,borderRadius:"50%",transform:"translateX(-50%)",background:`rgb(${e.success})`,boxShadow:`0 0 ${Math.round(14*s.glow)}px rgba(${e.success}, .78)`,opacity:0,pointerEvents:"none"}})]})}export{V as NoxTimelineOrchestrator,V as default};
