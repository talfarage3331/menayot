import { formatMoney } from '../lib/money'
import { positionInRange } from '../lib/earnings'

type Props = {
  label: string
  low: number | null | undefined
  high: number | null | undefined
  price: number
}

/**
 * Shows where the current price sits between a low and a high — the day's
 * range, or the past year's.
 *
 * The track is laid out left to right with the low on the left, matching how
 * the numbers themselves read, rather than following the page's RTL flow.
 * A number line that ran right to left would be read backwards by anyone used
 * to a chart.
 */
export function RangeBar({ label, low, high, price }: Props) {
  const position = positionInRange(price, low, high)
  if (position === null) return null

  return (
    <div>
      <p className="mb-1.5 text-xs text-slate-400">{label}</p>

      <div dir="ltr" className="relative h-1.5 rounded-full bg-ink-700">
        <div
          className="absolute inset-y-0 start-0 rounded-full bg-gradient-to-r from-down/50 to-up/50"
          style={{ width: '100%' }}
        />
        <div
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink-900 bg-slate-100"
          style={{ left: `${position * 100}%` }}
          aria-hidden="true"
        />
      </div>

      <div dir="ltr" className="mt-1.5 flex justify-between text-xs tabular-nums text-slate-500">
        <span>{formatMoney(low as number)}</span>
        <span className="font-semibold text-slate-300">{formatMoney(price)}</span>
        <span>{formatMoney(high as number)}</span>
      </div>
    </div>
  )
}
