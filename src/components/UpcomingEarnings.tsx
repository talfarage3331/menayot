import type { EarningsEntry, Holding } from '../types'
import { daysUntil, formatCountdown, formatReportDate } from '../lib/earnings'

type Props = {
  holdings: Holding[]
  earnings: Record<string, EarningsEntry>
  onSelect: (holding: Holding) => void
}

/** Report further out than this is not news yet. */
const HORIZON_DAYS = 30

/**
 * The reports coming up for stocks the user follows, soonest first.
 *
 * Earnings move prices more than most days' news, so knowing one is two days
 * away is worth a place on the main screen rather than being buried.
 */
export function UpcomingEarnings({ holdings, earnings, onSelect }: Props) {
  const upcoming = holdings
    .map((holding) => ({ holding, entry: earnings[holding.symbol] }))
    .filter((row): row is { holding: Holding; entry: EarningsEntry } => {
      if (!row.entry) return false
      const days = daysUntil(row.entry.date)
      return Number.isFinite(days) && days >= 0 && days <= HORIZON_DAYS
    })
    .sort((a, b) => a.entry.date.localeCompare(b.entry.date))

  if (upcoming.length === 0) return null

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold text-slate-400">דוחות כספיים קרובים</h2>

      <ul className="flex flex-col gap-2">
        {upcoming.map(({ holding, entry }) => {
          const days = daysUntil(entry.date)
          const isImminent = days <= 3

          return (
            <li key={holding.id}>
              <button
                type="button"
                onClick={() => onSelect(holding)}
                className={`flex w-full items-center justify-between gap-3 rounded-xl bg-ink-800 px-4 py-3 text-right ring-1 transition-colors hover:bg-ink-700 ${
                  isImminent ? 'ring-up/40' : 'ring-ink-700'
                }`}
              >
                <div className="min-w-0">
                  <p dir="ltr" className="text-right text-sm font-bold text-slate-100">
                    {holding.symbol}
                  </p>
                  <p dir="auto" className="truncate text-xs text-slate-400">
                    {holding.name || 'ללא שם'}
                  </p>
                </div>

                <div className="shrink-0 text-left">
                  <p
                    className={`text-sm font-semibold ${
                      isImminent ? 'text-up' : 'text-slate-200'
                    }`}
                  >
                    {formatCountdown(entry.date)}
                  </p>
                  <p dir="auto" className="text-xs text-slate-500">
                    {formatReportDate(entry.date)}
                  </p>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
