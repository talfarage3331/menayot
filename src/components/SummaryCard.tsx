import type { PortfolioStats, Standout } from '../lib/portfolio'
import { formatMoney, formatSignedMoney, formatSignedPercent } from '../lib/money'

type Props = {
  stats: PortfolioStats
}

/** The headline numbers: what the portfolio is worth and how it is doing. */
export function SummaryCard({ stats }: Props) {
  const isUp = stats.profit > 0
  const isDown = stats.profit < 0

  return (
    <section className="rounded-2xl bg-gradient-to-bl from-ink-800 to-ink-900 p-5 ring-1 ring-ink-700">
      <p className="text-sm text-slate-400">שווי התיק</p>

      <p
        dir="ltr"
        className="mt-1 text-right text-3xl font-bold tracking-tight text-slate-50 tabular-nums min-[380px]:text-4xl"
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

      {/*
        Two columns, not three: a six-figure portfolio value overflows a third
        of a 320px screen and collides with its neighbour. The number of
        holdings moved to the list heading, where it costs no room at all.
      */}
      <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-ink-700 pt-4 text-sm">
        <Stat label="עלות הרכישה">
          <span dir="ltr" className="tabular-nums">{formatMoney(stats.cost)}</span>
        </Stat>

        <Stat label="השינוי היום">
          <span dir="ltr" className={`tabular-nums ${tone(stats.dayChange)}`}>
            {formatSignedMoney(stats.dayChange)}
          </span>
        </Stat>
      </dl>

      {stats.best && stats.worst && (
        <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-ink-700 pt-4 text-sm">
          <Standing label="המניה המובילה" standout={stats.best} />
          <Standing label="הכי חלשה" standout={stats.worst} />
        </dl>
      )}
    </section>
  )
}

/** Names a holding and its return, for the best and worst of the portfolio. */
function Standing({ label, standout }: { label: string; standout: Standout }) {
  return (
    <div>
      <dt className="text-slate-400">{label}</dt>
      <dd className="mt-0.5 flex items-baseline gap-2">
        <span dir="ltr" className="font-bold text-slate-100">
          {standout.holding.symbol}
        </span>
        <span dir="ltr" className={`text-xs font-semibold tabular-nums ${tone(standout.profitRatio)}`}>
          {formatSignedPercent(standout.profitRatio)}
        </span>
      </dd>
    </div>
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
