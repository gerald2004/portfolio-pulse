import { compactMoney, monthAbbr, monthName } from './format';

describe('compactMoney', () => {
  it('shortens thousands, millions and billions', () => {
    expect(compactMoney(0)).toBe('0');
    expect(compactMoney(500_000)).toBe('500K');
    expect(compactMoney(50_000_000)).toBe('50M');
    expect(compactMoney(2_500_000)).toBe('2.5M');
    expect(compactMoney(1_200_000_000)).toBe('1.2B');
  });
});

describe('month labels', () => {
  it('formats a YYYY-MM month', () => {
    expect(monthName('2026-03')).toBe('March 2026');
    expect(monthAbbr('2026-03')).toBe('Mar');
  });
});
