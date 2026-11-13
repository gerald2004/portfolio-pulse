import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { clamp } from '../charts/scale';
import { useElementWidth } from '../charts/useElementWidth';
import { BUCKETS, bucketOf, daysOverdue } from '../domain/metrics';
import type { Loan } from '../domain/types';

const HEIGHT = 48;

/** Used when the CSS variables can't be read (tests, very old browsers). Same values as styles.css. */
const FALLBACK_COLOURS = ['#3a9d5d', '#a7c957', '#f2c14e', '#f08a4b', '#d9534f', '#8e2c48'];

/** Read --age-0 … --age-5 from the page, so the canvas follows the theme like the SVG charts do. */
function readAgeColours(): string[] {
  const styles = getComputedStyle(document.documentElement);
  return FALLBACK_COLOURS.map((fallback, i) => styles.getPropertyValue(`--age-${i}`).trim() || fallback);
}

export function LoanStrip({ loans, asOf }: { loans: readonly Loan[]; asOf: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const width = useElementWidth(wrapRef);
  /** Bumped when the system theme changes, to trigger a redraw with the new colours. */
  const [themeVersion, setThemeVersion] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  // One entry per loan, least overdue first, so the strip reads as a gradient from green to red.
  const columns = useMemo(
    () =>
      loans
        .map((loan) => {
          const dpd = daysOverdue(loan, asOf);
          return { loan, dpd, bucket: BUCKETS.findIndex((b) => b.key === bucketOf(dpd)) };
        })
        .sort((a, b) => a.dpd - b.dpd || a.loan.id.localeCompare(b.loan.id)),
    [loans, asOf],
  );

  const counts = useMemo(() => BUCKETS.map((_, i) => columns.filter((c) => c.bucket === i).length), [columns]);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setThemeVersion((v) => v + 1);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  // Canvas has no elements to update: every change means painting the whole strip again.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // A canvas has two sizes. Its CSS size is what you see; its backing store is how
    // many pixels it really has. Matching the backing store to the screen's pixel
    // density keeps the columns sharp on high-resolution displays.
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(HEIGHT * dpr);
    ctx.scale(dpr, dpr); // from here on, draw in CSS pixels

    ctx.clearRect(0, 0, width, HEIGHT);
    if (columns.length === 0) return;

    const colours = readAgeColours();
    const columnWidth = width / columns.length;
    // Snap every column edge to a whole device pixel. Neighbours then share exactly
    // the same edge, so there are no blurry seams or hairline gaps between them.
    const snap = (x: number) => Math.round(x * dpr) / dpr;
    columns.forEach((column, i) => {
      const left = snap(i * columnWidth);
      const right = snap((i + 1) * columnWidth);
      ctx.fillStyle = colours[column.bucket] ?? FALLBACK_COLOURS[0]!;
      ctx.fillRect(left, 0, right - left, HEIGHT);
    });
  }, [columns, width, themeVersion]);

  const onMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    if (box.width === 0 || columns.length === 0) return;
    const index = Math.floor(((e.clientX - box.left) / box.width) * columns.length);
    setHover(clamp(index, 0, columns.length - 1));
  };

  const tip = hover === null ? undefined : columns[hover];
  const summary = BUCKETS.map((b, i) => `${counts[i]} ${b.label.toLowerCase()}`).join(', ');

  return (
    <section className="card">
      <h2>Every loan at a glance</h2>
      <div className="chart" ref={wrapRef}>
        <canvas
          ref={canvasRef}
          className="strip"
          style={{ width: '100%', height: HEIGHT }}
          role="img"
          aria-label={`${columns.length} loans ordered from least to most overdue: ${summary}`}
          onMouseMove={onMouseMove}
          onMouseLeave={() => setHover(null)}
        />
        {tip && hover !== null && (
          <div
            className="chart-tip"
            role="tooltip"
            style={{ left: clamp(((hover + 0.5) / columns.length) * width, 96, width - 96), top: -8 }}
          >
            <strong>
              {tip.loan.id} · {tip.loan.member}
            </strong>
            <span>{tip.dpd === 0 ? 'Current' : `${tip.dpd} days overdue`}</span>
          </div>
        )}
      </div>
      <ul className="legend legend-row">
        {BUCKETS.map((b, i) => (
          <li key={b.key}>
            <span className="swatch" style={{ background: `var(--age-${i})` }} />
            <span>{b.label}</span>
            <strong>{counts[i]}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}
