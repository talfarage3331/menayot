import { useEffect } from 'react'
import type { EarningsEntry, Holding, Quote } from '../types'
import { statsForHolding } from '../lib/portfolio'
import { isLive } from '../lib/quotes'
import { hasAlerts } from '../lib/alerts'
import {
  formatMoney,
  formatNumber,
  formatSignedMoney,
  formatSignedPercent,
} from '../lib/money'
import {
  formatCountdown,
  formatMarketCap,
  formatReportDate,
  formatVolume,
  formatWhen,
} from '../lib/earnings'
import { RangeBar } from './RangeBar'

type Props = {
  holding: Holding
  quotes: Record<string, Quote>
  earnings: EarningsEntry | undefined
  onEdit: () => void
  onClose: () => void
}

/**
 * Everything known about one position: price, where it sits in its ranges,
 * trading detail, the alerts set on it, and when the company next reports.
 */
export function HoldingDetail({ holding, quotes, earnings, onEdit, onClose }: Props) {
  const quote = quotes[holding.symbol]
  const stats = statsForHolding(holding, quotes)
  const live = isLive(holding, quotes)
  const isWatchOnly = holding.quantity === 0

  const dayChange =
    quote && typeof quote.previousClose === 'number' && quote.previousClose > 0
      ? (quote.price - quote.previousClose) / quote.previousClose
      : null

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="סגירה"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <div className="relative max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-ink-900 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] ring-1 ring-ink-700 sm:rounded-3xl">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-ink-600 sm:hidden" />

        <header className="mb-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 dir="ltr" className="text-2xl font-bold text-slate-50">
              {holding.symbol}
            </h2>
            <p dir="ltr" className="text-2xl font-bold tabular-nums text-slate-50">
              {formatMoney(stats.price)}
            </p>
          </div>

          <div className="mt-1 flex items-baseline justify-between gap-3">
            <p dir="auto" className="truncate text-sm text-slate-400">
              {holding.name || 'ללא שם'}
            </p>
            {dayChange !== null && (
              <p
                dir="ltr"
                className={`shrink-0 whitespace-nowrap text-sm font-semibold tabular-nums ${tone(dayChange)}`}
              >
                {formatSignedPercent(dayChange)} היום
              </p>
            )}
          </div>

          {quote?.exchange && (
            <p dir="auto" className="mt-1 text-xs text-slate-500">
              {quote.exchange}
            </p>
          )}

          {!live && (
            <p className="mt-2 rounded-lg bg-ink-800 px-3 py-2 text-xs text-slate-400">
              הסימול הזה לא במעקב האוטומטי, והמחיר שמוצג הוא זה שהזנת ידנית.
            </p>
          )}
        </header>

        {quote && (
          <div className="mb-5 flex flex-col gap-4 rounded-2xl bg-ink-800 p-4 ring-1 ring-ink-700">
            <RangeBar
              label="טווח 52 שבועות"
              low={quote.yearLow}
              high={quote.yearHigh}
              price={quote.price}
            />
            <RangeBar
              label="טווח היום"
              low={quote.dayLow}
              high={quote.dayHigh}
              price={quote.price}
            />
          </div>
        )}

        <Section title={isWatchOnly ? 'מעקב' : 'האחזקה שלי'}>
          {isWatchOnly ? (
            <p className="text-sm leading-relaxed text-slate-400">
              אתה עוקב אחרי המניה הזאת בלי להחזיק בה. היא לא נכללת בשווי התיק,
              אבל ההתראות עליה פעילות.
            </p>
          ) : (
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Stat label="כמות">
                <span dir="ltr" className="tabular-nums">
                  {formatNumber(holding.quantity)}
                </span>
              </Stat>
              <Stat label="שווי">
                <span dir="ltr" className="tabular-nums">
                  {formatMoney(stats.value)}
                </span>
              </Stat>
              <Stat label="מחיר קנייה">
                <span dir="ltr" className="tabular-nums">
                  {formatMoney(holding.buyPrice)}
                </span>
              </Stat>
              <Stat label="עלות">
                <span dir="ltr" className="tabular-nums">
                  {formatMoney(stats.cost)}
                </span>
              </Stat>
              <Stat label="רווח או הפסד">
                <span dir="ltr" className={`tabular-nums ${tone(stats.profit)}`}>
                  {formatSignedMoney(stats.profit)}
                </span>
              </Stat>
              <Stat label="תשואה">
                <span dir="ltr" className={`tabular-nums ${tone(stats.profit)}`}>
                  {formatSignedPercent(stats.profitRatio)}
                </span>
              </Stat>
            </dl>
          )}
        </Section>

        {quote && (formatVolume(quote.volume) || earnings?.marketCap) && (
          <Section title="נתוני מסחר">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {formatVolume(quote.volume) && (
                <Stat label="מחזור היום">
                  <span dir="auto" className="tabular-nums">
                    {formatVolume(quote.volume)}
                  </span>
                </Stat>
              )}
              {formatMarketCap(earnings?.marketCap) && (
                <Stat label="שווי שוק">
                  <span dir="auto" className="tabular-nums">
                    {formatMarketCap(earnings?.marketCap)}
                  </span>
                </Stat>
              )}
            </dl>
          </Section>
        )}

        {earnings && (
          <Section title="הדוח הכספי הבא">
            <div className="rounded-xl bg-ink-800 p-3.5 ring-1 ring-ink-700">
              <p className="text-base font-bold text-slate-100">
                {formatReportDate(earnings.date)}
                <span className="ms-2 text-sm font-semibold text-up">
                  {formatCountdown(earnings.date)}
                </span>
              </p>
              <p className="mt-1 text-sm text-slate-400">{formatWhen(earnings.when)}</p>

              {(earnings.epsForecast !== null || earnings.lastYearEps !== null) && (
                <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-ink-700 pt-3 text-sm">
                  {earnings.epsForecast !== null && (
                    <Stat label="תחזית רווח למניה">
                      <span dir="ltr" className="tabular-nums">
                        {formatMoney(earnings.epsForecast)}
                      </span>
                    </Stat>
                  )}
                  {earnings.lastYearEps !== null && (
                    <Stat label="אשתקד באותו רבעון">
                      <span dir="ltr" className="tabular-nums">
                        {formatMoney(earnings.lastYearEps)}
                      </span>
                    </Stat>
                  )}
                </dl>
              )}

              {earnings.fiscalQuarterEnding && (
                <p dir="auto" className="mt-2 text-xs text-slate-500">
                  רבעון המסתיים {earnings.fiscalQuarterEnding}
                </p>
              )}
            </div>
          </Section>
        )}

        <Section title="התראות מחיר">
          {hasAlerts(holding) ? (
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Stat label="גבול תחתון">
                <span dir="ltr" className="tabular-nums">
                  {holding.alertLow === null ? 'לא הוגדר' : formatMoney(holding.alertLow)}
                </span>
              </Stat>
              <Stat label="גבול עליון">
                <span dir="ltr" className="tabular-nums">
                  {holding.alertHigh === null ? 'לא הוגדר' : formatMoney(holding.alertHigh)}
                </span>
              </Stat>
            </dl>
          ) : (
            <p className="text-sm text-slate-400">
              לא הגדרת התראות למניה הזאת. אפשר להוסיף אותן בעריכה.
            </p>
          )}
        </Section>

        <div className="mt-5 flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="h-12 flex-1 rounded-xl bg-ink-800 font-semibold text-slate-300 ring-1 ring-ink-700"
          >
            סגירה
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="h-12 flex-[2] rounded-xl bg-up font-bold text-ink-950"
          >
            עריכה
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h3 className="mb-2 text-sm font-semibold text-slate-400">{title}</h3>
      {children}
    </section>
  )
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-semibold text-slate-200">{children}</dd>
    </div>
  )
}

function tone(amount: number): string {
  if (amount > 0) return 'text-up'
  if (amount < 0) return 'text-down'
  return 'text-slate-400'
}
