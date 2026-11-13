import { parseDay } from '../domain/dates';
import type { MonthlyRepayment } from '../domain/types';
import { createRandom } from './random';

export interface MonthlyRepaymentOptions {
  /** How many months to produce, ending with the month of `asOf`. */
  months: number;
  seed: number;
  asOf: string;
}

/**
 * Synthetic monthly repayment totals, oldest month first. Collections grow slowly
 * over time with some month-to-month variation. Same seed, same numbers.
 */
export function generateMonthlyRepayments({ months, seed, asOf }: MonthlyRepaymentOptions): MonthlyRepayment[] {
  const rnd = createRandom(seed);
  const end = new Date(parseDay(asOf));
  const out: MonthlyRepayment[] = [];
  for (let i = 0; i < months; i++) {
    const monthsBack = months - 1 - i;
    // Date.UTC rolls a negative month index back into earlier years for us.
    const first = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - monthsBack, 1));
    const trend = 120_000_000 + i * 3_000_000;
    const variation = rnd.int(-200, 200) * 100_000;
    out.push({ month: first.toISOString().slice(0, 7), amount: trend + variation });
  }
  return out;
}
