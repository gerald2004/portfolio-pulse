import { daysBetween } from './dates';
import type { BucketKey, BucketSummary, Loan, ParSummary } from './types';

/**
 * Days past due as of `asOf`. An instalment is overdue only when its due date is
 * strictly before the as-of date: something due today is not yet late.
 */
export function daysOverdue(loan: Loan, asOf: string): number {
  if (!loan.oldestUnpaidDueOn) return 0;
  return Math.max(0, daysBetween(loan.oldestUnpaidDueOn, asOf));
}

export const BUCKETS: ReadonlyArray<{ key: BucketKey; label: string; min: number; max: number }> = [
  { key: 'current', label: 'Current', min: 0, max: 0 },
  { key: '1-30', label: '1–30 days', min: 1, max: 30 },
  { key: '31-60', label: '31–60 days', min: 31, max: 60 },
  { key: '61-90', label: '61–90 days', min: 61, max: 90 },
  { key: '91-180', label: '91–180 days', min: 91, max: 180 },
  { key: '180+', label: '180+ days', min: 181, max: Number.POSITIVE_INFINITY },
];

export function bucketOf(dpd: number): BucketKey {
  if (!Number.isInteger(dpd) || dpd < 0) throw new Error(`Invalid days overdue: ${dpd}`);
  const b = BUCKETS.find((x) => dpd >= x.min && dpd <= x.max);
  // Unreachable: the buckets cover every non-negative integer.
  if (!b) throw new Error(`No bucket for ${dpd}`);
  return b.key;
}

/** Every bucket appears, in order, even when it has no loans. */
export function summarizeBuckets(loans: readonly Loan[], asOf: string): BucketSummary[] {
  const out = BUCKETS.map((b) => ({ key: b.key, label: b.label, loans: 0, outstandingPrincipal: 0 }));
  for (const loan of loans) {
    const key = bucketOf(daysOverdue(loan, asOf));
    const row = out.find((r) => r.key === key)!;
    row.loans += 1;
    row.outstandingPrincipal += loan.outstandingPrincipal;
  }
  return out;
}

/**
 * Portfolio at risk: the share of outstanding principal on loans at least N days
 * overdue. Uses the whole outstanding balance of each such loan, not only the
 * overdue instalments, which is the standard PAR definition. 0 for an empty portfolio.
 */
export function portfolioAtRisk(loans: readonly Loan[], asOf: string): ParSummary {
  let total = 0;
  let at1 = 0;
  let at30 = 0;
  let at90 = 0;
  for (const loan of loans) {
    const dpd = daysOverdue(loan, asOf);
    total += loan.outstandingPrincipal;
    if (dpd >= 1) at1 += loan.outstandingPrincipal;
    if (dpd >= 30) at30 += loan.outstandingPrincipal;
    if (dpd >= 90) at90 += loan.outstandingPrincipal;
  }
  const ratio = (x: number) => (total === 0 ? 0 : x / total);
  return { portfolioOutstanding: total, par1: ratio(at1), par30: ratio(at30), par90: ratio(at90) };
}
