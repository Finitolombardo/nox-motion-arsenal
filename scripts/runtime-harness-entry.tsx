// Runtime-QA-Harness Entry (Vite-Modul) — siehe runtime-harness.html.
// Beide Effekte werden ECHT gemountet (kein Unmount durch EffectPreview),
// liegen below-fold; Props via window.__setGauge / __setGold änderbar.
import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import GaugeNeedleSweep from '/src/motion-arsenal/effects/system/GaugeNeedleSweep.tsx';
import GoldOutlineFillText from '/src/motion-arsenal/effects/hero/GoldOutlineFillText.tsx';

function GaugeHost() {
  const [props, setProps] = useState({});
  window.__setGauge = (p) => setProps((s) => ({ ...s, ...p }));
  return <GaugeNeedleSweep {...props} />;
}

function GoldHost() {
  const [props, setProps] = useState({});
  window.__setGold = (p) => setProps((s) => ({ ...s, ...p }));
  return <GoldOutlineFillText {...props} />;
}

createRoot(document.getElementById('gauge-mount')!).render(<GaugeHost />);
createRoot(document.getElementById('gold-mount')!).render(<GoldHost />);
window.__qaReady = true;
