/**
 * A scale converts a data value (money, a count) into a size in pixels.
 *
 * linearScale(200, 100) returns a function where 0 -> 0, 100 -> 50 and 200 -> 100.
 * `domainMax` is the largest data value; `rangeSize` is how many pixels it should take.
 * An empty chart (domainMax of 0) maps everything to 0 rather than dividing by zero.
 */
export function linearScale(domainMax: number, rangeSize: number): (value: number) => number {
  if (domainMax <= 0) return () => 0;
  return (value) => (value / domainMax) * rangeSize;
}

/**
 * Round axis values that people can read at a glance: 0, 50M, 100M rather than
 * 0, 46.2M, 92.4M. Returns the ticks from 0 up to (and never beyond) `max`.
 *
 * The step is always 1, 2, 2.5 or 5 times a power of ten.
 */
export function niceTicks(max: number, targetCount = 5): number[] {
  if (max <= 0) return [0];
  const roughStep = max / targetCount;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalized = roughStep / magnitude; // between 1 and 10
  const factor = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10;
  const step = factor * magnitude;

  const ticks: number[] = [];
  // The tiny tolerance keeps a tick that lands exactly on `max` despite float rounding.
  for (let i = 0; i * step <= max * (1 + 1e-9); i++) ticks.push(i * step);
  return ticks;
}

/** Keep a value inside [min, max]. Used to stop tooltips running off the chart. */
export function clamp(value: number, min: number, max: number): number {
  if (max < min) return (min + max) / 2;
  return Math.min(max, Math.max(min, value));
}
