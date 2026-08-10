// Runtime-QA-Harness-Entry: mountet die echten Komponenten below-fold und
// exponiert Props-Updater (window.__setPTD / window.__setAGS) für Playwright.
import { createRoot } from 'react-dom/client';
import { useState, type ComponentType } from 'react';
import PointerTextDepth from '/src/motion-arsenal/effects/hero/PointerTextDepth';
import AngledGoldStrike from '/src/motion-arsenal/effects/hero/AngledGoldStrike';

declare global {
  interface Window {
    __setPTD: (p: Record<string, unknown>) => void;
    __setAGS: (p: Record<string, unknown>) => void;
    __qaReady: boolean;
  }
}

function makeHost<T extends Record<string, unknown>>(
  Component: ComponentType<T>,
  setterName: 'setPTD' | 'setAGS',
  mountId: string,
) {
  function Host() {
    const [props, setProps] = useState<Record<string, unknown>>({});
    window[`__${setterName}`] = (p: Record<string, unknown>) => setProps((s) => ({ ...s, ...p }));
    return <Component {...(props as T)} />;
  }
  createRoot(document.getElementById(mountId)!).render(<Host />);
}

makeHost(PointerTextDepth, 'setPTD', 'ptd-mount');
makeHost(AngledGoldStrike, 'setAGS', 'ags-mount');
window.__qaReady = true;
