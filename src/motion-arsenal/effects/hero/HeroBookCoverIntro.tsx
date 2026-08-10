import { useState, type CSSProperties } from 'react';

export interface HeroBookCoverIntroProps { title?: string; subtitle?: string; color?: string; }

export default function HeroBookCoverIntro({ title = 'THE MOTION ARSENAL', subtitle = 'A field guide to deliberate movement.', color = '#d4a24a' }: HeroBookCoverIntroProps) {
  const [open, setOpen] = useState(false);
  const [reduced, setReduced] = useState(false);
  const toggle = () => setOpen(value => !value);
  return <section className={`nox-book ${open ? 'is-open' : ''} ${reduced ? 'is-reduced' : ''}`} style={{ '--book-gold': color } as CSSProperties}>
    <button className="nox-book__stage" onClick={toggle} onFocus={() => setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches)} aria-expanded={open} aria-label={open ? 'Close book introduction' : 'Open book introduction'}>
      <span className="nox-book__back" aria-hidden="true" />
      <span className="nox-book__pages"><strong>{title}</strong><small>{subtitle}</small><i>SCROLL TO EXPLORE</i></span>
      <span className="nox-book__cover"><em>NOX</em><span>Motion<br />Arsenal</span><b>02 / 26</b></span>
      <span className="nox-book__spine" aria-hidden="true" />
    </button>
    <style>{CSS}</style>
  </section>;
}
const CSS = `.nox-book{min-height:360px;display:grid;place-items:center;background:#090a0d;color:#f7e8a4;overflow:hidden;padding:32px}.nox-book__stage{position:relative;width:min(580px,92vw);height:280px;border:0;background:transparent;perspective:1200px;cursor:pointer;color:inherit}.nox-book__back,.nox-book__pages,.nox-book__cover{position:absolute;inset:10px 9%;border-radius:4px;box-shadow:0 20px 55px #000b}.nox-book__back{background:linear-gradient(135deg,#4b3017,#17110c);transform:translateZ(-35px) rotateY(7deg)}.nox-book__pages{display:grid;align-content:center;gap:16px;padding:40px 12%;text-align:left;background:linear-gradient(100deg,#f4e6be,#8c7446);color:#15100a;transform-origin:left center;transform:translateZ(1px);transition:transform 1.1s cubic-bezier(.2,1.5,.35,1)}.nox-book__pages strong{font-size:clamp(1.3rem,4vw,2.7rem);letter-spacing:.08em}.nox-book__pages small{max-width:270px;font-size:1rem}.nox-book__pages i{font:10px ui-monospace;letter-spacing:.18em}.nox-book__cover{display:grid;align-content:space-between;padding:32px;background:linear-gradient(115deg,#372313,#9e6b2b 55%,#24160e);transform-origin:left center;transition:transform 1.1s cubic-bezier(.2,1.5,.35,1);backface-visibility:hidden;text-align:left}.nox-book__cover em{font:700 12px ui-monospace;letter-spacing:.4em}.nox-book__cover span{font:700 clamp(2rem,7vw,4.5rem);line-height:.9;text-transform:uppercase}.nox-book__cover b{font:10px ui-monospace;letter-spacing:.2em}.nox-book__spine{position:absolute;left:9%;top:10px;height:280px;width:8px;background:linear-gradient(90deg,#f7e8a4,#8b5e24,#f7e8a4);transform:translateZ(30px);box-shadow:0 0 15px var(--book-gold)}.nox-book.is-open .nox-book__cover{transform:rotateY(-145deg)}.nox-book.is-open .nox-book__pages{transform:rotateY(-8deg) translateZ(2px)}.nox-book.is-reduced *{transition:none!important;animation:none!important}.nox-book__stage:focus-visible{outline:2px solid var(--book-gold);outline-offset:8px}`;
