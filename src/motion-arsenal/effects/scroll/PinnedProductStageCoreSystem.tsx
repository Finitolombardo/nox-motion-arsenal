import { useEffect, useState } from 'react';
import {
  PinnedProductStage as BasePinnedProductStage,
  PRODUCT_STAGE_VARIANTS,
  type PinnedProductStageProps,
  type ProductStageVariantId,
} from './PinnedProductStageVariants';

const VARIANT_IDS = Object.keys(PRODUCT_STAGE_VARIANTS) as ProductStageVariantId[];

const CORE_SYSTEM_CSS = String.raw`
.pcsys-root { position:absolute; inset:0; overflow:hidden; }
.pcsys-root[data-product-variant='nox-floating-card-os'] .nfco-card { border-color:color-mix(in srgb,var(--pps-accent) 62%,rgba(255,255,255,.16)); }
.pcsys-root > .pps-root { position:absolute; inset:0; }
.pcsys-switcher { position:absolute; left:18px; right:18px; top:36px; z-index:70; display:flex; gap:5px; overflow-x:auto; scrollbar-width:none; pointer-events:auto; }
.pcsys-switcher::-webkit-scrollbar { display:none; }
.pcsys-switcher button { flex:0 0 auto; padding:6px 8px; border:1px solid rgba(255,255,255,.09); background:rgba(8,8,10,.72); color:rgba(255,255,255,.38); font:800 6px/1 var(--mono,monospace); letter-spacing:.14em; cursor:pointer; backdrop-filter:blur(8px); transition:.25s ease; }
.pcsys-switcher button:hover { color:#fff; border-color:var(--pps-accent); transform:translateY(-1px); }
.pcsys-switcher button[aria-pressed='true'] { color:#fff; border-color:var(--pps-accent-2); background:color-mix(in srgb,var(--pps-accent) 18%,rgba(8,8,10,.88)); box-shadow:0 0 13px color-mix(in srgb,var(--pps-accent) 28%,transparent); }

.pcsys-root .pps-core { overflow:visible; isolation:isolate; transition:clip-path .45s ease,border-radius .45s ease,background .45s ease,box-shadow .45s ease; }
.pcsys-root .pps-core svg { opacity:0; }
.pcsys-root .pps-core::before,.pcsys-root .pps-core::after { box-sizing:border-box; }
@keyframes pcsys-spin { to { transform:rotate(360deg); } }
@keyframes pcsys-spin-reverse { to { transform:rotate(-360deg); } }
@keyframes pcsys-breathe { 50% { opacity:.48; transform:scale(.91); } }
@keyframes pcsys-scan { 0%,100% { background-position:0 0; } 50% { background-position:100% 100%; } }

/* Revenue Reactor Core */
.pcsys-root[data-product-variant='nox-global-sales-os'] .pps-core { border-radius:22%; clip-path:polygon(50% 0,88% 18%,100% 58%,72% 100%,26% 96%,0 58%,10% 18%); background:radial-gradient(circle at 52% 46%,rgba(255,221,154,.28) 0 4%,transparent 16%),linear-gradient(145deg,#210b08,#090607 68%); border-color:#d9683e; box-shadow:0 0 28px rgba(219,74,45,.42),inset 0 0 26px rgba(255,164,85,.12); }
.pcsys-root[data-product-variant='nox-global-sales-os'] .pps-core::before { inset:-14px; border-radius:26%; clip-path:inherit; border:1px solid color-mix(in srgb,var(--pps-accent-2) 62%,transparent); background:conic-gradient(from 20deg,transparent 0 18%,color-mix(in srgb,var(--pps-accent-2) 46%,transparent) 20% 21%,transparent 23% 54%,color-mix(in srgb,var(--pps-accent) 55%,transparent) 56% 58%,transparent 60%); animation:pcsys-spin 16s linear infinite; }
.pcsys-root[data-product-variant='nox-global-sales-os'] .pps-core::after { content:'REVENUE'; inset:19%; display:flex; align-items:flex-end; justify-content:center; padding-bottom:8px; border-radius:18%; border:1px solid rgba(255,196,112,.46); background:linear-gradient(135deg,transparent 0 46%,var(--pps-accent-2) 48% 50%,transparent 52%),linear-gradient(25deg,transparent 0 43%,var(--pps-accent) 45% 47%,transparent 49%),radial-gradient(circle at 50% 43%,#fff 0 3%,var(--pps-accent-2) 5%,transparent 14%); color:#ffe0ac; font:800 5px/1 var(--mono,monospace); letter-spacing:.2em; filter:drop-shadow(0 0 8px var(--pps-accent)); animation:pcsys-breathe 3.2s ease-in-out infinite; }
.pcsys-root[data-product-variant='nox-global-sales-os'] .pps-shell { border-radius:20%; background:linear-gradient(145deg,color-mix(in srgb,var(--pps-accent) 6%,rgba(255,255,255,.045)),rgba(255,255,255,.004)); }

/* Agent Nexus Core */
.pcsys-root[data-product-variant='project-x-command-center'] .pps-core { border-radius:7px; clip-path:polygon(10% 0,90% 0,100% 10%,100% 90%,90% 100%,10% 100%,0 90%,0 10%); background:linear-gradient(90deg,rgba(132,95,255,.09) 1px,transparent 1px),linear-gradient(rgba(132,95,255,.09) 1px,transparent 1px),linear-gradient(145deg,#120b20,#06060a 72%); background-size:10px 10px,10px 10px,auto; box-shadow:0 0 30px rgba(122,78,255,.4),inset 0 0 24px rgba(95,180,255,.08); }
.pcsys-root[data-product-variant='project-x-command-center'] .pps-core::before { inset:-12px; border-radius:9px; border:1px dashed color-mix(in srgb,var(--pps-accent-2) 64%,transparent); background:radial-gradient(circle at 50% 0,var(--pps-accent-2) 0 2px,transparent 3px),radial-gradient(circle at 100% 50%,var(--pps-accent) 0 2px,transparent 3px),radial-gradient(circle at 50% 100%,var(--pps-accent-2) 0 2px,transparent 3px),radial-gradient(circle at 0 50%,var(--pps-accent) 0 2px,transparent 3px); animation:pcsys-spin 22s linear infinite; }
.pcsys-root[data-product-variant='project-x-command-center'] .pps-core::after { content:'NEXUS'; inset:23%; display:flex; align-items:flex-end; justify-content:center; padding-bottom:7px; border-radius:50%; border:1px solid var(--pps-accent-2); background:linear-gradient(90deg,transparent 47%,var(--pps-accent-2) 49% 51%,transparent 53%),linear-gradient(transparent 47%,var(--pps-accent) 49% 51%,transparent 53%),radial-gradient(circle,#fff 0 3%,var(--pps-accent-2) 5% 9%,transparent 11%); color:#e7dcff; font:800 5px/1 var(--mono,monospace); letter-spacing:.2em; filter:drop-shadow(0 0 9px var(--pps-accent)); animation:pcsys-spin-reverse 9s linear infinite; }
.pcsys-root[data-product-variant='project-x-command-center'] .pps-shell { border-radius:5px; clip-path:polygon(8% 0,92% 0,100% 8%,100% 92%,92% 100%,8% 100%,0 92%,0 8%); }
.pcsys-root[data-product-variant='project-x-command-center'] .pps-orbit { border-style:dashed; }

/* Signal Growth Nucleus */
.pcsys-root[data-product-variant='ai-growth-engine'] .pps-core { border-radius:50%; clip-path:none; background:radial-gradient(circle at 50% 50%,#fff 0 2%,var(--pps-accent-2) 4% 7%,color-mix(in srgb,var(--pps-accent) 24%,#09070f) 18%,#07070a 62%); box-shadow:0 0 36px color-mix(in srgb,var(--pps-accent) 48%,transparent),inset 0 0 28px color-mix(in srgb,var(--pps-accent-2) 12%,transparent); }
.pcsys-root[data-product-variant='ai-growth-engine'] .pps-core::before { inset:-19px; border-radius:50%; border:1px solid color-mix(in srgb,var(--pps-accent-2) 48%,transparent); box-shadow:0 0 0 9px color-mix(in srgb,var(--pps-accent) 8%,transparent),0 0 0 20px color-mix(in srgb,var(--pps-accent) 5%,transparent); animation:pcsys-breathe 3.4s ease-in-out infinite; }
.pcsys-root[data-product-variant='ai-growth-engine'] .pps-core::after { content:'SIGNAL'; inset:18%; display:flex; align-items:flex-end; justify-content:center; padding-bottom:5px; border-radius:50%; border:1px dashed color-mix(in srgb,var(--pps-accent-2) 62%,transparent); background:conic-gradient(from 20deg,transparent 0 14%,var(--pps-accent-2) 16% 17%,transparent 19% 45%,var(--pps-accent) 47% 49%,transparent 51% 78%,var(--pps-accent-2) 80% 81%,transparent 83%),radial-gradient(circle,#fff 0 3%,var(--pps-accent-2) 5%,transparent 17%); color:#ece5ff; font:800 5px/1 var(--mono,monospace); letter-spacing:.2em; filter:drop-shadow(0 0 9px var(--pps-accent)); animation:pcsys-spin 7s linear infinite; }
.pcsys-root[data-product-variant='ai-growth-engine'] .pps-shell { border-radius:50%; }
.pcsys-root[data-product-variant='ai-growth-engine'] .pps-orbit { border-width:2px; opacity:.76; }

/* Conversion Prism */
.pcsys-root[data-product-variant='conversion-website-system'] .pps-core { border-radius:10px; clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%); background:linear-gradient(135deg,rgba(255,255,255,.16),transparent 22%),linear-gradient(315deg,color-mix(in srgb,var(--pps-accent) 22%,#070708),#080709 64%); box-shadow:0 0 30px color-mix(in srgb,var(--pps-accent) 42%,transparent),inset 0 0 22px rgba(255,255,255,.05); }
.pcsys-root[data-product-variant='conversion-website-system'] .pps-core::before { inset:-12px; border-radius:0; clip-path:inherit; border:1px solid color-mix(in srgb,var(--pps-accent-2) 62%,transparent); animation:pcsys-breathe 3s ease-in-out infinite; }
.pcsys-root[data-product-variant='conversion-website-system'] .pps-core::after { content:'CONVERT'; inset:23%; display:flex; align-items:flex-end; justify-content:center; padding-bottom:5px; transform:rotate(45deg); border-radius:4px; border:1px solid color-mix(in srgb,var(--pps-accent-2) 58%,transparent); background:linear-gradient(180deg,color-mix(in srgb,var(--pps-accent-2) 24%,transparent),transparent 55%),linear-gradient(90deg,transparent 45%,var(--pps-accent-2) 47% 49%,transparent 51%); color:#ecfff8; font:800 5px/1 var(--mono,monospace); letter-spacing:.14em; box-shadow:0 0 0 7px color-mix(in srgb,var(--pps-accent) 7%,transparent),0 0 16px var(--pps-accent); }
.pcsys-root[data-product-variant='conversion-website-system'] .pps-shell { border-radius:10px; clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%); }
.pcsys-root[data-product-variant='conversion-website-system'] .pps-orbit { border-radius:14%; }

/* Automation Kernel */
.pcsys-root[data-product-variant='automation-ops-system'] .pps-core { border-radius:0; clip-path:polygon(24% 0,76% 0,100% 24%,100% 76%,76% 100%,24% 100%,0 76%,0 24%); background:linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(145deg,#0b1110,#050807 70%); background-size:9px 9px,9px 9px,auto; box-shadow:0 0 30px color-mix(in srgb,var(--pps-accent) 38%,transparent),inset 0 0 24px rgba(140,255,214,.05); }
.pcsys-root[data-product-variant='automation-ops-system'] .pps-core::before { inset:-12px; border-radius:0; clip-path:inherit; border:1px solid color-mix(in srgb,var(--pps-accent-2) 58%,transparent); background:linear-gradient(90deg,transparent 48%,var(--pps-accent-2) 49% 51%,transparent 52%),linear-gradient(transparent 48%,var(--pps-accent) 49% 51%,transparent 52%); animation:pcsys-breathe 2.8s ease-in-out infinite; }
.pcsys-root[data-product-variant='automation-ops-system'] .pps-core::after { content:'OPS'; inset:23%; display:flex; align-items:flex-end; justify-content:center; padding-bottom:6px; border-radius:4px; border:1px solid color-mix(in srgb,var(--pps-accent-2) 58%,transparent); background:linear-gradient(90deg,transparent 47%,var(--pps-accent-2) 49% 51%,transparent 53%),linear-gradient(transparent 47%,var(--pps-accent) 49% 51%,transparent 53%),radial-gradient(circle,#fff 0 3%,var(--pps-accent-2) 5%,transparent 15%); color:#dffff2; font:800 5px/1 var(--mono,monospace); letter-spacing:.22em; box-shadow:0 0 14px var(--pps-accent); animation:pcsys-scan 4s ease-in-out infinite; }
.pcsys-root[data-product-variant='automation-ops-system'] .pps-shell { border-radius:0; clip-path:polygon(18% 0,82% 0,100% 18%,100% 82%,82% 100%,18% 100%,0 82%,0 18%); }
.pcsys-root[data-product-variant='automation-ops-system'] .pps-orbit { border-style:dotted; }

/* Page mode: the core system wrapper must not be an absolute overlay. */
.pcsys-page { position:relative; inset:auto; overflow:visible; overflow:clip; }
.pcsys-page > .pps-track { position:relative; }

/* NOX Revenue OS — Command Core: a squared operator console rather than a
   reactor. Signals enter, the frame holds, the release stays human. */
.pcsys-root[data-product-variant='nox-revenue-os'] .pps-core { border-radius:12px; clip-path:polygon(14% 0,86% 0,100% 14%,100% 86%,86% 100%,14% 100%,0 86%,0 14%); background:linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(150deg,#1a0d0d,#07070a 70%); background-size:11px 11px,11px 11px,auto; box-shadow:0 0 30px color-mix(in srgb,var(--pps-accent) 40%,transparent),inset 0 0 24px color-mix(in srgb,var(--pps-accent-2) 9%,transparent); }
.pcsys-root[data-product-variant='nox-revenue-os'] .pps-core::before { inset:-14px; border-radius:14px; clip-path:inherit; border:1px solid color-mix(in srgb,var(--pps-accent-2) 58%,transparent); background:conic-gradient(from 0deg,transparent 0 24%,color-mix(in srgb,var(--pps-accent-2) 42%,transparent) 25% 27%,transparent 28% 74%,color-mix(in srgb,var(--pps-accent) 50%,transparent) 75% 77%,transparent 78%); animation:pcsys-spin 19s linear infinite; }
.pcsys-root[data-product-variant='nox-revenue-os'] .pps-core::after { content:'NOX'; inset:24%; display:flex; align-items:flex-end; justify-content:center; padding-bottom:7px; border-radius:8px; border:1px solid color-mix(in srgb,var(--pps-accent-2) 55%,transparent); background:linear-gradient(90deg,transparent 47%,var(--pps-accent-2) 49% 51%,transparent 53%),linear-gradient(transparent 47%,var(--pps-accent) 49% 51%,transparent 53%),radial-gradient(circle,#fff 0 3%,var(--pps-accent-2) 5%,transparent 16%); color:#ffe4d4; font:800 5px/1 var(--mono,monospace); letter-spacing:.24em; filter:drop-shadow(0 0 8px var(--pps-accent)); animation:pcsys-breathe 3.6s ease-in-out infinite; }
.pcsys-root[data-product-variant='nox-revenue-os'] .pps-shell { border-radius:10px; clip-path:polygon(10% 0,90% 0,100% 10%,100% 90%,90% 100%,10% 100%,0 90%,0 10%); }

@container (max-width:700px) { .pcsys-switcher { left:12px; right:12px; top:35px; } }
@media (prefers-reduced-motion:reduce) { .pcsys-root .pps-core::before,.pcsys-root .pps-core::after { animation:none!important; } }
`;

export function PinnedProductStageCoreSystem({
  variant = 'nox-global-sales-os',
  showVariantSwitcher = true,
  ...motionProps
}: PinnedProductStageProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductStageVariantId>(variant);
  const pageDriven = (motionProps.scrollDriver === 'page' || motionProps.pageScrollMode === true)
    && motionProps.previewScrollSimulation !== true;

  useEffect(() => setSelectedVariant(variant), [variant]);

  return (
    <div
      className={`pcsys-root${pageDriven ? ' pcsys-page' : ''}`}
      data-product-variant={selectedVariant}
    >
      <BasePinnedProductStage
        {...motionProps}
        variant={selectedVariant}
        showVariantSwitcher={false}
      />
      <style>{CORE_SYSTEM_CSS}</style>
      {showVariantSwitcher && (
        <nav className="pcsys-switcher" aria-label="Product core variants">
          {VARIANT_IDS.map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={selectedVariant === id}
              onClick={() => setSelectedVariant(id)}
            >
              {PRODUCT_STAGE_VARIANTS[id].shortLabel}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}

export { PRODUCT_STAGE_VARIANTS };
export type { PinnedProductStageProps, ProductStageVariantId };
export default PinnedProductStageCoreSystem;
