import React, { useEffect, useMemo, useRef, useState } from 'react';

const INITIAL_WINDOW = 12;
const STEP = 12;

/**
 * Incremental grid.
 *
 * The library must never mount every approved core's live preview at once —
 * with 110 entries that is 110 concurrent rAF loops and canvases. Only a
 * growing window is rendered, extended when a sentinel at the end of the list
 * scrolls into view. Combined with EffectPreview's own in-view gate, at most a
 * screenful of effects is ever actually running.
 */
export function IncrementalGrid<T>({
  items,
  getKey,
  render,
  emptyState,
  label,
}: {
  items: readonly T[];
  getKey: (item: T) => string;
  render: (item: T) => React.ReactNode;
  emptyState?: React.ReactNode;
  label?: string;
}) {
  const [limit, setLimit] = useState(INITIAL_WINDOW);
  const sentinel = useRef<HTMLDivElement>(null);

  // A changed result set restarts the window; otherwise filtering down from
  // 110 to 3 would leave the previous large window in place.
  useEffect(() => {
    setLimit(INITIAL_WINDOW);
  }, [items]);

  const visible = useMemo(() => items.slice(0, limit), [items, limit]);
  const remaining = items.length - visible.length;

  useEffect(() => {
    const element = sentinel.current;
    if (!element || remaining <= 0) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setLimit((current) => Math.min(items.length, current + STEP));
      }
    }, { rootMargin: '400px' });
    observer.observe(element);
    return () => observer.disconnect();
  }, [remaining, items.length]);

  if (!items.length) return <>{emptyState}</>;

  return (
    <>
      <div
        className="grid"
        data-testid="incremental-grid"
        data-rendered={visible.length}
        data-total={items.length}
        aria-label={label}
        tabIndex={-1}
      >
        {visible.map((item) => (
          <React.Fragment key={getKey(item)}>{render(item)}</React.Fragment>
        ))}
      </div>
      {remaining > 0 && (
        <div className="grid-sentinel" ref={sentinel} data-testid="grid-sentinel">
          <button type="button" className="copy-btn" onClick={() => setLimit((current) => Math.min(items.length, current + STEP))}>
            {remaining} WEITERE LADEN
          </button>
        </div>
      )}
    </>
  );
}
