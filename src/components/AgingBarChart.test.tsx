import { fireEvent, render, screen } from '@testing-library/react';
import type { BucketSummary } from '../domain/types';
import { AgingBarChart, BAR_CHART_HEIGHT, BAR_CHART_MARGIN } from './AgingBarChart';

const rows: BucketSummary[] = [
  { key: 'current', label: 'Current', loans: 10, outstandingPrincipal: 200_000_000 },
  { key: '1-30', label: '1–30 days', loans: 4, outstandingPrincipal: 100_000_000 },
  { key: '31-60', label: '31–60 days', loans: 3, outstandingPrincipal: 50_000_000 },
  { key: '61-90', label: '61–90 days', loans: 0, outstandingPrincipal: 0 },
  { key: '91-180', label: '91–180 days', loans: 2, outstandingPrincipal: 20_000_000 },
  { key: '180+', label: '180+ days', loans: 1, outstandingPrincipal: 10_000_000 },
];

const setup = (selected: BucketSummary['key'] | null = null) => {
  const onSelect = vi.fn();
  const view = render(<AgingBarChart rows={rows} selected={selected} onSelect={onSelect} />);
  const rects = Array.from(view.container.querySelectorAll('rect'));
  return { ...view, onSelect, rects };
};

describe('AgingBarChart', () => {
  it('draws exactly one rect per bucket, in bucket order, even for empty buckets', () => {
    const { rects } = setup();
    expect(rects).toHaveLength(6);
    expect(rects.map((r) => r.getAttribute('data-bucket'))).toEqual(rows.map((r) => r.key));
  });

  it('makes bar heights proportional, with the tallest filling the plot area', () => {
    const { rects } = setup();
    const heights = rects.map((r) => Number(r.getAttribute('height')));
    const plotHeight = BAR_CHART_HEIGHT - BAR_CHART_MARGIN.top - BAR_CHART_MARGIN.bottom;
    expect(heights[0]).toBeCloseTo(plotHeight);
    expect(heights[1]).toBeCloseTo(plotHeight / 2);
    expect(heights[2]).toBeCloseTo(plotHeight / 4);
    expect(heights[3]).toBe(0);
    // The tallest bar starts at the top of the plot area.
    expect(Number(rects[0]!.getAttribute('y'))).toBeCloseTo(BAR_CHART_MARGIN.top);
  });

  it('labels the y axis with nice tick values', () => {
    setup();
    for (const label of ['0', '50M', '100M', '150M', '200M']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('shows a tooltip with bucket, loan count and amount on hover and on focus', () => {
    const { rects } = setup();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    fireEvent.mouseEnter(rects[1]!);
    expect(screen.getByRole('tooltip')).toHaveTextContent('1–30 days');
    expect(screen.getByRole('tooltip')).toHaveTextContent('4 loans · UGX 100,000,000');
    fireEvent.mouseLeave(rects[1]!);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    fireEvent.focus(rects[4]!);
    expect(screen.getByRole('tooltip')).toHaveTextContent('91–180 days');
  });

  it('calls onSelect with the bucket key when a bar is clicked', () => {
    const { rects, onSelect } = setup();
    fireEvent.click(rects[2]!);
    expect(onSelect).toHaveBeenCalledWith('31-60');
  });

  it('clears the selection when the selected bar is clicked again', () => {
    const { rects, onSelect } = setup('31-60');
    expect(rects[2]).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(rects[2]!);
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('works from the keyboard', () => {
    const { rects, onSelect } = setup();
    expect(rects[0]).toHaveAttribute('tabindex', '0');
    fireEvent.keyDown(rects[5]!, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith('180+');
    fireEvent.keyDown(rects[1]!, { key: ' ' });
    expect(onSelect).toHaveBeenCalledWith('1-30');
  });
});
