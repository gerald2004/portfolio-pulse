import { useMemo, useState } from 'react';
import { BUCKETS, bucketOf, daysOverdue } from '../domain/metrics';
import type { BucketKey, Loan } from '../domain/types';
import { money } from '../format';

type SortKey = 'member' | 'outstandingPrincipal' | 'overdueAmount' | 'dpd';

interface Props {
  loans: readonly Loan[];
  asOf: string;
  /** When set, only loans in this aging bucket are listed. */
  bucket?: BucketKey | null;
  /** Called when the user removes the bucket filter from the table. */
  onClearBucket?: () => void;
}

export function LoanTable({ loans, asOf, bucket = null, onClearBucket }: Props) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'dpd', dir: -1 });

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const withDpd = loans.map((l) => ({ ...l, dpd: daysOverdue(l, asOf) }));
    // The bucket filter (from the bar chart) applies first, then the search.
    const inBucket = bucket ? withDpd.filter((l) => bucketOf(l.dpd) === bucket) : withDpd;
    const filtered = q
      ? inBucket.filter((l) => l.member.toLowerCase().includes(q) || l.id.toLowerCase().includes(q))
      : inBucket;
    return [...filtered].sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number);
      return cmp * sort.dir || a.id.localeCompare(b.id);
    });
  }, [loans, asOf, bucket, query, sort]);

  const bucketLabel = bucket ? BUCKETS.find((b) => b.key === bucket)?.label : null;

  const header = (key: SortKey, label: string, numeric = false) => (
    <th
      scope="col"
      className={numeric ? 'num' : undefined}
      aria-sort={sort.key === key ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}
    >
      <button
        type="button"
        onClick={() => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : 1 }))}
      >
        {label}
        {sort.key === key ? (sort.dir === 1 ? ' ▲' : ' ▼') : ''}
      </button>
    </th>
  );

  return (
    <section className="card">
      <div className="table-head">
        <h2>Loans</h2>
        {bucketLabel && (
          <span className="filter-chip">
            Bucket: {bucketLabel}
            {onClearBucket && (
              <button type="button" onClick={onClearBucket} aria-label={`Clear bucket filter ${bucketLabel}`}>
                ×
              </button>
            )}
          </span>
        )}
        <input
          type="search"
          placeholder="Search member or loan ID"
          aria-label="Search loans"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Loan</th>
              {header('member', 'Member')}
              {header('outstandingPrincipal', 'Outstanding', true)}
              {header('overdueAmount', 'Overdue', true)}
              {header('dpd', 'Days overdue', true)}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty">
                  {query.trim() ? `No loans match “${query}”.` : 'No loans in this bucket.'}
                </td>
              </tr>
            ) : (
              rows.map((l) => (
                <tr key={l.id}>
                  <td>{l.id}</td>
                  <td>{l.member}</td>
                  <td className="num">{money(l.outstandingPrincipal)}</td>
                  <td className="num">{money(l.overdueAmount)}</td>
                  <td className="num">{l.dpd}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="table-foot">
        {rows.length} of {loans.length} loans
      </p>
    </section>
  );
}
