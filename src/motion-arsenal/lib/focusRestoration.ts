import { useCallback, useEffect, useRef } from 'react';

// ---------------------------------------------------------------------------
// Focus restoration (Drive canon D016).
//
// Opening a core and coming back used to drop focus on <body>, which makes the
// gallery unusable by keyboard: you land at the top of the document and have to
// tab through the whole sidebar again to get back to where you were.
//
// The rules that matter here:
//   - restore to the exact originating control when it is still mounted;
//   - never focus an unmounted row (the grid renders a window, so the card you
//     came from may legitimately be gone);
//   - fall back to the nearest semantic ancestor rather than to nothing;
//   - restoring focus must not change selection, filters or scroll position.
// ---------------------------------------------------------------------------

export interface FocusIntent {
  /** Monotonic token; a stale restore can never steal focus from a newer one. */
  token: number;
  effectId: string;
}

export function useFocusRestoration(active: boolean) {
  const intent = useRef<FocusIntent | null>(null);
  const tokenRef = useRef(0);

  const remember = useCallback((effectId: string) => {
    tokenRef.current += 1;
    intent.current = { token: tokenRef.current, effectId };
  }, []);

  useEffect(() => {
    if (!active) return;
    const pending = intent.current;
    if (!pending) return;
    intent.current = null;

    // Wait one frame so the grid has committed its window before we look for
    // the row; querying during the same tick finds nothing on a fresh mount.
    const raf = requestAnimationFrame(() => {
      if (pending.token !== tokenRef.current) return;
      const target = document.querySelector<HTMLElement>(`[data-effect-id="${CSS.escape(pending.effectId)}"]`);
      const fallback = document.querySelector<HTMLElement>('[data-testid="incremental-grid"]')
        ?? document.querySelector<HTMLElement>('main');
      const element = target ?? fallback;
      if (!element) return;
      // preventScroll: restoring focus must not yank the viewport around.
      element.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return remember;
}
