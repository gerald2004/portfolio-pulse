# Portfolio Pulse

A loan-portfolio health dashboard built with React and TypeScript. The charts are drawn by hand in **SVG and Canvas**, with no chart library, and every behaviour is backed by a test you can run.

> All data is synthetic: 500 loans from a seeded generator, so the numbers are identical on every run.

**Live demo:** _add your Vercel link here_ · ![CI](https://github.com/gerald2004/portfolio-pulse/actions/workflows/ci.yml/badge.svg)

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit + component tests
npm run typecheck
```

## What it measures

| Term | Definition used here |
|---|---|
| Days overdue | Days since the oldest unpaid instalment fell due. An instalment due **today** is not overdue. |
| Aging buckets | Current, 1–30, 31–60, 61–90, 91–180, 180+ days |
| PAR *n* | Outstanding principal of loans ≥ *n* days overdue, divided by total outstanding principal. It uses each late loan's **whole** balance, not just the late instalments. 0 for an empty portfolio. |

Dates are handled as UTC calendar days, so the viewer's time zone never moves a loan into a different bucket.

## Roadmap and success criteria

Each feature lists the checks that prove it's done. Ticked items have tests in the repo.

### Foundation
- [x] Seeded data generator: same seed gives the same portfolio. Every aging range is represented.
- [x] Days overdue, bucket boundaries (30 lands in 1–30, 31 in 31–60, 180 in 91–180, 181 in 180+), PAR, empty-portfolio handling
- [x] Loan table: search by member or ID, sortable columns with `aria-sort`, empty state
- [x] CI: typecheck, tests and build on every push and PR

### Aging bucket bar chart (SVG)
- [ ] Exactly one `<rect>` per bucket (6), in bucket order, even for empty buckets
- [ ] Bar heights proportional to outstanding principal. The tallest bar reaches the top of the plot area.
- [ ] Y axis with "nice" tick values (e.g. 0, 50M, 100M) and gridlines
- [ ] Scales to its container through `viewBox`, with no horizontal scroll at 360px width
- [ ] Hover or focus on a bar shows a tooltip with the bucket, loan count and amount
- [ ] Clicking a bar filters the loan table to that bucket. Clicking it again clears the filter.

### PAR donut (SVG)
- [ ] Arc angles match PAR 1 / 30 / 90 to within 0.5°
- [ ] A 0% segment draws nothing. A 100% segment draws a full ring, not an empty one.
- [ ] Centre label shows PAR 30

### Repayments line chart (SVG)
- [ ] One point per month and a crosshair on hover
- [ ] Arrow keys move between points when focused. The tooltip follows. Screen readers get the value.

### Loan strip (Canvas)
- [ ] One column per loan, coloured with the `--age-*` scale
- [ ] Sharp on high-DPI screens (backing store scaled by `devicePixelRatio`)
- [ ] Redraws on resize and on theme change
- [ ] README note: why Canvas suits 500+ marks better than SVG here

### Polish
- [ ] Dark mode for the charts (colours come from CSS variables)
- [ ] Playwright end-to-end tests plus screenshot comparison with a stated tolerance
- [ ] Animated GIF in this README

## Project layout

```
src/
  domain/      types, date maths, metrics (pure functions, fully tested)
  data/        seeded random + synthetic loan generator
  components/  StatTiles, LoanTable, charts
```
