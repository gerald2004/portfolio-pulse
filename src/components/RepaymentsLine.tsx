import { useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { clamp, linearScale, niceTicks } from '../charts/scale';
import { useElementWidth } from '../charts/useElementWidth';
import type { MonthlyRepayment } from '../domain/types';
import { compactMoney, money, monthAbbr, monthName } from '../format';

const HEIGHT = 240;
const MARGIN = { top: 16, right: 16, bottom: 32, left: 52 };

export function RepaymentsLine({ data }: { data: readonly MonthlyRepayment[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const width = useElementWidth(wrapRef);
  /** Index of the month under the crosshair, or null when there isn't one. */
  const [active, setActive] = useState<number | null>(null);
  const [focused, setFocused] = useState(false);

  const m = MARGIN;
  const plotWidth = Math.max(0, width - m.left - m.right);
  const plotHeight = HEIGHT - m.top - m.bottom;
  const plotBottom = m.top + plotHeight;
  const last = data.length - 1;

  // Two scales: months spread evenly along x, amounts measured up y.
  const step = last > 0 ? plotWidth / last : 0;
  const xAt = (i: number) => (last > 0 ? m.left + i * step : m.left + plotWidth / 2);
  const max = Math.max(0, ...data.map((d) => d.amount));
  const toHeight = linearScale(max, plotHeight);
  const yAt = (amount: number) => plotBottom - toHeight(amount);

  const points = data.map((d, i) => ({ ...d, index: i, x: xAt(i), y: yAt(d.amount) }));
  // "M x y" moves the pen to the first point; each "L x y" draws a line to the next.
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');

  const ticks = niceTicks(max);
  // Skip month labels when they would overlap on a narrow screen.
  const labelEvery = Math.max(1, Math.ceil((data.length * 34) / Math.max(1, plotWidth)));

  const onMouseMove = (e: MouseEvent<SVGSVGElement>) => {
    if (data.length === 0) return;
    const box = e.currentTarget.getBoundingClientRect();
    if (box.width === 0) return;
    // Mouse position in screen pixels -> position in the drawing -> nearest month.
    const x = ((e.clientX - box.left) / box.width) * width;
    setActive(step > 0 ? clamp(Math.round((x - m.left) / step), 0, last) : 0);
  };

  const onKeyDown = (e: KeyboardEvent<SVGSVGElement>) => {
    if (data.length === 0) return;
    const current = active ?? last;
    const next =
      e.key === 'ArrowLeft' ? current - 1
      : e.key === 'ArrowRight' ? current + 1
      : e.key === 'Home' ? 0
      : e.key === 'End' ? last
      : null;
    if (next === null) return;
    e.preventDefault();
    setActive(clamp(next, 0, last));
  };

  const tip = active === null ? undefined : points[active];
  const firstMonth = data[0];
  const lastMonth = data[last];
  const range = firstMonth && lastMonth ? `, ${monthName(firstMonth.month)} to ${monthName(lastMonth.month)}` : '';

  return (
    <section className="card">
      <h2>Repayments over time</h2>
      <div className="chart" ref={wrapRef}>
        <svg
          className="line-chart"
          viewBox={`0 0 ${width} ${HEIGHT}`}
          width="100%"
          role="group"
          tabIndex={0}
          aria-label={`Repayments per month${range}. Use the left and right arrow keys to read each month.`}
          onMouseMove={onMouseMove}
          onMouseLeave={() => {
            if (!focused) setActive(null);
          }}
          onKeyDown={onKeyDown}
          onFocus={() => {
            setFocused(true);
            if (data.length > 0) setActive((a) => a ?? last);
          }}
          onBlur={() => {
            setFocused(false);
            setActive(null);
          }}
        >
          {ticks.map((t) => {
            const y = yAt(t);
            return (
              <g key={t}>
                <line className="gridline" x1={m.left} x2={width - m.right} y1={y} y2={y} />
                <text className="axis-label" x={m.left - 8} y={y} textAnchor="end" dominantBaseline="middle">
                  {compactMoney(t)}
                </text>
              </g>
            );
          })}

          {points.map((p) =>
            p.index % labelEvery === 0 ? (
              <text key={p.month} className="axis-label" x={p.x} y={plotBottom + 18} textAnchor="middle">
                {monthAbbr(p.month)}
              </text>
            ) : null,
          )}

          {tip && <line className="crosshair" x1={tip.x} x2={tip.x} y1={m.top} y2={plotBottom} />}

          <path className="line" d={linePath} fill="none" />

          {points.map((p) => (
            <circle
              key={p.month}
              className={p.index === active ? 'point point-active' : 'point'}
              data-month={p.month}
              cx={p.x}
              cy={p.y}
              r={p.index === active ? 5 : 3}
            />
          ))}
        </svg>

        {tip && (
          <div className="chart-tip" role="tooltip" style={{ left: clamp(tip.x, 96, width - 96), top: tip.y - 10 }}>
            <strong>{monthName(tip.month)}</strong>
            <span>{money(tip.amount)}</span>
          </div>
        )}
      </div>
      {/* Read out by screen readers each time the selected month changes. */}
      <p className="sr-only" aria-live="polite">
        {tip ? `${monthName(tip.month)}: ${money(tip.amount)}` : ''}
      </p>
    </section>
  );
}
