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
- [x] Exactly one `<rect>` per bucket (6), in bucket order, even for empty buckets
- [x] Bar heights proportional to outstanding principal. The tallest bar reaches the top of the plot area.
- [x] Y axis with "nice" tick values (e.g. 0, 50M, 100M) and gridlines
- [x] Scales to its container through `viewBox`, with no horizontal scroll at 360px width
- [x] Hover or focus on a bar shows a tooltip with the bucket, loan count and amount
- [x] Clicking a bar filters the loan table to that bucket. Clicking it again clears the filter.

### PAR donut (SVG)
- [x] Arc angles match PAR 1 / 30 / 90 to within 0.5°
- [x] A 0% segment draws nothing. A 100% segment draws a full ring, not an empty one.
- [x] Centre label shows PAR 30

### Repayments line chart (SVG)
- [x] One point per month and a crosshair on hover
- [x] Arrow keys move between points when focused. The tooltip follows. Screen readers get the value.

### Loan strip (Canvas)
- [x] One column per loan, coloured with the `--age-*` scale
- [x] Sharp on high-DPI screens (backing store scaled by `devicePixelRatio`)
- [x] Redraws on resize and on theme change
- [x] README note: why Canvas suits 500+ marks better than SVG here

### Polish
- [x] Dark mode for the charts (colours come from CSS variables)
- [ ] Playwright end-to-end tests plus screenshot comparison with a stated tolerance
- [ ] Animated GIF in this README

## How the charts are built

Every chart takes its data through props and only draws it. The money figures are calculated in `src/domain/`, where they are tested, and never inside a chart.

| Chart | Drawn with | Helper it relies on |
|---|---|---|
| Aging buckets | SVG `<rect>` | `linearScale`, `niceTicks` in `src/charts/scale.ts` |
| Portfolio at risk | SVG `<path>` arcs | `arcPath`, `sweepAngle` in `src/charts/arc.ts` |
| Repayments over time | SVG `<path>` line | the same scales, on both axes |
| Every loan at a glance | Canvas | `--age-*` colours read from CSS |

The SVG charts are drawn at the real pixel width of their card (`useElementWidth`), so axis text stays readable on a phone instead of shrinking with the drawing. Tooltips are plain HTML positioned over the chart.

### Why the loan strip uses Canvas, not SVG

SVG creates one DOM element per mark. That is what makes the bar chart easy to work with: each bar can take a click handler, a `tabIndex` and an `aria-label`. For the strip it would mean 500 `<rect>` elements today, and thousands for a real portfolio, each one tracked by the browser for layout, styling and events even though nobody interacts with a single column.

Canvas is one element. Drawing 500 columns is 500 `fillRect` calls that paint pixels and leave nothing behind, so the cost stays flat as the portfolio grows. The trade-offs are that the drawing isn't accessible or themeable by itself, so this component:

- gives the canvas a text summary (`aria-label`) and an HTML legend with the count per bucket
- reads the `--age-*` colours from CSS and repaints when the theme or the width changes
- scales its backing store by `devicePixelRatio` and snaps column edges to whole device pixels, so it stays sharp

## Project layout

```
src/
  domain/      types, date maths, metrics (pure functions, fully tested)
  data/        seeded random + synthetic loan and repayment generators
  charts/      scale and arc maths, width hook (no React components)
  components/  StatTiles, LoanTable and the four charts
```
