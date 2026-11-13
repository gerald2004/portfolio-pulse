import { fireEvent, render, screen, within } from '@testing-library/react';
import type { Loan } from '../domain/types';
import { LoanTable } from './LoanTable';

const ASOF = '2026-11-13';
const base = { branch: 'Central', disbursedOn: '2026-01-01', principal: 1_000_000, overdueAmount: 0 };
const loans: Loan[] = [
  { ...base, id: 'LN0001', member: 'Grace Akello', outstandingPrincipal: 500_000, oldestUnpaidDueOn: null },
  { ...base, id: 'LN0002', member: 'Brian Kato', outstandingPrincipal: 800_000, oldestUnpaidDueOn: '2026-10-01' },
  { ...base, id: 'LN0003', member: 'Amina Ssali', outstandingPrincipal: 200_000, oldestUnpaidDueOn: '2026-11-10' },
];

const bodyRows = () => within(screen.getAllByRole('rowgroup')[1]!).getAllByRole('row');

describe('LoanTable', () => {
  it('sorts by days overdue, most overdue first, by default', () => {
    render(<LoanTable loans={loans} asOf={ASOF} />);
    expect(bodyRows().map((r) => within(r).getAllByRole('cell')[0]!.textContent)).toEqual([
      'LN0002',
      'LN0003',
      'LN0001',
    ]);
  });

  it('filters by member name, case-insensitively', () => {
    render(<LoanTable loans={loans} asOf={ASOF} />);
    fireEvent.change(screen.getByLabelText('Search loans'), { target: { value: 'kato' } });
    expect(bodyRows()).toHaveLength(1);
    expect(screen.getByText('1 of 3 loans')).toBeInTheDocument();
  });

  it('shows an empty state when nothing matches', () => {
    render(<LoanTable loans={loans} asOf={ASOF} />);
    fireEvent.change(screen.getByLabelText('Search loans'), { target: { value: 'zzz' } });
    expect(screen.getByText(/No loans match/)).toBeInTheDocument();
  });

  it('lists only the loans in the selected aging bucket', () => {
    // LN0002 is 43 days overdue (31–60); LN0003 is 3 days (1–30); LN0001 is current.
    const { rerender } = render(<LoanTable loans={loans} asOf={ASOF} bucket="31-60" />);
    expect(bodyRows().map((r) => within(r).getAllByRole('cell')[0]!.textContent)).toEqual(['LN0002']);
    expect(screen.getByText('1 of 3 loans')).toBeInTheDocument();

    rerender(<LoanTable loans={loans} asOf={ASOF} bucket={null} />);
    expect(bodyRows()).toHaveLength(3);
  });

  it('applies the search inside the selected bucket', () => {
    render(<LoanTable loans={loans} asOf={ASOF} bucket="31-60" />);
    fireEvent.change(screen.getByLabelText('Search loans'), { target: { value: 'amina' } });
    expect(screen.getByText(/No loans match/)).toBeInTheDocument();
  });

  it('says so when the selected bucket is empty, and offers to clear it', () => {
    const onClear = vi.fn();
    render(<LoanTable loans={loans} asOf={ASOF} bucket="180+" onClearBucket={onClear} />);
    expect(screen.getByText('No loans in this bucket.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Clear bucket filter/ }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('toggles sort direction and reports it with aria-sort', () => {
    render(<LoanTable loans={loans} asOf={ASOF} />);
    const btn = screen.getByRole('button', { name: /Member/ });
    fireEvent.click(btn);
    expect(btn.closest('th')).toHaveAttribute('aria-sort', 'ascending');
    expect(within(bodyRows()[0]!).getByText('Amina Ssali')).toBeInTheDocument();
    fireEvent.click(btn);
    expect(btn.closest('th')).toHaveAttribute('aria-sort', 'descending');
  });
});
