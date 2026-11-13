/**
 * Arc maths for the donut. Angles are in degrees, measured clockwise from
 * 12 o'clock, because that is how people read a dial. (Maths functions measure
 * anticlockwise from 3 o'clock, which is why there is a "- 90" below.)
 */

const round = (n: number) => Math.round(n * 1000) / 1000;

/** The point at `angle` degrees on a circle of radius `r` centred on (cx, cy). */
export function pointOnCircle(cx: number, cy: number, r: number, angle: number): { x: number; y: number } {
  const radians = ((angle - 90) * Math.PI) / 180;
  return { x: round(cx + r * Math.cos(radians)), y: round(cy + r * Math.sin(radians)) };
}

/** A share between 0 and 1 as degrees of a full turn. Out-of-range values are capped. */
export function sweepAngle(share: number): number {
  if (!Number.isFinite(share)) return 0;
  return Math.min(1, Math.max(0, share)) * 360;
}

/**
 * The `d` attribute for an SVG <path> that draws an arc from startAngle to endAngle.
 *
 * "M x y" moves to the start. "A r r 0 large sweep x y" draws an arc to the end:
 * `large` picks the long way round when the arc is more than half a turn, and
 * sweep = 1 means clockwise.
 *
 * A full 360° arc can't be drawn this way, because the start and end are the same
 * point and SVG draws nothing. Use a <circle> for that (see ParDonut).
 */
export function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = pointOnCircle(cx, cy, r, startAngle);
  const end = pointOnCircle(cx, cy, r, endAngle);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`;
}
