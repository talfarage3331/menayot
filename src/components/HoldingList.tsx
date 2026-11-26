import type { Holding, Quote } from '../types'
import { statsForHolding } from '../lib/portfolio'
import { HoldingRow } from './HoldingRow'

type Props = {
  holdings: Holding[]
  quotes: Record<string, Quote>
  onEdit: (holding: Holding) => void
}

/** The positions list, largest holding first. */
export function HoldingList({ holdings, quotes, onEdit }: Props) {
  const sorted = [...holdings].sort(
    (a, b) => statsForHolding(b, quotes).value - statsForHolding(a, quotes).value,
  )

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold text-slate-400">האחזקות שלי</h2>
      <ul className="flex flex-col gap-2.5">
        {sorted.map((holding) => (
          <HoldingRow
            key={holding.id}
            holding={holding}
            quotes={quotes}
            onEdit={onEdit}
          />
        ))}
      </ul>
    </section>
  )
}
