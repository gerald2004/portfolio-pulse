import { useMemo, useState } from 'react';
import { AgingBarChart } from './components/AgingBarChart';
import { LoanStrip } from './components/LoanStrip';
import { LoanTable } from './components/LoanTable';
import { ParDonut } from './components/ParDonut';
import { RepaymentsLine } from './components/RepaymentsLine';
import { StatTiles } from './components/StatTiles';
import { generateLoans } from './data/generateLoans';
import { generateMonthlyRepayments } from './data/generateMonthlyRepayments';
import { portfolioAtRisk, summarizeBuckets } from './domain/metrics';
import type { BucketKey } from './domain/types';

/** A fixed as-of date keeps the numbers (and screenshot tests) stable. */
const AS_OF = '2026-11-13';

export default function App() {
  const loans = useMemo(() => generateLoans({ count: 500, seed: 42, asOf: AS_OF }), []);
  const par = useMemo(() => portfolioAtRisk(loans, AS_OF), [loans]);
  const buckets = useMemo(() => summarizeBuckets(loans, AS_OF), [loans]);
  const repayments = useMemo(() => generateMonthlyRepayments({ months: 12, seed: 42, asOf: AS_OF }), []);

  /** The aging bucket picked on the bar chart. The loan table filters to it. */
  const [bucket, setBucket] = useState<BucketKey | null>(null);

  return (
    <main className="page">
      <header className="page-head">
        <h1>Portfolio Pulse</h1>
        <p>Loan portfolio health as of {AS_OF}. Synthetic data.</p>
      </header>

      <StatTiles par={par} loanCount={loans.length} />

      <div className="grid">
        <AgingBarChart rows={buckets} selected={bucket} onSelect={setBucket} />
        <ParDonut par={par} />
      </div>
      <RepaymentsLine data={repayments} />
      <LoanStrip loans={loans} asOf={AS_OF} />

      <LoanTable loans={loans} asOf={AS_OF} bucket={bucket} onClearBucket={() => setBucket(null)} />
    </main>
  );
}
