import type { ParSummary } from '../domain/types';
import { money, percent } from '../format';

export function StatTiles({ par, loanCount }: { par: ParSummary; loanCount: number }) {
  const tiles = [
    { label: 'Outstanding principal', value: money(par.portfolioOutstanding), hint: `${loanCount} loans` },
    { label: 'PAR 1', value: percent(par.par1), hint: '≥ 1 day overdue' },
    { label: 'PAR 30', value: percent(par.par30), hint: '≥ 30 days overdue' },
    { label: 'PAR 90', value: percent(par.par90), hint: '≥ 90 days overdue' },
  ];
  return (
    <section className="tiles" aria-label="Portfolio summary">
      {tiles.map((t) => (
        <div className="tile" key={t.label}>
          <div className="tile-label">{t.label}</div>
          <div className="tile-value">{t.value}</div>
          <div className="tile-hint">{t.hint}</div>
        </div>
      ))}
    </section>
  );
}
