import type { Holding, PriceFeed, Quote } from '../types'

/**
 * Where the published price file lives.
 *
 * The quote provider sends no CORS headers, so a page cannot call it directly.
 * A scheduled GitHub Action fetches quotes server-side and force-pushes the
 * result to the `data` branch; raw.githubusercontent.com serves that file with
 * `access-control-allow-origin: *`, which the browser will accept.
 */
const FEED_URL =
  'https://raw.githubusercontent.com/talfarage3331/menayot/data/prices.json'

const TIMEOUT_MS = 15_000

/** Fetches the current price feed. Throws on network or parse failure. */
export async function fetchPriceFeed(): Promise<PriceFeed> {
  const response = await fetch(FEED_URL, {
    // The file changes every few minutes and the CDN caches it for five,
    // so ask for a fresh copy rather than whatever the browser kept.
    cache: 'no-cache',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })

  if (!response.ok) throw new Error(`price feed returned ${response.status}`)

  const body = (await response.json()) as unknown
  if (!isPriceFeed(body)) throw new Error('price feed is malformed')

  return body
}

/**
 * The price to value a holding at: the live quote when the feed covers the
 * symbol, otherwise whatever was typed in by hand, otherwise the buy price
 * (which values the position at cost and shows no gain or loss).
 */
export function priceFor(holding: Holding, quotes: Record<string, Quote>): number {
  const quote = quotes[holding.symbol]
  if (quote) return quote.price
  if (holding.manualPrice !== null) return holding.manualPrice
  return holding.buyPrice
}

/** True when this holding's price comes from the feed rather than by hand. */
export function isLive(holding: Holding, quotes: Record<string, Quote>): boolean {
  return holding.symbol in quotes
}

function isPriceFeed(value: unknown): value is PriceFeed {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.updatedAt === 'string' &&
    typeof candidate.quotes === 'object' &&
    candidate.quotes !== null
  )
}
