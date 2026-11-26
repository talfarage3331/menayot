import type { Holding, PortfolioState } from '../types'
import type { AlertState } from './alerts'

const KEY_V2 = 'menayot.portfolio.v2'
const KEY_V1 = 'menayot.portfolio.v1'
const KEY_ALERT_STATE = 'menayot.alertState.v1'

export const EMPTY_STATE: PortfolioState = { version: 2, holdings: [] }

/**
 * Reads saved state, migrating from v1 if that is all there is. Anything
 * unreadable or malformed falls back to an empty portfolio: a corrupt value in
 * localStorage must never leave the user staring at a blank screen.
 */
export function loadPortfolio(): PortfolioState {
  const v2 = read(KEY_V2)
  if (v2) {
    const holdings = Array.isArray((v2 as PortfolioState).holdings)
      ? (v2 as PortfolioState).holdings.filter(isHolding)
      : []
    return { version: 2, holdings }
  }

  const migrated = migrateFromV1(read(KEY_V1))
  if (migrated) {
    savePortfolio(migrated)
    return migrated
  }

  return EMPTY_STATE
}

export function savePortfolio(state: PortfolioState): void {
  write(KEY_V2, state)
}

export function loadAlertState(): AlertState {
  const stored = read(KEY_ALERT_STATE)
  return stored && typeof stored === 'object' ? (stored as AlertState) : {}
}

export function saveAlertState(state: AlertState): void {
  write(KEY_ALERT_STATE, state)
}

/**
 * v1 kept a per-portfolio currency and a hand-typed current price. v2 is
 * dollars throughout and treats a typed price as a fallback for symbols the
 * feed does not carry, so the old value becomes `manualPrice`.
 */
function migrateFromV1(value: unknown): PortfolioState | null {
  if (typeof value !== 'object' || value === null) return null
  const old = value as { holdings?: unknown }
  if (!Array.isArray(old.holdings)) return null

  const holdings: Holding[] = []
  for (const entry of old.holdings) {
    if (typeof entry !== 'object' || entry === null) continue
    const h = entry as Record<string, unknown>
    if (typeof h.id !== 'string' || typeof h.symbol !== 'string') continue

    holdings.push({
      id: h.id,
      symbol: h.symbol,
      name: typeof h.name === 'string' ? h.name : '',
      quantity: typeof h.quantity === 'number' ? h.quantity : 0,
      buyPrice: typeof h.buyPrice === 'number' ? h.buyPrice : 0,
      manualPrice: typeof h.currentPrice === 'number' ? h.currentPrice : null,
      alertLow: null,
      alertHigh: null,
    })
  }

  return { version: 2, holdings }
}

function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as unknown) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Persistence is best-effort; private browsing or a full disk must not
    // break the running app.
  }
}

function isHolding(value: unknown): value is Holding {
  if (typeof value !== 'object' || value === null) return false
  const h = value as Record<string, unknown>
  return (
    typeof h.id === 'string' &&
    typeof h.symbol === 'string' &&
    typeof h.name === 'string' &&
    typeof h.quantity === 'number' &&
    typeof h.buyPrice === 'number' &&
    (h.manualPrice === null || typeof h.manualPrice === 'number') &&
    (h.alertLow === null || typeof h.alertLow === 'number') &&
    (h.alertHigh === null || typeof h.alertHigh === 'number')
  )
}

export function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `h_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}
