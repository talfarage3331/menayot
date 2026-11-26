import type { Holding } from '../types'

/** A holding with its derived figures. Pure data — no formatting. */
export type HoldingStats = {
  /** What the position cost to buy. */
  cost: number
  /** What it is worth now. */
  value: number
  /** value - cost. Negative means a loss. */
  profit: number
  /** profit / cost, as a ratio. 0 when cost is 0. */
  profitRatio: number
}

export type PortfolioStats = {
  cost: number
  value: number
  profit: number
  profitRatio: number
  /** Holdings sorted by value, largest first, each with its share of the total. */
  allocation: Array<{ holding: Holding; value: number; share: number }>
}

export function statsForHolding(holding: Holding): HoldingStats {
  const cost = holding.quantity * holding.buyPrice
  const value = holding.quantity * holding.currentPrice
  const profit = value - cost
  return {
    cost,
    value,
    profit,
    profitRatio: cost === 0 ? 0 : profit / cost,
  }
}

export function statsForPortfolio(holdings: Holding[]): PortfolioStats {
  let cost = 0
  let value = 0

  for (const holding of holdings) {
    const stats = statsForHolding(holding)
    cost += stats.cost
    value += stats.value
  }

  const profit = value - cost

  const allocation = holdings
    .map((holding) => {
      const holdingValue = statsForHolding(holding).value
      return {
        holding,
        value: holdingValue,
        share: value === 0 ? 0 : holdingValue / value,
      }
    })
    .sort((a, b) => b.value - a.value)

  return {
    cost,
    value,
    profit,
    profitRatio: cost === 0 ? 0 : profit / cost,
    allocation,
  }
}
