/** A currency the whole portfolio is denominated in. */
export type CurrencyCode = 'ILS' | 'USD' | 'EUR'

/** One position in the portfolio. All prices are per single share. */
export type Holding = {
  id: string
  /** Ticker, e.g. AAPL or TEVA. Stored uppercase. */
  symbol: string
  /** Free-text company name. May be empty. */
  name: string
  quantity: number
  buyPrice: number
  currentPrice: number
}

/** Everything persisted for a user, under one storage key. */
export type PortfolioState = {
  version: 1
  currency: CurrencyCode
  holdings: Holding[]
}

/** The fields a user fills in; the id is assigned on save. */
export type HoldingDraft = Omit<Holding, 'id'>
