import type { Holding, Quote } from '../types'
import { statsForHolding } from '../lib/portfolio'
import { isLive } from '../lib/quotes'
import { hasAlerts, sideFor } from '../lib/alerts'
import { formatMoney, formatNumber, formatSignedPercent } from '../lib/money'

type Props = {
  holding: Holding
  quotes: Record<string, Quote>
  onEdit: (holding: Holding) => void
}

/** One position in the list. Tapping anywhere on it opens the edit sheet. */
export function HoldingRow({ holding, quotes, onEdit }: Props) {
  const stats = statsForHolding(holding, quotes)
  const live = isLive(holding, quotes)
  const breachedSide = sideFor(holding, stats.price)

  return (
    <li>
      <button
        type="button"
        onClick={() => onEdit(holding)}
        className={`flex w-full items-center justify-between gap-3 rounded-2xl bg-ink-800 p-4 text-right ring-1 transition-colors hover:bg-ink-700 active:bg-ink-700 ${
          breachedSide ? 'ring-amber-500/50' : 'ring-ink-700'
        }`}
      >
        <div className="min-w-0">
          <p className="flex items-center gap-1.5">
            <span dir="ltr" className="text-base font-bold text-slate-100">
              {holding.symbol}
            </span>
            {hasAlerts(holding) && (
              <span
                aria-label={breachedSide ? 'התראה נחצתה' : 'הוגדרה התראה'}
                title={breachedSide ? 'התראה נחצתה' : 'הוגדרה התראה'}
                className={breachedSide ? 'text-amber-400' : 'text-slate-500'}
              >
                🔔
              </span>
            )}
          </p>

          <p dir="auto" className="truncate text-sm text-slate-400">
            {holding.name || 'ללא שם'}
          </p>

          <p dir="ltr" className="mt-1 text-right text-xs text-slate-500 tabular-nums">
            {formatNumber(holding.quantity)} × {formatMoney(stats.price)}
          </p>

          {!live && (
            <p className="mt-1 text-xs text-slate-500">מחיר ידני — לא במעקב אוטומטי</p>
          )}
        </div>

        <div className="shrink-0 text-left">
          <p dir="ltr" className="text-base font-semibold text-slate-100 tabular-nums">
            {formatMoney(stats.value)}
          </p>
          <p dir="ltr" className={`text-sm font-semibold tabular-nums ${tone(stats.profit)}`}>
            {formatSignedPercent(stats.profitRatio)}
          </p>
        </div>
      </button>
    </li>
  )
}

function tone(amount: number): string {
  if (amount > 0) return 'text-up'
  if (amount < 0) return 'text-down'
  return 'text-slate-400'
}
