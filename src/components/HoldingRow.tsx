import type { CurrencyCode, Holding } from '../types'
import { statsForHolding } from '../lib/portfolio'
import { formatMoney, formatNumber, formatSignedPercent } from '../lib/money'

type Props = {
  holding: Holding
  currency: CurrencyCode
  onEdit: (holding: Holding) => void
}

/** One position in the list. Tapping anywhere on it opens the edit sheet. */
export function HoldingRow({ holding, currency, onEdit }: Props) {
  const stats = statsForHolding(holding)
  const isUp = stats.profit > 0
  const isDown = stats.profit < 0
  const toneClass = isUp ? 'text-up' : isDown ? 'text-down' : 'text-slate-400'

  return (
    <li>
      <button
        type="button"
        onClick={() => onEdit(holding)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl bg-ink-800 p-4 text-right ring-1 ring-ink-700 transition-colors hover:bg-ink-700 active:bg-ink-700"
      >
        <div className="min-w-0">
          <p dir="ltr" className="text-right text-base font-bold text-slate-100">
            {holding.symbol}
          </p>
          <p className="truncate text-sm text-slate-400">
            {holding.name || 'ללא שם'}
          </p>
          <p dir="ltr" className="mt-1 text-right text-xs text-slate-500 tabular-nums">
            {formatNumber(holding.quantity)} × {formatMoney(holding.currentPrice, currency)}
          </p>
        </div>

        <div className="shrink-0 text-left">
          <p dir="ltr" className="text-base font-semibold text-slate-100 tabular-nums">
            {formatMoney(stats.value, currency)}
          </p>
          <p dir="ltr" className={`text-sm font-semibold tabular-nums ${toneClass}`}>
            {formatSignedPercent(stats.profitRatio)}
          </p>
        </div>
      </button>
    </li>
  )
}
