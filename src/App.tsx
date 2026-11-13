import { useMemo } from 'react';
import { ChartPlaceholder } from './components/ChartPlaceholder';
import { LoanTable } from './components/LoanTable';
import { StatTiles } from './components/StatTiles';
import { generateLoans } from './data/generateLoans';
import { portfolioAtRisk } from './domain/metrics';

/** A fixed as-of date keeps the numbers (and screenshot tests) stable. */
const AS_OF = '2026-11-13';

export default function App() {
  const loans = useMemo(() => generateLoans({ count: 500, seed: 42, asOf: AS_OF }), []);
  const par = useMemo(() => portfolioAtRisk(loans, AS_OF), [loans]);

  return (
    <main className="page">
      <header className="page-head">
        <h1>Portfolio Pulse</h1>
        <p>Loan portfolio health as of {AS_OF}. Synthetic data.</p>
      </header>

      <StatTiles par={par} loanCount={loans.length} />

      <div className="grid">
        <ChartPlaceholder
          title="Aging buckets"
          todo="SVG bar chart of outstanding principal per bucket (use summarizeBuckets)"
        />
        <ChartPlaceholder title="Portfolio at risk" todo="SVG donut for PAR 1 / 30 / 90" />
      </div>
      <ChartPlaceholder title="Repayments over time" todo="SVG line chart with crosshair and keyboard navigation" />
      <ChartPlaceholder
        title="Every loan at a glance"
        todo="Canvas strip, one column per loan, coloured by days overdue"
      />

      <LoanTable loans={loans} asOf={AS_OF} />
    </main>
  );
}
