import React from 'react';

export function ConceptEffectPreview({ name, tone }: { name: string; tone: number }) {
  const accent = ['#d4a24a', '#c95a4d', '#8e9cff', '#63c4aa'][tone % 4];
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#08090d' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: .26, backgroundImage: 'linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px),linear-gradient(90deg,rgba(255,255,255,.08) 1px,transparent 1px)', backgroundSize: '22px 22px' }} />
      <div style={{ position: 'absolute', width: '78%', aspectRatio: '1', border: `1px solid ${accent}99`, borderRadius: tone % 2 ? '12%' : '50%', left: '11%', top: '10%', transform: `rotate(${tone * 11}deg)`, boxShadow: `0 0 46px ${accent}2d` }} />
      <div style={{ position: 'absolute', width: '42%', height: '12%', background: `linear-gradient(90deg, transparent, ${accent}, transparent)`, left: '29%', top: `${24 + (tone % 4) * 12}%`, filter: 'blur(1px)' }} />
      <div style={{ position: 'absolute', left: 12, bottom: 10, right: 12, color: '#d7cebf', fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '.12em' }}>CONCEPT DECK / {name.toUpperCase()}</div>
    </div>
  );
}
