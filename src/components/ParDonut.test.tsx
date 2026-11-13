import { render, screen } from '@testing-library/react';
import type { ParSummary } from '../domain/types';
import { ParDonut } from './ParDonut';

const make = (par1: number, par30: number, par90: number): ParSummary => ({
  portfolioOutstanding: 1_000_000,
  par1,
  par30,
  par90,
});

const ring = (container: HTMLElement, key: string) => container.querySelector(`[data-ring="${key}"]`);

/** Work the drawn angle back out of the path: clockwise degrees from 12 o'clock to the arc's end point. */
function drawnAngle(path: Element, centre = 110): number {
  const nums = path.getAttribute('d')!.match(/-?\d+(\.\d+)?/g)!.map(Number);
  const x = nums[nums.length - 2]!;
  const y = nums[nums.length - 1]!;
  const degrees = (Math.atan2(y - centre, x - centre) * 180) / Math.PI + 90;
  return (degrees + 360) % 360;
}

describe('ParDonut', () => {
  it('draws each arc at the angle of its PAR value, to within 0.5°', () => {
    const par = make(0.3127, 0.1842, 0.0719);
    const { container } = render(<ParDonut par={par} />);
    for (const key of ['par1', 'par30', 'par90'] as const) {
      const path = ring(container, key)!;
      expect(path.tagName.toLowerCase()).toBe('path');
      expect(Math.abs(drawnAngle(path) - par[key] * 360)).toBeLessThan(0.5);
    }
  });

  it('takes the long way round for a segment over half the ring', () => {
    const { container } = render(<ParDonut par={make(0.75, 0.2, 0.1)} />);
    const path = ring(container, 'par1')!;
    expect(path.getAttribute('d')).toContain(' 0 1 1 ');
    expect(Math.abs(drawnAngle(path) - 270)).toBeLessThan(0.5);
  });

  it('draws nothing for a 0% segment', () => {
    const { container } = render(<ParDonut par={make(0.2, 0.1, 0)} />);
    expect(ring(container, 'par1')).not.toBeNull();
    expect(ring(container, 'par90')).toBeNull();
  });

  it('draws a full ring, not an empty one, for a 100% segment', () => {
    const { container } = render(<ParDonut par={make(1, 0.4, 0.1)} />);
    const full = ring(container, 'par1')!;
    expect(full.tagName.toLowerCase()).toBe('circle');
    expect(full).toHaveAttribute('data-angle', '360');
  });

  it('shows PAR 30 in the centre and all three values in the legend', () => {
    const { container } = render(<ParDonut par={make(0.3127, 0.1842, 0.0719)} />);
    expect(container.querySelector('.donut-value')).toHaveTextContent('18.4%');
    expect(screen.getByRole('img')).toHaveAttribute(
      'aria-label',
      'Portfolio at risk: PAR 1 31.3%, PAR 30 18.4%, PAR 90 7.2%',
    );
    expect(screen.getByText('31.3%')).toBeInTheDocument();
    expect(screen.getByText('7.2%')).toBeInTheDocument();
  });

  it('handles an empty portfolio', () => {
    const { container } = render(<ParDonut par={make(0, 0, 0)} />);
    expect(container.querySelectorAll('[data-ring]')).toHaveLength(0);
    expect(container.querySelector('.donut-value')).toHaveTextContent('0.0%');
  });
});
