import type { PortfolioStats } from '../lib/portfolio'
import { formatMoney, formatPercent } from '../lib/money'

type Props = {
  stats: PortfolioStats
}

// Distinct hues so neighbouring slices never read as the same colour.
const SLICE_COLORS = [
  '#34d399', '#60a5fa', '#f472b6', '#fbbf24', '#a78bfa',
  '#2dd4bf', '#fb923c', '#f87171', '#4ade80', '#38bdf8',
]

/** How the portfolio's value is split across its positions. */
export function Allocation({ stats }: Props) {
  const slices = stats.allocation.filter((slice) => slice.value > 0)
  if (slices.length === 0) return null

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold text-slate-400">התפלגות התיק</h2>

      <div className="flex h-3 overflow-hidden rounded-full bg-ink-800 ring-1 ring-ink-700">
        {slices.map((slice, index) => (
          <div
            key={slice.holding.id}
            style={{
              width: `${slice.share * 100}%`,
              backgroundColor: SLICE_COLORS[index % SLICE_COLORS.length],
            }}
            title={`${slice.holding.symbol} — ${formatPercent(slice.share)}`}
          />
        ))}
      </div>

      <ul className="mt-3 flex flex-col gap-2">
        {slices.map((slice, index) => (
          <li key={slice.holding.id} className="flex items-center gap-2.5 text-sm">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: SLICE_COLORS[index % SLICE_COLORS.length] }}
            />
            <span dir="ltr" className="font-semibold text-slate-200">
              {slice.holding.symbol}
            </span>
            <span className="ms-auto tabular-nums text-slate-400">
              {formatPercent(slice.share)}
            </span>
            <span dir="ltr" className="w-24 text-left tabular-nums text-slate-300">
              {formatMoney(slice.value)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
