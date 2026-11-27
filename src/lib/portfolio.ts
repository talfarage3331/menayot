import type { Holding, Quote } from '../types'
import { priceFor } from './quotes'

/** A holding with its derived figures. Pure data — no formatting. */
export type HoldingStats = {
  /** The price used for valuation: live if available, else manual, else cost. */
  price: number
  /** What the position cost to buy. */
  cost: number
  /** What it is worth now. */
  value: number
  /** value - cost. Negative means a loss. */
  profit: number
  /** profit / cost, as a ratio. 0 when cost is 0. */
  profitRatio: number
}

/** A holding singled out by how it has performed. */
export type Standout = { holding: Holding; profitRatio: number }

export type PortfolioStats = {
  cost: number
  value: number
  profit: number
  profitRatio: number
  /** Today's change in value, summed over holdings the feed covers. */
  dayChange: number
  dayChangeRatio: number
  /** Holdings sorted by value, largest first, each with its share of the total. */
  allocation: Array<{ holding: Holding; value: number; share: number }>
  /** Strongest and weakest position by return. Null with fewer than two. */
  best: Standout | null
  worst: Standout | null
}

export function statsForHolding(
  holding: Holding,
  quotes: Record<string, Quote>,
): HoldingStats {
  const price = priceFor(holding, quotes)
  const cost = holding.quantity * holding.buyPrice
  const value = holding.quantity * price
  const profit = value - cost

  return {
    price,
    cost,
    value,
    profit,
    profitRatio: cost === 0 ? 0 : profit / cost,
  }
}

export function statsForPortfolio(
  holdings: Holding[],
  quotes: Record<string, Quote>,
): PortfolioStats {
  let cost = 0
  let value = 0
  let dayChange = 0
  let previousValue = 0

  for (const holding of holdings) {
    const stats = statsForHolding(holding, quotes)
    cost += stats.cost
    value += stats.value

    const quote = quotes[holding.symbol]
    if (quote && typeof quote.previousClose === 'number') {
      const yesterday = holding.quantity * quote.previousClose
      dayChange += stats.value - yesterday
      previousValue += yesterday
    }
  }

  const allocation = holdings
    .map((holding) => {
      const holdingValue = statsForHolding(holding, quotes).value
      return {
        holding,
        value: holdingValue,
        share: value === 0 ? 0 : holdingValue / value,
      }
    })
    .sort((a, b) => b.value - a.value)

  // Watch-only entries own nothing, so their return is meaningless here, and
  // a single position is not a ranking worth showing.
  const ranked = holdings
    .filter((holding) => holding.quantity > 0 && holding.buyPrice > 0)
    .map((holding) => ({
      holding,
      profitRatio: statsForHolding(holding, quotes).profitRatio,
    }))
    .sort((a, b) => b.profitRatio - a.profitRatio)

  return {
    cost,
    value,
    profit: value - cost,
    profitRatio: cost === 0 ? 0 : (value - cost) / cost,
    dayChange,
    dayChangeRatio: previousValue === 0 ? 0 : dayChange / previousValue,
    allocation,
    best: ranked.length >= 2 ? ranked[0] : null,
    worst: ranked.length >= 2 ? ranked[ranked.length - 1] : null,
  }
}
