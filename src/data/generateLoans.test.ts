import { daysOverdue } from '../domain/metrics';
import { generateLoans } from './generateLoans';

const opts = { count: 500, seed: 42, asOf: '2026-11-13' };

describe('generateLoans', () => {
  it('is deterministic for the same seed', () => {
    expect(generateLoans(opts)).toEqual(generateLoans(opts));
  });
  it('changes with the seed', () => {
    expect(generateLoans({ ...opts, seed: 7 })).not.toEqual(generateLoans(opts));
  });
  it('produces consistent loans', () => {
    const loans = generateLoans(opts);
    expect(loans).toHaveLength(500);
    expect(new Set(loans.map((l) => l.id)).size).toBe(500);
    for (const l of loans) {
      expect(l.outstandingPrincipal).toBeGreaterThanOrEqual(0);
      expect(l.outstandingPrincipal).toBeLessThanOrEqual(l.principal);
      expect(l.overdueAmount).toBeLessThanOrEqual(l.outstandingPrincipal);
      // A loan with nothing outstanding can't be late.
      if (l.outstandingPrincipal === 0) expect(daysOverdue(l, opts.asOf)).toBe(0);
    }
  });
  it('includes loans in every aging range', () => {
    const dpds = generateLoans(opts).map((l) => daysOverdue(l, opts.asOf));
    expect(dpds.some((d) => d === 0)).toBe(true);
    expect(dpds.some((d) => d >= 1 && d <= 30)).toBe(true);
    expect(dpds.some((d) => d >= 31 && d <= 90)).toBe(true);
    expect(dpds.some((d) => d > 180)).toBe(true);
  });
});
