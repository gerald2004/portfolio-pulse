import { generateMonthlyRepayments } from './generateMonthlyRepayments';

const opts = { months: 12, seed: 42, asOf: '2026-11-13' };

describe('generateMonthlyRepayments', () => {
  it('is deterministic for the same seed', () => {
    expect(generateMonthlyRepayments(opts)).toEqual(generateMonthlyRepayments(opts));
  });
  it('changes with the seed', () => {
    expect(generateMonthlyRepayments({ ...opts, seed: 7 })).not.toEqual(generateMonthlyRepayments(opts));
  });
  it('returns one row per month, oldest first, ending with the as-of month', () => {
    const rows = generateMonthlyRepayments(opts);
    expect(rows.map((r) => r.month)).toEqual([
      '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05',
      '2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11',
    ]);
  });
  it('crosses a year boundary correctly', () => {
    const rows = generateMonthlyRepayments({ months: 3, seed: 1, asOf: '2026-01-31' });
    expect(rows.map((r) => r.month)).toEqual(['2025-11', '2025-12', '2026-01']);
  });
  it('produces positive whole amounts', () => {
    for (const r of generateMonthlyRepayments(opts)) {
      expect(r.amount).toBeGreaterThan(0);
      expect(Number.isInteger(r.amount)).toBe(true);
    }
  });
  it('returns nothing for zero months', () => {
    expect(generateMonthlyRepayments({ ...opts, months: 0 })).toEqual([]);
  });
});
