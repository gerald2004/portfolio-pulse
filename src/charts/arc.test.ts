import { arcPath, pointOnCircle, sweepAngle } from './arc';

describe('pointOnCircle', () => {
  it('starts at 12 o’clock and goes clockwise', () => {
    expect(pointOnCircle(100, 100, 50, 0)).toEqual({ x: 100, y: 50 });
    expect(pointOnCircle(100, 100, 50, 90)).toEqual({ x: 150, y: 100 });
    expect(pointOnCircle(100, 100, 50, 180)).toEqual({ x: 100, y: 150 });
    expect(pointOnCircle(100, 100, 50, 270)).toEqual({ x: 50, y: 100 });
  });
});

describe('sweepAngle', () => {
  it('turns a share into degrees', () => {
    expect(sweepAngle(0)).toBe(0);
    expect(sweepAngle(0.25)).toBe(90);
    expect(sweepAngle(1)).toBe(360);
  });
  it('caps values outside 0 to 1', () => {
    expect(sweepAngle(-0.2)).toBe(0);
    expect(sweepAngle(1.4)).toBe(360);
    expect(sweepAngle(Number.NaN)).toBe(0);
  });
});

describe('arcPath', () => {
  it('draws a quarter turn the short way round', () => {
    expect(arcPath(100, 100, 50, 0, 90)).toBe('M 100 50 A 50 50 0 0 1 150 100');
  });
  it('sets the large-arc flag past half a turn', () => {
    expect(arcPath(100, 100, 50, 0, 270)).toBe('M 100 50 A 50 50 0 1 1 50 100');
  });
});
