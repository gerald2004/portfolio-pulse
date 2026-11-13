import { useMemo, useState } from 'react';
import { daysOverdue } from '../domain/metrics';
import type { Loan } from '../domain/types';
import { money } from '../format';

type SortKey = 'member' | 'outstandingPrincipal' | 'overdueAmount' | 'dpd';

export function LoanTable({ loans, asOf }: { loans: readonly Loan[]; asOf: string }) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'dpd', dir: -1 });

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const withDpd = loans.map((l) => ({ ...l, dpd: daysOverdue(l, asOf) }));
    const filtered = q
      ? withDpd.filter((l) => l.member.toLowerCase().includes(q) || l.id.toLowerCase().includes(q))
      : withDpd;
    return [...filtered].sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number);
      return cmp * sort.dir || a.id.localeCompare(b.id);
    });
  }, [loans, asOf, query, sort]);

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
                  No loans match “{query}”.
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
