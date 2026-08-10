import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';

export interface CinemaLetterboxModalProps {
  title?: string;
  image?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  accent?: string;
}

export default function CinemaLetterboxModal({
  title = 'NIGHT SIGNAL / 01', image, open: controlled, onOpenChange, accent = '#d4a24a',
}: CinemaLetterboxModalProps) {
  const [localOpen, setLocalOpen] = useState(false);
  const isOpen = controlled ?? localOpen;
  const setOpen = (value: boolean) => { setLocalOpen(value); onOpenChange?.(value); };

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const style = { '--cinema-accent': accent, '--cinema-image': image ? `url(${image})` : 'linear-gradient(135deg,#242027,#090a0d)' } as CSSProperties;
  return <div className="nox-cinema" style={style}>
    <button className="nox-cinema__trigger" type="button" onClick={() => setOpen(true)} aria-haspopup="dialog">
      <span className="nox-cinema__thumb" aria-hidden="true" /><span>{title}</span><b>PLAY</b>
    </button>
    {isOpen && <div className="nox-cinema__backdrop" role="presentation" onClick={() => setOpen(false)}>
      <div className="nox-cinema__stage" role="dialog" aria-modal="true" aria-label={title} onClick={(event) => event.stopPropagation()}>
        <i className="nox-cinema__bar nox-cinema__bar--top" aria-hidden="true" />
        <div className="nox-cinema__frame"><div className="nox-cinema__picture" /><h2>{title}</h2><small>ARCHIVE REEL // 00:42</small></div>
        <i className="nox-cinema__bar nox-cinema__bar--bottom" aria-hidden="true" />
        <button className="nox-cinema__close" type="button" onClick={() => setOpen(false)} aria-label="Close">×</button>
      </div>
    </div>}
    <style>{CSS}</style>
  </div>;
}

const CSS = `
.nox-cinema{color:#f7e8a4;font:600 11px ui-monospace,monospace;letter-spacing:.12em}.nox-cinema__trigger{display:flex;align-items:center;gap:14px;width:100%;padding:10px;background:#111217;border:1px solid #4a3923;color:#f7e8a4;cursor:pointer;text-align:left}.nox-cinema__trigger:focus-visible,.nox-cinema__close:focus-visible{outline:2px solid var(--cinema-accent);outline-offset:3px}.nox-cinema__thumb{width:58px;height:34px;background:var(--cinema-image) center/cover;filter:saturate(.7);box-shadow:inset 0 0 0 1px #d4a24a66}.nox-cinema__trigger b{margin-left:auto;color:var(--cinema-accent)}.nox-cinema__backdrop{position:fixed;inset:0;z-index:50;background:#030305d9;backdrop-filter:blur(7px);display:grid;place-items:center}.nox-cinema__stage{position:relative;width:min(900px,94vw);height:min(620px,86vh);display:grid;place-items:center;perspective:900px}.nox-cinema__bar{position:absolute;left:0;width:100%;height:22%;background:#050507;transform:scaleY(1);animation:noxCinemaBar .65s cubic-bezier(.2,.8,.2,1) both}.nox-cinema__bar--top{top:0;transform-origin:top}.nox-cinema__bar--bottom{bottom:0;transform-origin:bottom}.nox-cinema__frame{width:min(760px,82vw);aspect-ratio:16/9;display:grid;place-items:center;align-content:center;gap:10px;border:1px solid var(--cinema-accent);background:#0b0c10 var(--cinema-image) center/cover;box-shadow:0 0 45px #d4a24a33;animation:noxCinemaFrame .8s .08s both}.nox-cinema__picture{position:absolute;inset:17% 8%;background:linear-gradient(140deg,#fff3 1px,transparent 1px),linear-gradient(20deg,#d4a24a33,#08090d 65%);mix-blend-mode:screen}.nox-cinema h2,.nox-cinema small{position:relative;text-shadow:0 2px 10px #000}.nox-cinema__close{position:absolute;right:2%;top:18%;background:#101116;color:#f7e8a4;border:1px solid var(--cinema-accent);font-size:24px;width:38px;height:38px;cursor:pointer}@keyframes noxCinemaBar{from{transform:scaleY(0)}to{transform:scaleY(1)}}@keyframes noxCinemaFrame{from{opacity:0;transform:scale(.72) translateZ(-80px)}to{opacity:1;transform:scale(1) translateZ(0)}}@media(prefers-reduced-motion:reduce){.nox-cinema__bar,.nox-cinema__frame{animation:none}}`;
