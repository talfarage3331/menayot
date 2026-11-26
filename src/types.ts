/**
 * One position in the portfolio. All prices are per single share, in USD —
 * every instrument the price feed covers is US-listed and quoted in dollars.
 */
export type Holding = {
  id: string
  /** Ticker, e.g. AAPL. Stored uppercase; the key into the price feed. */
  symbol: string
  /** Company name. Filled in from the feed when it knows the symbol. */
  name: string
  quantity: number
  buyPrice: number
  /**
   * Price typed in by hand. Used only when the feed has no quote for this
   * symbol, so a position in an untracked ticker still works.
   */
  manualPrice: number | null
  /** Notify when the price falls to or below this. Null means no alert. */
  alertLow: number | null
  /** Notify when the price rises to or above this. Null means no alert. */
  alertHigh: number | null
}

/** Everything persisted for a user, under one storage key. */
export type PortfolioState = {
  version: 2
  holdings: Holding[]
}

/** The fields a user fills in; the id is assigned on save. */
export type HoldingDraft = Omit<Holding, 'id'>

/** A single quote from the price feed. */
export type Quote = {
  price: number
  previousClose: number | null
  currency: string
  name: string
  /** Seconds since the epoch, as the upstream feed reports it. */
  at: number | null
}

/** The whole published price file. */
export type PriceFeed = {
  updatedAt: string
  count: number
  quotes: Record<string, Quote>
}

/** Which side of its band a holding has breached. */
export type AlertSide = 'low' | 'high'
