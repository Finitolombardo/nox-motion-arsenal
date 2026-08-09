import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { PRODUCT_STAGE_VARIANTS, type ProductStageVariantId } from './PinnedProductStageVariants';
import { usePrefersReducedMotion } from '../../lib/animationUtils';

type Vars = CSSProperties & Record<`--${string}`, string | number>;

export type StickyStoryProps = {
  variant?: ProductStageVariantId;
  /** Höhe eines Kapitels in vh. Bewusst < 100, damit die Sektion zügig bleibt. */
  chapterHeight?: number;
  /** Abstand des klebenden Visuals zur Viewport-Oberkante, in vh. */
  stickyOffset?: number;
  /** Fokuslinie im Viewport (0…1). Das nächstgelegene Kapitel ist aktiv. */
  activeThreshold?: number;
  /** Ruheneigung der Tafel in Grad: [rotateX, rotateY]. */
  panelTilt?: [number, number];
  /** translateZ im Wechselimpuls (negativ = nach hinten). */
  panelDepth?: number;
  /** Millisekunden, die der Inhalt ausgeblendet ist, bevor getauscht wird. */
  contentTransition?: number;
  /** Einblendung der Kapiteltexte. */
  textReveal?: 'blur-rise' | 'fade' | 'none';
  /** Mobile-Verhalten: Tafel je Kapitel gestapelt oder nur Text. */
  mobileStack?: boolean;
  /**
   * `page` (Default) — das Layout lebt im Dokumentfluss und wird vom
   * Seitenscroll getrieben. So gehört es auf eine echte Website.
   * `internal` — eigener Scrollport für die Arsenal-Vorschau. Nötig, weil die
   * Vorschau eine feste Boxhöhe hat: `vh` würde dort ins Leere greifen.
   */
  scrollDriver?: 'page' | 'internal';
};

/**
 * STICKY STORY — Visual bleibt stehen, die Story scrollt normal weiter.
 *
 * Gegenentwurf zur gepinnten Vollbildbühne: es gibt kein Scroll-Gefängnis.
 * Die Sektion ist genau so hoch wie ihre Kapitel, das Visual klebt per
 * `position:sticky`, und die Kapitel rechts sind echter DOM-Content mit
 * eigener vertikaler Position — alter Text bleibt oben stehen, neuer kommt
 * von unten. Kein Text wird am selben Platz ersetzt.
 *
 * Die Tafel bewegt sich nur dezent (Ruhelage `panelTilt`, im Wechsel ein
 * kurzer Impuls um wenige Grad). Keine grosse Y-Rotation, kein Flip, keine
 * Rückseite, keine zweite Tafel im DOM. Aktive Stufe kommt aus einem
 * IntersectionObserver plus einem entprellten Scroll-Listener — kein
 * dauerhafter rAF-Loop.
 */
