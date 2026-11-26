import type { AlertSide, Holding, Quote } from '../types'

/** A threshold crossing worth telling the user about. */
export type Breach = {
  holdingId: string
  symbol: string
  side: AlertSide
  price: number
  threshold: number
}

/**
 * Which side of its band each holding currently sits on. Persisting this is
 * what stops one crossing from notifying over and over: an alert fires on the
 * transition into a breach, and the slot only clears when the price comes back
 * inside the band.
 */
export type AlertState = Record<string, AlertSide | undefined>

/** Where a price sits relative to a holding's thresholds, right now. */
export function sideFor(holding: Holding, price: number): AlertSide | undefined {
  if (holding.alertHigh !== null && price >= holding.alertHigh) return 'high'
  if (holding.alertLow !== null && price <= holding.alertLow) return 'low'
  return undefined
}

/**
 * Compares current prices against the last known state and returns only newly
 * crossed thresholds, plus the state to persist. Pure: the caller decides what
 * to do with the breaches.
 */
export function detectBreaches(
  holdings: Holding[],
  quotes: Record<string, Quote>,
  previous: AlertState,
): { breaches: Breach[]; next: AlertState } {
  const breaches: Breach[] = []
  const next: AlertState = {}

  for (const holding of holdings) {
    const quote = quotes[holding.symbol]
    // Without a live price there is nothing trustworthy to compare against,
    // so carry the previous state forward untouched.
    if (!quote) {
      next[holding.id] = previous[holding.id]
      continue
    }

    const side = sideFor(holding, quote.price)
    if (side) next[holding.id] = side

    if (side && previous[holding.id] !== side) {
      breaches.push({
        holdingId: holding.id,
        symbol: holding.symbol,
        side,
        price: quote.price,
        threshold: (side === 'high' ? holding.alertHigh : holding.alertLow) as number,
      })
    }
  }

  return { breaches, next }
}

/** True when the holding has at least one threshold set. */
export function hasAlerts(holding: Holding): boolean {
  return holding.alertLow !== null || holding.alertHigh !== null
}
