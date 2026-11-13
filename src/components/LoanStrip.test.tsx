import { act, fireEvent, render, screen } from '@testing-library/react';
import type { Loan } from '../domain/types';
import { LoanStrip } from './LoanStrip';

const ASOF = '2026-11-13';
const base = { branch: 'Central', disbursedOn: '2026-01-01', principal: 1_000_000, overdueAmount: 0 };
const loans: Loan[] = [
  // Deliberately out of order: 200 days, current, 43 days, 3 days.
  { ...base, id: 'LN0001', member: 'Oscar Namara', outstandingPrincipal: 400_000, oldestUnpaidDueOn: '2026-04-27' },
  { ...base, id: 'LN0002', member: 'Grace Akello', outstandingPrincipal: 500_000, oldestUnpaidDueOn: null },
  { ...base, id: 'LN0003', member: 'Brian Kato', outstandingPrincipal: 800_000, oldestUnpaidDueOn: '2026-10-01' },
  { ...base, id: 'LN0004', member: 'Amina Ssali', outstandingPrincipal: 200_000, oldestUnpaidDueOn: '2026-11-10' },
];

/** jsdom can't paint, so stand in a fake 2D context that records what the component draws. */
function fakeContext() {
  const fills: Array<{ colour: string; x: number; y: number; w: number; h: number }> = [];
  const ctx = {
    fillStyle: '',
    scale: vi.fn(),
    clearRect: vi.fn(),
    fillRect(x: number, y: number, w: number, h: number) {
      fills.push({ colour: this.fillStyle, x, y, w, h });
    },
  };
  return { ctx, fills };
}

let fake: ReturnType<typeof fakeContext>;
let themeListeners: Array<() => void>;

beforeEach(() => {
  fake = fakeContext();
  themeListeners = [];
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(fake.ctx as unknown as CanvasRenderingContext2D);
  vi.stubGlobal('devicePixelRatio', 2);
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: (_: string, fn: () => void) => themeListeners.push(fn),
    removeEventListener: vi.fn(),
  }));
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.documentElement.removeAttribute('style');
});

describe('LoanStrip', () => {
  it('draws one column per loan, side by side across the full width', () => {
    render(<LoanStrip loans={loans} asOf={ASOF} />);
    expect(fake.fills).toHaveLength(4);
    // 600px wide (the test fallback) / 4 loans = 150px per column.
    expect(fake.fills.map((f) => f.x)).toEqual([0, 150, 300, 450]);
    expect(fake.fills.map((f) => f.w)).toEqual([150, 150, 150, 150]);
    expect(fake.fills.every((f) => f.h === 48)).toBe(true);
  });

  it('orders loans from least to most overdue and colours them with the aging scale', () => {
    render(<LoanStrip loans={loans} asOf={ASOF} />);
    // current -> --age-0, 3 days -> --age-1, 43 days -> --age-2, 200 days -> --age-5
    expect(fake.fills.map((f) => f.colour)).toEqual(['#3a9d5d', '#a7c957', '#f2c14e', '#8e2c48']);
  });

  it('snaps column edges to whole device pixels so neighbours meet exactly', () => {
    // 7 loans across 600px is 85.71px each, which doesn't land on whole pixels.
    const seven = Array.from({ length: 7 }, (_, i) => ({ ...loans[1]!, id: `LN10${i}` }));
    render(<LoanStrip loans={seven} asOf={ASOF} />);
    fake.fills.forEach((f, i) => {
      expect(Number.isInteger(f.x * 2)).toBe(true); // devicePixelRatio is 2 in these tests
      const next = fake.fills[i + 1];
      if (next) expect(f.x + f.w).toBeCloseTo(next.x);
    });
    const lastFill = fake.fills[6]!;
    expect(lastFill.x + lastFill.w).toBeCloseTo(600);
  });

  it('scales the backing store by devicePixelRatio so it stays sharp', () => {
    const { container } = render(<LoanStrip loans={loans} asOf={ASOF} />);
    const canvas = container.querySelector('canvas')!;
    expect(canvas.width).toBe(1200); // 600 CSS px × 2
    expect(canvas.height).toBe(96); // 48 CSS px × 2
    expect(fake.ctx.scale).toHaveBeenCalledWith(2, 2);
  });

  it('reads its colours from the CSS variables', () => {
    document.documentElement.style.setProperty('--age-0', '#00ff00');
    render(<LoanStrip loans={loans} asOf={ASOF} />);
    expect(fake.fills[0]!.colour).toBe('#00ff00');
  });

  it('redraws with the new colours when the theme changes', () => {
    render(<LoanStrip loans={loans} asOf={ASOF} />);
    expect(fake.fills).toHaveLength(4);

    document.documentElement.style.setProperty('--age-0', '#123456');
    act(() => themeListeners.forEach((fn) => fn()));
    expect(fake.fills).toHaveLength(8);
    expect(fake.fills[4]!.colour).toBe('#123456');
  });

  it('redraws when the loans change', () => {
    const { rerender } = render(<LoanStrip loans={loans} asOf={ASOF} />);
    rerender(<LoanStrip loans={loans.slice(0, 2)} asOf={ASOF} />);
    expect(fake.fills).toHaveLength(6);
    expect(fake.fills[5]!.x).toBe(300); // 2 loans -> 300px columns
  });

  it('describes the strip for screen readers and lists the bucket counts', () => {
    render(<LoanStrip loans={loans} asOf={ASOF} />);
    expect(screen.getByRole('img')).toHaveAttribute(
      'aria-label',
      '4 loans ordered from least to most overdue: 1 current, 1 1–30 days, 1 31–60 days, 0 61–90 days, 0 91–180 days, 1 180+ days',
    );
    expect(screen.getAllByRole('listitem')).toHaveLength(6);
  });

  it('shows which loan is under the mouse', () => {
    const { container } = render(<LoanStrip loans={loans} asOf={ASOF} />);
    const canvas = container.querySelector('canvas')!;
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 600, height: 48 }) as DOMRect;

    fireEvent.mouseMove(canvas, { clientX: 500 }); // fourth column: the most overdue loan
    expect(screen.getByRole('tooltip')).toHaveTextContent('LN0001 · Oscar Namara');
    expect(screen.getByRole('tooltip')).toHaveTextContent('200 days overdue');

    fireEvent.mouseMove(canvas, { clientX: 10 });
    expect(screen.getByRole('tooltip')).toHaveTextContent('Current');
    fireEvent.mouseLeave(canvas);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('does nothing when the browser gives no drawing context', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    expect(() => render(<LoanStrip loans={loans} asOf={ASOF} />)).not.toThrow();
  });
});
