import type { PortfolioStats } from '../lib/portfolio'
import { formatMoney, formatSignedMoney, formatSignedPercent } from '../lib/money'

type Props = {
  stats: PortfolioStats
  holdingCount: number
}

/** The headline numbers: what the portfolio is worth and how it is doing. */
export function SummaryCard({ stats, holdingCount }: Props) {
  const isUp = stats.profit > 0
  const isDown = stats.profit < 0

  return (
    <section className="rounded-2xl bg-gradient-to-bl from-ink-800 to-ink-900 p-5 ring-1 ring-ink-700">
      <p className="text-sm text-slate-400">שווי התיק</p>

      <p
        dir="ltr"
        className="mt-1 text-right text-4xl font-bold tracking-tight text-slate-50 tabular-nums"
      >
        {formatMoney(stats.value)}
      </p>

      <div className={`mt-2 flex items-center gap-2 text-base font-semibold ${tone(stats.profit)}`}>
        <span aria-hidden="true">{isUp ? '▲' : isDown ? '▼' : '—'}</span>
        <span dir="ltr" className="tabular-nums">
          {formatSignedMoney(stats.profit)}
        </span>
        <span dir="ltr" className="tabular-nums opacity-80">
          ({formatSignedPercent(stats.profitRatio)})
        </span>
      </div>

      <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-ink-700 pt-4 text-sm">
        <Stat label="עלות">
          <span dir="ltr" className="tabular-nums">{formatMoney(stats.cost)}</span>
        </Stat>

        <Stat label="היום">
          <span dir="ltr" className={`tabular-nums ${tone(stats.dayChange)}`}>
            {formatSignedMoney(stats.dayChange)}
          </span>
        </Stat>

        <Stat label="אחזקות">
          <span className="tabular-nums">{holdingCount}</span>
        </Stat>
      </dl>
    </section>
  )
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-right font-semibold text-slate-200">{children}</dd>
    </div>
  )
}

function tone(amount: number): string {
  if (amount > 0) return 'text-up'
  if (amount < 0) return 'text-down'
  return 'text-slate-400'
}
