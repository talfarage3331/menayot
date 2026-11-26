import type { Breach } from '../lib/alerts'
import { formatMoney } from '../lib/money'

type Props = {
  breaches: Breach[]
  onDismiss: () => void
}

/**
 * Shows crossed thresholds inside the app. This is the alert that always
 * works; the system notification is the same news delivered to the phone.
 */
export function AlertBanner({ breaches, onDismiss }: Props) {
  if (breaches.length === 0) return null

  return (
    <section
      role="alert"
      className="rounded-2xl bg-amber-500/10 p-4 ring-1 ring-amber-500/40"
    >
      <div className="flex items-start gap-3">
        <span className="text-xl" aria-hidden="true">🔔</span>

        <ul className="min-w-0 flex-1 space-y-1.5">
          {breaches.map((breach) => (
            <li key={`${breach.holdingId}:${breach.side}`} className="text-sm leading-relaxed">
              <span dir="ltr" className="font-bold text-amber-200">
                {breach.symbol}
              </span>{' '}
              <span className="text-amber-100/90">
                {breach.side === 'high' ? 'עברה את הגבול העליון' : 'ירדה מתחת לגבול התחתון'}
              </span>{' '}
              <span dir="ltr" className="font-semibold text-amber-200 tabular-nums">
                {formatMoney(breach.threshold)}
              </span>
              <span className="text-amber-100/70"> · כעת </span>
              <span dir="ltr" className="font-semibold text-amber-200 tabular-nums">
                {formatMoney(breach.price)}
              </span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="סגירה"
          className="-m-1 shrink-0 p-1 text-amber-200/60 hover:text-amber-200"
        >
          ✕
        </button>
      </div>
    </section>
  )
}
