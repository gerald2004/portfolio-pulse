import { bucketOf, daysOverdue, portfolioAtRisk, summarizeBuckets } from './metrics';
import type { Loan } from './types';

const ASOF = '2026-11-13';

function loan(overrides: Partial<Loan>): Loan {
  return {
    id: 'LN0001', member: 'Test Member', branch: 'Central', disbursedOn: '2026-01-01',
    principal: 1_000_000, outstandingPrincipal: 1_000_000, overdueAmount: 0, oldestUnpaidDueOn: null,
    ...overrides,
  };
}

describe('daysOverdue', () => {
  it('is 0 when nothing is unpaid', () => {
    expect(daysOverdue(loan({}), ASOF)).toBe(0);
  });
  it('is 0 for an instalment due today (not late yet)', () => {
    expect(daysOverdue(loan({ oldestUnpaidDueOn: ASOF }), ASOF)).toBe(0);
  });
  it('is 1 for an instalment due yesterday', () => {
    expect(daysOverdue(loan({ oldestUnpaidDueOn: '2026-11-12' }), ASOF)).toBe(1);
  });
  it('is 0 for a future due date', () => {
    expect(daysOverdue(loan({ oldestUnpaidDueOn: '2026-12-01' }), ASOF)).toBe(0);
  });
  it('counts across a month boundary', () => {
    expect(daysOverdue(loan({ oldestUnpaidDueOn: '2026-10-14' }), ASOF)).toBe(30);
  });
});

describe('bucketOf', () => {
  it.each([
    [0, 'current'], [1, '1-30'], [30, '1-30'], [31, '31-60'], [60, '31-60'], [61, '61-90'],
    [90, '61-90'], [91, '91-180'], [180, '91-180'], [181, '180+'], [999, '180+'],
  ] as const)('%i days -> %s', (dpd, key) => {
    expect(bucketOf(dpd)).toBe(key);
  });
  it('rejects negative or fractional days', () => {
    expect(() => bucketOf(-1)).toThrow();
    expect(() => bucketOf(1.5)).toThrow();
  });
});

describe('summarizeBuckets', () => {
  it('returns every bucket in order, including empty ones', () => {
    const rows = summarizeBuckets([], ASOF);
    expect(rows.map((r) => r.key)).toEqual(['current', '1-30', '31-60', '61-90', '91-180', '180+']);
    expect(rows.every((r) => r.loans === 0 && r.outstandingPrincipal === 0)).toBe(true);
  });
  it('bucket totals add up to the portfolio', () => {
    const loans = [
      loan({ outstandingPrincipal: 100 }),
      loan({ outstandingPrincipal: 200, oldestUnpaidDueOn: '2026-11-03' }), // 10 days
      loan({ outstandingPrincipal: 300, oldestUnpaidDueOn: '2026-09-01' }), // 73 days
    ];
    const rows = summarizeBuckets(loans, ASOF);
    expect(rows.reduce((s, r) => s + r.outstandingPrincipal, 0)).toBe(600);
    expect(rows.reduce((s, r) => s + r.loans, 0)).toBe(3);
    expect(rows.find((r) => r.key === '61-90')!.outstandingPrincipal).toBe(300);
  });
});

describe('portfolioAtRisk', () => {
  it('is 0 for an empty portfolio (no divide by zero)', () => {
    expect(portfolioAtRisk([], ASOF)).toEqual({ portfolioOutstanding: 0, par1: 0, par30: 0, par90: 0 });
  });
  it('uses the whole outstanding balance of late loans', () => {
    const loans = [
      loan({ outstandingPrincipal: 600 }),
      loan({ outstandingPrincipal: 300, overdueAmount: 10, oldestUnpaidDueOn: '2026-11-08' }), // 5 days
      loan({ outstandingPrincipal: 100, overdueAmount: 10, oldestUnpaidDueOn: '2026-08-01' }), // 104 days
    ];
    const par = portfolioAtRisk(loans, ASOF);
    expect(par.portfolioOutstanding).toBe(1000);
    expect(par.par1).toBeCloseTo(0.4);
    expect(par.par30).toBeCloseTo(0.1);
    expect(par.par90).toBeCloseTo(0.1);
  });
  it('PAR30 counts a loan exactly 30 days late', () => {
    const par = portfolioAtRisk([loan({ oldestUnpaidDueOn: '2026-10-14' })], ASOF);
    expect(par.par30).toBe(1);
    expect(par.par90).toBe(0);
  });
});
