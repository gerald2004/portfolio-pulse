const ugx = new Intl.NumberFormat('en-UG', { maximumFractionDigits: 0 });
export const money = (n: number) => `UGX ${ugx.format(n)}`;
export const percent = (r: number) => `${(r * 100).toFixed(1)}%`;