const CSS = String.raw`
/* --pss-unit ist ein Hundertstel der massgeblichen Höhe: im Seitenmodus der
   Viewport, im Scrollport-Modus die Boxhöhe. Alles Vertikale rechnet damit,
   statt mit vh — sonst funktioniert das Layout in der Arsenal-Vorschau nicht. */
/* Die Arsenal-Vorschau zentriert Effekte in einer Flexbox — ohne explizite
   Breite schrumpft ein Blockelement dort auf 0 und die Container-Query greift
   ins Leere. */
.pss-root{position:relative;container-type:inline-size;color:#fff1f3;--pss-unit:1vh;width:100%;align-self:stretch}
.pss-root[data-scrollport='true']{height:100%;overflow-y:auto;overscroll-behavior:contain}
.pss-desktop{display:grid;grid-template-columns:minmax(0,1.02fr) minmax(300px,.98fr);align-items:start;gap:clamp(1.6rem,4cqw,4rem)}
.pss-visual-col{position:sticky;display:flex;flex-direction:column;justify-content:center;gap:1.2rem}
.pss-visual{position:relative;width:min(100%,600px);aspect-ratio:1.14;perspective:1500px;transform-style:preserve-3d;pointer-events:none}
.pss-aura{position:absolute;inset:10%;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--pss-accent) 24%,transparent),transparent 68%);filter:blur(34px);opacity:.55;transition:background .5s ease}
.pss-rig{position:absolute;inset:6% 2%;transform-origin:50% 50%;transform-style:preserve-3d;transition:transform .42s cubic-bezier(.22,.7,.2,1);will-change:transform}
.pss-panel{position:absolute;inset:0;padding:clamp(.9rem,2.2cqw,1.7rem);border:1px solid color-mix(in srgb,var(--pss-accent) 42%,rgba(255,255,255,.13));border-radius:1.2rem;background-color:#07050a;background-image:linear-gradient(148deg,rgba(255,241,243,.075),rgba(21,13,17,.92) 38%,rgba(5,3,5,.98));box-shadow:inset 0 1px rgba(255,255,255,.11),inset 0 0 64px rgba(0,0,0,.48),0 36px 90px rgba(0,0,0,.58),0 0 36px color-mix(in srgb,var(--pss-accent) 15%,transparent);backface-visibility:hidden;transition:border-color .5s ease,box-shadow .5s ease}
.pss-edge{position:absolute;left:4%;right:4%;top:0;height:1px;background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--pss-accent) 58%,#fff),transparent);transition:background .5s ease}
.pss-head,.pss-body,.pss-foot{transition:opacity .3s ease,filter .3s ease,transform .3s ease}
.pss-visual[data-phase='out'] .pss-head,.pss-visual[data-phase='out'] .pss-body,.pss-visual[data-phase='out'] .pss-foot{opacity:0;filter:blur(7px);transform:translateY(7px)}
.pss-head{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;padding-bottom:.8rem;border-bottom:1px solid rgba(255,255,255,.075);color:rgba(255,241,243,.58);font:700 clamp(.46rem,.85cqw,.62rem)/1.2 var(--mono,monospace);letter-spacing:.18em}
.pss-live{width:7px;height:7px;border-radius:50%;background:var(--pss-accent);box-shadow:0 0 12px color-mix(in srgb,var(--pss-accent) 64%,transparent)}
.pss-body{position:relative;z-index:2;display:grid;grid-template-columns:.78fr 1.45fr;grid-template-rows:1fr auto;gap:1rem;height:calc(100% - 5.2rem);padding-top:1.1rem}
.pss-symbol{position:relative;display:grid;place-items:center;align-self:center;width:min(100%,140px);aspect-ratio:1;border:1px solid color-mix(in srgb,var(--pss-accent) 34%,transparent);clip-path:polygon(12% 0,88% 0,100% 12%,100% 88%,88% 100%,12% 100%,0 88%,0 12%);background:radial-gradient(circle,color-mix(in srgb,var(--pss-accent) 15%,transparent),transparent 67%)}
.pss-symbol::before,.pss-symbol::after{content:'';position:absolute;inset:16%;border:1px solid color-mix(in srgb,var(--pss-accent) 18%,transparent);border-radius:50%}
.pss-symbol::after{inset:32%}
.pss-symbol b{color:color-mix(in srgb,var(--pss-accent) 78%,white);font:750 clamp(.7rem,1.5cqw,1.05rem)/1 var(--mono,monospace);letter-spacing:.1em}
.pss-identity{align-self:center}
.pss-identity>span{display:block;color:color-mix(in srgb,var(--pss-accent) 72%,white);font:700 .56rem/1.2 var(--mono,monospace);letter-spacing:.15em}
.pss-identity strong{display:block;max-width:12ch;margin:.6rem 0 .7rem;font-size:clamp(1.3rem,3cqw,2.5rem);line-height:.9;letter-spacing:-.05em}
.pss-identity small{color:rgba(255,241,243,.43);font:700 .53rem/1.2 var(--mono,monospace);letter-spacing:.14em}
.pss-flow{grid-column:1/-1;display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem}
.pss-node{position:relative;min-width:0;padding:.65rem .6rem;border:1px solid rgba(255,255,255,.075);background:rgba(2,3,6,.42)}
.pss-node i{display:block;color:color-mix(in srgb,var(--pss-accent) 62%,white);font:700 .48rem/1 var(--mono,monospace);font-style:normal}
.pss-node span{display:block;margin-top:.3rem;color:rgba(255,241,243,.68);font:700 clamp(.52rem,.9cqw,.7rem)/1.2 var(--mono,monospace);letter-spacing:.08em;text-transform:uppercase}
.pss-foot{position:absolute;z-index:2;left:clamp(.9rem,2.2cqw,1.7rem);right:clamp(.9rem,2.2cqw,1.7rem);bottom:clamp(.8rem,1.8cqw,1.4rem);display:flex;justify-content:space-between;gap:.5rem;color:rgba(255,241,243,.28);font:700 .44rem/1 var(--mono,monospace);letter-spacing:.12em}
.pss-track{display:flex;gap:.45rem;margin:0;padding:0;list-style:none}
.pss-track li{width:30px;height:2px;background:rgba(255,255,255,.14);transition:background .4s ease}
.pss-track li.is-active{background:var(--pss-accent);box-shadow:0 0 12px var(--pss-accent)}
.pss-story{display:flex;flex-direction:column}
.pss-chapter{display:flex;flex-direction:column;justify-content:center;padding:1.6rem 0;transition:opacity .55s ease,transform .55s ease,filter .55s ease}
.pss-chapter[data-reveal='blur-rise'][data-state='ahead']{opacity:.45;transform:translateY(24px);filter:blur(6px)}
.pss-chapter[data-reveal='fade'][data-state='ahead']{opacity:.45}
.pss-chapter[data-state='active']{opacity:1;transform:none;filter:none}
.pss-chapter[data-reveal='blur-rise'][data-state='past']{opacity:.3;filter:blur(1.5px)}
.pss-chapter[data-reveal='fade'][data-state='past']{opacity:.3}
.pss-kicker{display:block;margin:0 0 .8rem;color:color-mix(in srgb,var(--pss-chapter-accent) 70%,white);font:700 .62rem/1 var(--mono,monospace);letter-spacing:.18em}
.pss-chapter h3{margin:0;font-size:clamp(1.9rem,4.4cqw,3.9rem);line-height:.88;letter-spacing:-.055em;font-weight:730}
.pss-chapter h3 span{display:block}
.pss-chapter h3 span+span{color:transparent;-webkit-text-stroke:1px rgba(255,241,243,.75)}
.pss-chapter p{max-width:46ch;margin-top:1.2rem;color:#aeb5c4;font-size:clamp(.9rem,1.2cqw,1.1rem);line-height:1.65}
.pss-mobile{display:none}
.pss-mobile .pss-visual{perspective:none;width:100%;margin-bottom:1.2rem}
.pss-mobile .pss-rig{transform:none!important;transition:none}
.pss-mobile-chapter{padding:1.75rem 0;border-bottom:1px solid rgba(255,255,255,.08)}
@container (max-width: 860px){
  .pss-desktop{display:none}
  .pss-mobile{display:block}
}
@media(prefers-reduced-motion:reduce){
  .pss-rig,.pss-chapter,.pss-head,.pss-body,.pss-foot{transition:none!important}
  .pss-rig{transform:none!important}
  .pss-chapter{opacity:1!important;filter:none!important;transform:none!important}
}
`;

