import { fireEvent, render, screen, within } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  // jsdom can't paint a canvas; the loan strip has its own tests.
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
});
afterEach(() => vi.restoreAllMocks());

const bar = (container: HTMLElement, key: string) => container.querySelector(`rect[data-bucket="${key}"]`)!;

describe('App', () => {
  it('replaces every placeholder with a chart', () => {
    render(<App />);
    for (const title of ['Aging buckets', 'Portfolio at risk', 'Repayments over time', 'Every loan at a glance']) {
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    }
    expect(screen.queryByText(/TODO/)).not.toBeInTheDocument();
  });

  it('filters the loan table when a bar is clicked, and clears it when clicked again', () => {
    const { container } = render(<App />);
    expect(screen.getByText('500 of 500 loans')).toBeInTheDocument();

    const target = bar(container, '31-60');
    // The bar's label says how many loans the bucket holds, e.g. "31–60 days: 23 loans, UGX …".
    const count = Number(/: (\d+) loans/.exec(target.getAttribute('aria-label')!)![1]);
    expect(count).toBeGreaterThan(0);

    fireEvent.click(target);
    expect(screen.getByText(`${count} of 500 loans`)).toBeInTheDocument();
    const rows = within(screen.getAllByRole('rowgroup')[1]!).getAllByRole('row');
    expect(rows).toHaveLength(count);
    for (const row of rows) {
      const dpd = Number(within(row).getAllByRole('cell')[4]!.textContent);
      expect(dpd).toBeGreaterThanOrEqual(31);
      expect(dpd).toBeLessThanOrEqual(60);
    }

    fireEvent.click(target);
    expect(screen.getByText('500 of 500 loans')).toBeInTheDocument();
  });

  it('clears the bucket filter from the table as well', () => {
    const { container } = render(<App />);
    fireEvent.click(bar(container, '180+'));
    expect(screen.queryByText('500 of 500 loans')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Clear bucket filter/ }));
    expect(screen.getByText('500 of 500 loans')).toBeInTheDocument();
  });
});
