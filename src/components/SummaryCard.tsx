import type { CurrencyCode } from '../types'
import type { PortfolioStats } from '../lib/portfolio'
import { formatMoney, formatSignedMoney, formatSignedPercent } from '../lib/money'

type Props = {
  stats: PortfolioStats
  currency: CurrencyCode
  holdingCount: number
}

/** The headline numbers: what the portfolio is worth and how it is doing. */
export function SummaryCard({ stats, currency, holdingCount }: Props) {
  const isUp = stats.profit > 0
  const isDown = stats.profit < 0
  const toneClass = isUp ? 'text-up' : isDown ? 'text-down' : 'text-slate-400'

  return (
    <section className="rounded-2xl bg-gradient-to-bl from-ink-800 to-ink-900 p-5 ring-1 ring-ink-700">
      <p className="text-sm text-slate-400">שווי התיק</p>

      <p
        dir="ltr"
        className="mt-1 text-right text-4xl font-bold tracking-tight text-slate-50 tabular-nums"
      >
        {formatMoney(stats.value, currency)}
      </p>

      <div className={`mt-2 flex items-center gap-2 text-base font-semibold ${toneClass}`}>
        <span aria-hidden="true">{isUp ? '▲' : isDown ? '▼' : '—'}</span>
        <span dir="ltr" className="tabular-nums">
          {formatSignedMoney(stats.profit, currency)}
        </span>
        <span dir="ltr" className="tabular-nums opacity-80">
          ({formatSignedPercent(stats.profitRatio)})
        </span>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-ink-700 pt-4 text-sm">
        <div>
          <dt className="text-slate-400">עלות הרכישה</dt>
          <dd dir="ltr" className="mt-0.5 text-right font-semibold text-slate-200 tabular-nums">
            {formatMoney(stats.cost, currency)}
          </dd>
        </div>
        <div>
          <dt className="text-slate-400">מספר אחזקות</dt>
          <dd className="mt-0.5 font-semibold text-slate-200 tabular-nums">{holdingCount}</dd>
        </div>
      </dl>
    </section>
  )
}
