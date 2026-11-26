import { useCallback, useEffect, useState } from 'react'
import type { CurrencyCode, Holding, HoldingDraft } from '../types'
import { createId, loadPortfolio, savePortfolio } from '../lib/storage'

/**
 * Owns the portfolio: the single source of truth for holdings and the chosen
 * currency, plus every action that changes them. Persistence to localStorage
 * is a side effect handled here, so no component needs to know about storage.
 *
 * Saved state is read in the initializer rather than an effect, so the first
 * render already has the real portfolio and nothing flashes.
 */
export function usePortfolio() {
  const [state, setState] = useState(loadPortfolio)

  useEffect(() => {
    savePortfolio(state)
  }, [state])

  const addHolding = useCallback((draft: HoldingDraft) => {
    setState((current) => ({
      ...current,
      holdings: [...current.holdings, { ...draft, id: createId() }],
    }))
  }, [])

  const updateHolding = useCallback((id: string, draft: HoldingDraft) => {
    setState((current) => ({
      ...current,
      holdings: current.holdings.map((holding) =>
        holding.id === id ? { ...draft, id } : holding,
      ),
    }))
  }, [])

  const removeHolding = useCallback((id: string) => {
    setState((current) => ({
      ...current,
      holdings: current.holdings.filter((holding) => holding.id !== id),
    }))
  }, [])

  const setCurrency = useCallback((currency: CurrencyCode) => {
    setState((current) => ({ ...current, currency }))
  }, [])

  return {
    holdings: state.holdings as Holding[],
    currency: state.currency,
    addHolding,
    updateHolding,
    removeHolding,
    setCurrency,
  }
}
