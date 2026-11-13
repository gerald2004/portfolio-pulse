import { clamp, linearScale, niceTicks } from './scale';

describe('linearScale', () => {
  it('maps the domain onto the range proportionally', () => {
    const scale = linearScale(200_000_000, 240);
    expect(scale(0)).toBe(0);
    expect(scale(100_000_000)).toBe(120);
    expect(scale(200_000_000)).toBe(240);
  });
  it('maps everything to 0 when there is no data', () => {
    expect(linearScale(0, 240)(50)).toBe(0);
  });
});

describe('niceTicks', () => {
  it('uses round steps and never passes the maximum', () => {
    expect(niceTicks(230_000_000)).toEqual([0, 50_000_000, 100_000_000, 150_000_000, 200_000_000]);
    expect(niceTicks(9)).toEqual([0, 2, 4, 6, 8]);
  });
  it('includes a tick that lands exactly on the maximum', () => {
    expect(niceTicks(100)).toEqual([0, 20, 40, 60, 80, 100]);
  });
  it('returns a single 0 tick for an empty chart', () => {
    expect(niceTicks(0)).toEqual([0]);
  });
});

describe('clamp', () => {
  it('keeps values inside the limits', () => {
    expect(clamp(5, 10, 20)).toBe(10);
    expect(clamp(25, 10, 20)).toBe(20);
    expect(clamp(15, 10, 20)).toBe(15);
  });
  it('centres when the space is narrower than the limits allow', () => {
    expect(clamp(5, 100, 60)).toBe(80);
  });
});
