import { useRef, useState } from 'react';
import { clamp, linearScale, niceTicks } from '../charts/scale';
import { useElementWidth } from '../charts/useElementWidth';
import type { BucketKey, BucketSummary } from '../domain/types';
import { compactMoney, money } from '../format';

interface Props {
  rows: BucketSummary[];
  selected: BucketKey | null;
  onSelect: (key: BucketKey | null) => void;
}

/** Drawing height and the space kept free around the plot for axis labels. */
export const BAR_CHART_HEIGHT = 260;
export const BAR_CHART_MARGIN = { top: 16, right: 12, bottom: 32, left: 52 };

/** 'Current' stays as it is; '31–60 days' becomes '31–60' so six labels fit on a phone. */
const shortLabel = (label: string) => label.replace(' days', '');

export function AgingBarChart({ rows, selected, onSelect }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const width = useElementWidth(wrapRef);
  const height = BAR_CHART_HEIGHT;
  const [active, setActive] = useState<BucketKey | null>(null);

  // 1. Margins: the plot is the area inside them.
  const m = BAR_CHART_MARGIN;
  const plotWidth = Math.max(0, width - m.left - m.right);
  const plotHeight = height - m.top - m.bottom;
  const plotBottom = m.top + plotHeight;

  // 2. Scale: the largest bucket fills the full plot height.
  const max = Math.max(0, ...rows.map((r) => r.outstandingPrincipal));
  const toHeight = linearScale(max, plotHeight);

  // 3. Bar positions: each bucket gets an equal band; the bar takes 70% of it.
  const band = rows.length > 0 ? plotWidth / rows.length : 0;
  const barWidth = band * 0.7;
  const bars = rows.map((row, i) => {
    const barHeight = toHeight(row.outstandingPrincipal);
    return {
      row,
      index: i,
      x: m.left + i * band + (band - barWidth) / 2,
      // SVG measures y from the top, so a bar starts at the bottom minus its height.
      y: plotBottom - barHeight,
      height: barHeight,
      centre: m.left + i * band + band / 2,
    };
  });

  // 4. Ticks for the y axis.
  const ticks = niceTicks(max);

  const toggle = (key: BucketKey) => onSelect(selected === key ? null : key);
  const tip = bars.find((b) => b.row.key === active);

  return (
    <section className="card">
      <h2>Aging buckets</h2>
      <div className="chart" ref={wrapRef}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          role="group"
          aria-label="Outstanding principal by aging bucket. Select a bar to filter the loan table."
        >
          {ticks.map((t) => {
            const y = plotBottom - toHeight(t);
            return (
              <g key={t}>
                <line className="gridline" x1={m.left} x2={width - m.right} y1={y} y2={y} />
                <text className="axis-label" x={m.left - 8} y={y} textAnchor="end" dominantBaseline="middle">
                  {compactMoney(t)}
                </text>
              </g>
            );
          })}

          {bars.map((b) => (
            <rect
              key={b.row.key}
              className="bar"
              data-bucket={b.row.key}
              x={b.x}
              y={b.y}
              width={barWidth}
              height={b.height}
              rx={2}
              style={{
                fill: `var(--age-${b.index})`,
                opacity: selected && selected !== b.row.key ? 0.35 : 1,
              }}
              role="button"
              tabIndex={0}
              aria-pressed={selected === b.row.key}
              aria-label={`${b.row.label}: ${b.row.loans} loans, ${money(b.row.outstandingPrincipal)}`}
              onClick={() => toggle(b.row.key)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggle(b.row.key);
                }
              }}
              onMouseEnter={() => setActive(b.row.key)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(b.row.key)}
              onBlur={() => setActive(null)}
            />
          ))}

          {bars.map((b) => (
            <text
              key={b.row.key}
              // On a phone the bands are narrow, so the bucket labels step down a size to stay apart.
              className={band < 46 ? 'axis-label axis-label-small' : 'axis-label'}
              x={b.centre}
              y={plotBottom + 18}
              textAnchor="middle"
            >
              {shortLabel(b.row.label)}
            </text>
          ))}
        </svg>

        {tip && (
          <div
            className="chart-tip"
            role="tooltip"
            style={{ left: clamp(tip.centre, 96, width - 96), top: tip.y - 8 }}
          >
            <strong>{tip.row.label}</strong>
            <span>
              {tip.row.loans} loans · {money(tip.row.outstandingPrincipal)}
            </span>
          </div>
        )}
      </div>
      <p className="chart-note">
        {selected
          ? `Table filtered to ${rows.find((r) => r.key === selected)?.label ?? selected}. Select the bar again to clear.`
          : 'Select a bar to filter the loan table.'}
      </p>
    </section>
  );
}
