import type { Holding, PortfolioState } from '../types'

const STORAGE_KEY = 'menayot.portfolio.v1'

export const EMPTY_STATE: PortfolioState = {
  version: 1,
  currency: 'ILS',
  holdings: [],
}

/**
 * Reads saved state. Anything unreadable or malformed falls back to an empty
 * portfolio rather than crashing the app — a corrupt value in localStorage
 * must never leave the user staring at a blank screen.
 */
export function loadPortfolio(): PortfolioState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY_STATE

    const parsed = JSON.parse(raw) as unknown
    if (!isPortfolioState(parsed)) return EMPTY_STATE

    return {
      version: 1,
      currency: parsed.currency,
      holdings: parsed.holdings.filter(isHolding),
    }
  } catch {
    return EMPTY_STATE
  }
}

/** Writes state. A full disk or a private-mode browser must not break the UI. */
export function savePortfolio(state: PortfolioState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Persistence is best-effort; the in-memory portfolio still works.
  }
}

function isPortfolioState(value: unknown): value is PortfolioState {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return (
    (candidate.currency === 'ILS' ||
      candidate.currency === 'USD' ||
      candidate.currency === 'EUR') &&
    Array.isArray(candidate.holdings)
  )
}

function isHolding(value: unknown): value is Holding {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.symbol === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.quantity === 'number' &&
    typeof candidate.buyPrice === 'number' &&
    typeof candidate.currentPrice === 'number'
  )
}

export function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `h_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}
