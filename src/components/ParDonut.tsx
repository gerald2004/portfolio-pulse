import { arcPath, sweepAngle } from '../charts/arc';
import type { ParSummary } from '../domain/types';
import { percent } from '../format';

const SIZE = 220;
const CENTRE = SIZE / 2;
const STROKE = 14;

/** Three rings, widest measure on the outside. PAR 1 always contains PAR 30, which contains PAR 90. */
const RINGS = [
  { key: 'par1', label: 'PAR 1', hint: '≥ 1 day', radius: 96, colour: 'var(--age-2)' },
  { key: 'par30', label: 'PAR 30', hint: '≥ 30 days', radius: 76, colour: 'var(--age-3)' },
  { key: 'par90', label: 'PAR 90', hint: '≥ 90 days', radius: 56, colour: 'var(--age-5)' },
] as const;

export function ParDonut({ par }: { par: ParSummary }) {
  const summary = RINGS.map((r) => `${r.label} ${percent(par[r.key])}`).join(', ');

  return (
    <section className="card">
      <h2>Portfolio at risk</h2>
      <div className="donut">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={`Portfolio at risk: ${summary}`}>
          {RINGS.map((ring) => {
            const angle = sweepAngle(par[ring.key]);
            const shared = {
              fill: 'none',
              strokeWidth: STROKE,
              style: { stroke: ring.colour },
              'data-ring': ring.key,
              'data-angle': angle,
            };
            return (
              <g key={ring.key}>
                {/* The grey track shows what 100% would look like. */}
                <circle className="donut-track" cx={CENTRE} cy={CENTRE} r={ring.radius} fill="none" strokeWidth={STROKE} />
                {angle >= 360 ? (
                  // A full turn starts and ends at the same point, so an arc would draw nothing.
                  <circle cx={CENTRE} cy={CENTRE} r={ring.radius} {...shared} />
                ) : angle > 0 ? (
                  <path d={arcPath(CENTRE, CENTRE, ring.radius, 0, angle)} {...shared} />
                ) : null}
              </g>
            );
          })}
          <text className="donut-value" x={CENTRE} y={CENTRE - 2} textAnchor="middle" dominantBaseline="middle">
            {percent(par.par30)}
          </text>
          <text className="axis-label" x={CENTRE} y={CENTRE + 20} textAnchor="middle" dominantBaseline="middle">
            PAR 30
          </text>
        </svg>

        <ul className="legend">
          {RINGS.map((ring) => (
            <li key={ring.key}>
              <span className="swatch" style={{ background: ring.colour }} />
              <span>
                {ring.label} <small>{ring.hint} overdue</small>
              </span>
              <strong>{percent(par[ring.key])}</strong>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
