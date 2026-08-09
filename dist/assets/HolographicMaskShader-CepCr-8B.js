import{j as o}from"./index-Mu6UxQSY.js";function s(){return o.jsxs("div",{className:"holographic-mask-scroll-demo",children:[o.jsx("style",{children:`
        .holographic-mask-scroll-demo { position:relative; width:100%; height:100%; overflow:hidden; background:#08090d; }
        .holographic-mask-scroll-demo .shader { position:relative; width:100%; height:100%; overflow:hidden; backface-visibility:hidden; }
        .holographic-mask-scroll-demo .shader-layer { background:black; mix-blend-mode:multiply; position:absolute; inset:0; width:100%; height:100%; background-position:center; }
        .holographic-mask-scroll-demo .specular { mix-blend-mode:color-dodge; background-attachment:fixed; }
        .holographic-mask-scroll-demo .mask { mix-blend-mode:multiply; object-fit:cover; }
        .holographic-mask-scroll-demo .gradient-sparrow { background-image:linear-gradient(0deg,hsl(359,60%,40%),hsl(16,60%,45%),hsl(33,60%,50%),hsl(45,60%,55%),hsl(58,60%,60%),hsl(58,60%,65%),hsl(58,60%,70%),hsl(96,60%,65%),hsl(146,60%,60%),hsl(183,60%,55%),hsl(225,60%,50%),hsl(265,60%,45%),hsl(303,60%,40%)); }
        .holographic-mask-scroll-demo .holo-base { width:100%; height:100%; display:block; object-fit:cover; }
        .holographic-mask-scroll-demo .holo-note { position:absolute; z-index:3; left:14px; bottom:10px; color:#eee6d8; font:9px var(--mono,monospace); letter-spacing:.13em; }
        @media (prefers-reduced-motion:reduce) { .holographic-mask-scroll-demo .specular { background-attachment:scroll; } }
      `}),o.jsxs("div",{className:"shader",children:[o.jsx("img",{className:"holo-base",src:"https://assets.codepen.io/2153413/sparrow-base.png",alt:"Silhouette design of a sparrow sitting on a branch"}),o.jsx("div",{className:"shader-layer specular gradient-sparrow",children:o.jsx("img",{className:"shader-layer mask",src:"https://assets.codepen.io/2153413/sparrow-mask.png",alt:"","aria-hidden":"true"})})]}),o.jsx("span",{className:"holo-note",children:"SCROLL THE PAGE · FIXED-BACKGROUND MASK SHADER"})]})}export{s as default};
