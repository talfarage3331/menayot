import type { EarningsEntry, Holding, Quote } from '../types'
import { statsForHolding } from '../lib/portfolio'
import { HoldingRow } from './HoldingRow'

type Props = {
  title: string
  holdings: Holding[]
  quotes: Record<string, Quote>
  earnings: Record<string, EarningsEntry>
  onSelect: (holding: Holding) => void
}

/**
 * A list of positions, largest first. Used for both the owned holdings and
 * the watch-only entries, which differ only in their heading.
 */
export function HoldingList({ title, holdings, quotes, earnings, onSelect }: Props) {
  if (holdings.length === 0) return null

  const sorted = [...holdings].sort(
    (a, b) => statsForHolding(b, quotes).value - statsForHolding(a, quotes).value,
  )

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold text-slate-400">{title}</h2>
      <ul className="flex flex-col gap-2.5">
        {sorted.map((holding) => (
          <HoldingRow
            key={holding.id}
            holding={holding}
            quotes={quotes}
            earnings={earnings[holding.symbol]}
            onSelect={onSelect}
          />
        ))}
      </ul>
    </section>
  )
}
