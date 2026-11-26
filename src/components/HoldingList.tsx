import type { CurrencyCode, Holding } from '../types'
import { statsForHolding } from '../lib/portfolio'
import { HoldingRow } from './HoldingRow'

type Props = {
  holdings: Holding[]
  currency: CurrencyCode
  onEdit: (holding: Holding) => void
}

/** The positions list, largest holding first. */
export function HoldingList({ holdings, currency, onEdit }: Props) {
  const sorted = [...holdings].sort(
    (a, b) => statsForHolding(b).value - statsForHolding(a).value,
  )

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold text-slate-400">האחזקות שלי</h2>
      <ul className="flex flex-col gap-2.5">
        {sorted.map((holding) => (
          <HoldingRow
            key={holding.id}
            holding={holding}
            currency={currency}
            onEdit={onEdit}
          />
        ))}
      </ul>
    </section>
  )
}