function Panel({ variantId, index }: { variantId: ProductStageVariantId; index: number }) {
  const section = PRODUCT_STAGE_VARIANTS[variantId].sections[index];
  const [line] = section.title.split('\n');
  return (
    <div className="pss-panel">
      <div className="pss-edge" aria-hidden="true" />
      <header className="pss-head">
        <span>{PRODUCT_STAGE_VARIANTS[variantId].productName}</span>
        <i className="pss-live" aria-hidden="true" />
      </header>
      <div className="pss-body">
        <div className="pss-symbol"><b>{section.stat}</b></div>
        <div className="pss-identity">
          <span>{section.kicker}</span>
          <strong>{line}</strong>
          <small>{section.statLabel}</small>
        </div>
        <div className="pss-flow">
          {section.tags.map((tag, i) => (
            <div className="pss-node" key={tag}>
              <i>0{i + 1}</i>
              <span>{tag}</span>
            </div>
          ))}
        </div>
      </div>
      <footer className="pss-foot">
        <span>STATIC MATERIAL</span>
        <span>OPERATOR GATE</span>
        <span>NO POINTER LIGHT</span>
      </footer>
    </div>
  );
}

export function PinnedProductStageStickyStory({
  variant = 'nox-scroll-story',
  chapterHeight = 68,
  stickyOffset = 0,
  activeThreshold = 0.42,
  panelTilt = [4, -6],
  panelDepth = -30,
  contentTransition = 160,
  textReveal = 'blur-rise',
  mobileStack = true,
  scrollDriver = 'page',
}: StickyStoryProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const config = PRODUCT_STAGE_VARIANTS[variant] ?? PRODUCT_STAGE_VARIANTS['nox-scroll-story'];
  const sections = config.sections;
  const chapterRefs = useRef<(HTMLElement | null)[]>([]);
  const reduced = usePrefersReducedMotion();
  const [active, setActive] = useState(0);
  const [rendered, setRendered] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'out' | 'in'>('idle');
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const root = rootRef.current;
    const chapters = chapterRefs.current.filter(Boolean) as HTMLElement[];
    const story = chapters[0]?.parentElement;
    if (!root || !chapters.length || !story) return;

    // Im Scrollport-Modus ist die Box der Bezugsrahmen, sonst der Viewport.
    const scrollport = scrollDriver === 'internal' ? root : null;
    const frame = () => (scrollport
      ? { top: scrollport.getBoundingClientRect().top, height: scrollport.clientHeight }
      : { top: 0, height: window.innerHeight });

    const syncUnit = () => {
      root.style.setProperty('--pss-unit', `${frame().height / 100}px`);
    };

    // Gemessen wird die LAYOUT-Position (`offsetTop`), nicht das transformierte
    // Rect: dessen translateY gehört zur Einblendung. Sonst hinge die Auswahl
    // vom Animationszustand ab und wäre nicht mehr richtungsunabhängig.
    const classify = () => {
      const { top: frameTop, height } = frame();
      const focus = height * activeThreshold;
      const storyTop = story.getBoundingClientRect().top - story.offsetTop - frameTop;
      let best = 0;
      let bestDistance = Infinity;
      chapters.forEach((chapter, index) => {
        const top = storyTop + chapter.offsetTop;
        const bottom = top + chapter.offsetHeight;
        const state = top > height * 0.62 ? 'ahead' : bottom < height * 0.3 ? 'past' : 'active';
        if (chapter.dataset.state !== state) chapter.dataset.state = state;
        const distance = Math.abs((top + bottom) / 2 - focus);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = index;
        }
      });
      setActive(best);
    };

    const onResize = () => { syncUnit(); classify(); };

    const io = new IntersectionObserver(classify, {
      root: scrollport,
      threshold: [0, 0.15, 0.35, 0.6, 0.85, 1],
    });
    chapters.forEach((chapter) => io.observe(chapter));

    // Der Observer meldet sich nur beim Kreuzen einer Schwelle — bei einem
    // Sprung oder schnellem Scrollen bliebe die Stufe sonst stehen.
    let inView = Boolean(scrollport);
    let ticking = 0;
    const onScroll = () => {
      if (!inView || ticking) return;
      ticking = requestAnimationFrame(() => { ticking = 0; classify(); });
    };
    const scrollTarget: HTMLElement | Window = scrollport ?? window;
    let sectionIo: IntersectionObserver | null = null;
    if (!scrollport) {
      sectionIo = new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting;
        if (inView) classify();
      }, { rootMargin: '20% 0px' });
      sectionIo.observe(root);
    }

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onResize) : null;
    ro?.observe(root);

    syncUnit();
    classify();
    scrollTarget.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    return () => {
      if (ticking) cancelAnimationFrame(ticking);
      io.disconnect();
      sectionIo?.disconnect();
      ro?.disconnect();
      scrollTarget.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [activeThreshold, sections.length, scrollDriver]);

  useEffect(() => {
    if (active === rendered) return;
    if (reduced) { setRendered(active); return; }
    setDirection(active > rendered ? 1 : -1);
    setPhase('out');
    const swap = window.setTimeout(() => { setRendered(active); setPhase('in'); }, contentTransition);
    const settle = window.setTimeout(() => setPhase('idle'), contentTransition + 420);
    return () => { window.clearTimeout(swap); window.clearTimeout(settle); };
  }, [active, rendered, reduced, contentTransition]);

  const [tiltX, tiltY] = panelTilt;
  // Zielwert inline statt per calc()/Custom-Property: ein `transform` mit einer
  // unregistrierten Variablen interpoliert in der Transition nicht zuverlässig.
  const rigStyle: CSSProperties = reduced
    ? {}
    : phase === 'out'
      ? {
        transform: `rotateX(${tiltX + 1}deg) rotateY(${tiltY - 7 * direction}deg) translateZ(${panelDepth}px) scale(0.972)`,
        transitionDuration: `${contentTransition}ms`,
      }
      : { transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`, transitionDuration: '420ms' };

  const rootVars: Vars = { '--pss-accent': sections[rendered].accent };

  return (
    <div
      className="pss-root"
      ref={rootRef}
      data-product-variant={variant}
      data-layout-mode="sticky-story"
      data-scrollport={scrollDriver === 'internal' ? 'true' : 'false'}
      style={rootVars}
    >
      <style>{CSS}</style>

      <div className="pss-desktop">
        <div
          className="pss-visual-col"
          style={{
            top: `calc(var(--pss-unit) * ${stickyOffset})`,
            height: `calc(var(--pss-unit) * ${100 - stickyOffset})`,
          }}
        >
          <div className="pss-visual" data-phase={phase} data-stage={rendered} aria-hidden="true">
            <div className="pss-aura" />
            <div className="pss-rig" style={rigStyle}>
              <Panel variantId={config.id} index={rendered} />
            </div>
          </div>
          <ol className="pss-track" aria-hidden="true">
            {sections.map((section, index) => (
              <li key={section.kicker} className={index === active ? 'is-active' : undefined} />
            ))}
          </ol>
        </div>

        <div className="pss-story">
          {sections.map((section, index) => {
            const [first, second] = section.title.split('\n');
            return (
              <article
                className="pss-chapter"
                data-state="active"
                data-reveal={textReveal}
                style={{ minHeight: `calc(var(--pss-unit) * ${chapterHeight})`, '--pss-chapter-accent': section.accent } as Vars}
                key={section.kicker}
                ref={(node) => { chapterRefs.current[index] = node; }}
              >
                <span className="pss-kicker">{section.kicker}</span>
                <h3><span>{first}</span>{second ? <span>{second}</span> : null}</h3>
                <p>{section.body}</p>
              </article>
            );
          })}
        </div>
      </div>

      <div className="pss-mobile">
        {sections.map((section, index) => {
          const [first, second] = section.title.split('\n');
          return (
            <article className="pss-mobile-chapter" key={section.kicker}>
              {mobileStack && (
                <div className="pss-visual" style={{ '--pss-accent': section.accent } as Vars} aria-hidden="true">
                  <div className="pss-rig"><Panel variantId={config.id} index={index} /></div>
                </div>
              )}
              <span className="pss-kicker" style={{ '--pss-chapter-accent': section.accent } as Vars}>{section.kicker}</span>
              <h3><span>{first}</span>{second ? <span>{second}</span> : null}</h3>
              <p>{section.body}</p>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export default PinnedProductStageStickyStory;
