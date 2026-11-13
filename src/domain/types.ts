/** A loan as the dashboard sees it. All dates are ISO calendar dates (YYYY-MM-DD). */
export interface Loan {
  id: string;
  member: string;
  branch: string;
  disbursedOn: string;
  principal: number;
  /** Principal still owed, overdue or not. */
  outstandingPrincipal: number;
  /** Instalment amounts that fell due before the as-of date and are unpaid. */
  overdueAmount: number;
  /** Due date of the oldest unpaid instalment, or null when nothing is unpaid. */
  oldestUnpaidDueOn: string | null;
}

export type BucketKey = 'current' | '1-30' | '31-60' | '61-90' | '91-180' | '180+';

export interface BucketSummary {
  key: BucketKey;
  label: string;
  loans: number;
  outstandingPrincipal: number;
}

export interface ParSummary {
  portfolioOutstanding: number;
  par1: number;
  par30: number;
  par90: number;
}
