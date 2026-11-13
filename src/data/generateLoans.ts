import { addDays } from '../domain/dates';
import type { Loan } from '../domain/types';
import { createRandom } from './random';

// Synthetic data only. Names are random first/last pairs, not real people.
const FIRST = ['Amina', 'Brian', 'Clare', 'Daniel', 'Esther', 'Frank', 'Grace', 'Henry', 'Irene', 'James',
  'Joan', 'Kevin', 'Lydia', 'Moses', 'Naomi', 'Oscar', 'Patience', 'Ronald', 'Sarah', 'Tom'];
const LAST = ['Akello', 'Byaruhanga', 'Kato', 'Mugisha', 'Nakato', 'Namara', 'Okello', 'Ssali',
  'Tumusiime', 'Wanjiru', 'Atwine', 'Kyomugisha'];
const BRANCHES = ['Central', 'North', 'Lakeside', 'Hillside'];

export interface GenerateOptions {
  count: number;
  seed: number;
  asOf: string;
}

export function generateLoans({ count, seed, asOf }: GenerateOptions): Loan[] {
  const rnd = createRandom(seed);
  const loans: Loan[] = [];
  for (let i = 0; i < count; i++) {
    const principal = rnd.int(5, 200) * 50_000;
    const disbursedOn = addDays(asOf, -rnd.int(30, 720));
    const repaidShare = rnd.next();
    const outstandingPrincipal = Math.round((principal * (1 - repaidShare)) / 1000) * 1000;

    // Roughly 70% current, the rest spread across the aging buckets.
    const roll = rnd.next();
    let dpd = 0;
    if (roll > 0.7) dpd = rnd.int(1, 30);
    if (roll > 0.82) dpd = rnd.int(31, 90);
    if (roll > 0.92) dpd = rnd.int(91, 400);

    const late = dpd > 0 && outstandingPrincipal > 0;
    loans.push({
      id: `LN${String(i + 1).padStart(4, '0')}`,
      member: `${rnd.pick(FIRST)} ${rnd.pick(LAST)}`,
      branch: rnd.pick(BRANCHES),
      disbursedOn,
      principal,
      outstandingPrincipal,
      overdueAmount: late ? Math.min(outstandingPrincipal, Math.round((principal / 12) * Math.ceil(dpd / 30))) : 0,
      oldestUnpaidDueOn: late ? addDays(asOf, -dpd) : null,
    });
  }
  return loans;
}
