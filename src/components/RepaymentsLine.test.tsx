import { fireEvent, render, screen } from '@testing-library/react';
import type { MonthlyRepayment } from '../domain/types';
import { RepaymentsLine } from './RepaymentsLine';

const data: MonthlyRepayment[] = [
  { month: '2026-01', amount: 100_000_000 },
  { month: '2026-02', amount: 120_000_000 },
  { month: '2026-03', amount: 90_000_000 },
  { month: '2026-04', amount: 150_000_000 },
  { month: '2026-05', amount: 130_000_000 },
];

function setup(rows: MonthlyRepayment[] = data) {
  const view = render(<RepaymentsLine data={rows} />);
  const svg = view.container.querySelector('svg')!;
  // jsdom has no layout, so say where the chart sits on screen: 600px wide from x = 0.
  svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 600, height: 240 }) as DOMRect;
  const live = view.container.querySelector('[aria-live="polite"]')!;
  return { ...view, svg, live };
}

describe('RepaymentsLine', () => {
  it('draws one point per month and a single line through them', () => {
    const { container } = setup();
    expect(container.querySelectorAll('circle')).toHaveLength(5);
    const d = container.querySelector('path.line')!.getAttribute('d')!;
    expect(d.startsWith('M ')).toBe(true);
    expect(d.match(/L /g)).toHaveLength(4);
  });

  it('puts the highest month at the top of the plot and lower months below it', () => {
    const { container } = setup();
    const ys = Array.from(container.querySelectorAll('circle')).map((c) => Number(c.getAttribute('cy')));
    expect(ys[3]).toBeCloseTo(16); // April is the maximum; 16 is the top margin
    expect(ys[2]).toBeGreaterThan(ys[0]!); // March is lower than January (y grows downward)
  });

  it('shows a crosshair and tooltip for the month nearest the mouse', () => {
    const { container, svg } = setup();
    expect(container.querySelector('.crosshair')).toBeNull();

    // Plot runs from x = 52 to x = 584, so the 5 points sit 133px apart. x = 190 is nearest February.
    fireEvent.mouseMove(svg, { clientX: 190 });
    expect(container.querySelector('.crosshair')).not.toBeNull();
    expect(screen.getByRole('tooltip')).toHaveTextContent('February 2026');
    expect(screen.getByRole('tooltip')).toHaveTextContent('UGX 120,000,000');

    fireEvent.mouseMove(svg, { clientX: 5000 });
    expect(screen.getByRole('tooltip')).toHaveTextContent('May 2026');

    fireEvent.mouseLeave(svg);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('moves between months with the arrow keys, and the tooltip follows', () => {
    const { svg } = setup();
    expect(svg).toHaveAttribute('tabindex', '0');

    fireEvent.focus(svg);
    expect(screen.getByRole('tooltip')).toHaveTextContent('May 2026');

    fireEvent.keyDown(svg, { key: 'ArrowLeft' });
    expect(screen.getByRole('tooltip')).toHaveTextContent('April 2026');
    fireEvent.keyDown(svg, { key: 'ArrowRight' });
    fireEvent.keyDown(svg, { key: 'ArrowRight' });
    expect(screen.getByRole('tooltip')).toHaveTextContent('May 2026'); // stops at the last month

    fireEvent.keyDown(svg, { key: 'Home' });
    expect(screen.getByRole('tooltip')).toHaveTextContent('January 2026');
    fireEvent.keyDown(svg, { key: 'ArrowLeft' });
    expect(screen.getByRole('tooltip')).toHaveTextContent('January 2026'); // stops at the first month
    fireEvent.keyDown(svg, { key: 'End' });
    expect(screen.getByRole('tooltip')).toHaveTextContent('May 2026');
  });

  it('announces the selected month to screen readers', () => {
    const { svg, live } = setup();
    expect(live).toHaveTextContent('');
    fireEvent.focus(svg);
    fireEvent.keyDown(svg, { key: 'Home' });
    expect(live).toHaveTextContent('January 2026: UGX 100,000,000');
    fireEvent.blur(svg);
    expect(live).toHaveTextContent('');
  });

  it('keeps the keyboard selection when the mouse leaves a focused chart', () => {
    const { svg } = setup();
    fireEvent.focus(svg);
    fireEvent.mouseLeave(svg);
    expect(screen.getByRole('tooltip')).toHaveTextContent('May 2026');
  });

  it('renders an empty chart without errors', () => {
    const { container, svg } = setup([]);
    expect(container.querySelectorAll('circle')).toHaveLength(0);
    fireEvent.focus(svg);
    fireEvent.keyDown(svg, { key: 'ArrowRight' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
