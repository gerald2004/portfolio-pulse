import { useLayoutEffect, useState, type RefObject } from 'react';

/**
 * The current width of an element in CSS pixels, updated whenever it resizes.
 *
 * The charts draw at the real width of their card, so text stays readable on a
 * phone instead of shrinking with the drawing. Where the width can't be measured
 * (tests, or before the first layout) it returns `fallback`.
 */
export function useElementWidth(ref: RefObject<HTMLElement>, fallback = 600): number {
  const [width, setWidth] = useState(fallback);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const w = Math.floor(el.clientWidth);
      if (w > 0) setWidth(w);
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return width;
}
