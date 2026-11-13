const ugx = new Intl.NumberFormat('en-UG', { maximumFractionDigits: 0 });
export const money = (n: number) => `UGX ${ugx.format(n)}`;
export const percent = (r: number) => `${(r * 100).toFixed(1)}%`;

/** Short axis labels: 0, 500K, 50M, 1.2B. At most one decimal, and no trailing ".0". */
export function compactMoney(n: number): string {
  const units: Array<[number, string]> = [
    [1e9, 'B'],
    [1e6, 'M'],
    [1e3, 'K'],
  ];
  for (const [size, suffix] of units) {
    if (Math.abs(n) >= size) return `${Number((n / size).toFixed(1))}${suffix}`;
  }
  return String(Math.round(n));
}

const monthLong = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const monthShort = new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'UTC' });
const monthDate = (month: string) => new Date(`${month}-01T00:00:00Z`);

/** '2026-03' -> 'March 2026' */
export const monthName = (month: string) => monthLong.format(monthDate(month));
/** '2026-03' -> 'Mar' */
export const monthAbbr = (month: string) => monthShort.format(monthDate(month));
