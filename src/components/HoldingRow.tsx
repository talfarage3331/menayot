import type { EarningsEntry, Holding, Quote } from '../types'
import { statsForHolding } from '../lib/portfolio'
import { isLive } from '../lib/quotes'
import { hasAlerts, sideFor } from '../lib/alerts'
import { formatMoney, formatNumber, formatSignedPercent } from '../lib/money'
import { daysUntil } from '../lib/earnings'

type Props = {
  holding: Holding
  quotes: Record<string, Quote>
  earnings: EarningsEntry | undefined
  onSelect: (holding: Holding) => void
}

/** A report this close is worth flagging on the row itself. */
const IMMINENT_DAYS = 7

/** One position in the list. Tapping it opens the detail sheet. */
export function HoldingRow({ holding, quotes, earnings, onSelect }: Props) {
  const quote = quotes[holding.symbol]
  const stats = statsForHolding(holding, quotes)
  const live = isLive(holding, quotes)
  const breachedSide = sideFor(holding, stats.price)
  const isWatchOnly = holding.quantity === 0

  const dayChange =
    quote && typeof quote.previousClose === 'number' && quote.previousClose > 0
      ? (quote.price - quote.previousClose) / quote.previousClose
      : null

  const earningsDays = earnings ? daysUntil(earnings.date) : Number.NaN
  const earningsSoon =
    Number.isFinite(earningsDays) && earningsDays >= 0 && earningsDays <= IMMINENT_DAYS

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(holding)}
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
            {earningsSoon && (
              <span
                aria-label="דוח כספי קרוב"
                title="דוח כספי קרוב"
                className="text-slate-400"
              >
                📅
              </span>
            )}
          </p>

          <p dir="auto" className="truncate text-sm text-slate-400">
            {holding.name || 'ללא שם'}
          </p>

          <p dir="ltr" className="mt-1 text-right text-xs text-slate-500 tabular-nums">
            {isWatchOnly
              ? formatMoney(stats.price)
              : `${formatNumber(holding.quantity)} × ${formatMoney(stats.price)}`}
          </p>

          {!live && (
            <p className="mt-1 text-xs text-slate-500">מחיר ידני — לא במעקב אוטומטי</p>
          )}
        </div>

        <div className="shrink-0 text-left">
          {isWatchOnly ? (
            // Nothing is owned, so a value and a return would both be zero and
            // tell the user nothing. The day's move is the useful number.
            dayChange !== null && (
              <p dir="ltr" className={`text-base font-semibold tabular-nums ${tone(dayChange)}`}>
                {formatSignedPercent(dayChange)}
              </p>
            )
          ) : (
            <>
              <p dir="ltr" className="text-base font-semibold text-slate-100 tabular-nums">
                {formatMoney(stats.value)}
              </p>
              <p dir="ltr" className={`text-sm font-semibold tabular-nums ${tone(stats.profit)}`}>
                {formatSignedPercent(stats.profitRatio)}
              </p>
              {dayChange !== null && (
                <p dir="ltr" className={`text-xs tabular-nums ${tone(dayChange)}`}>
                  {formatSignedPercent(dayChange)} היום
                </p>
              )}
            </>
          )}
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
