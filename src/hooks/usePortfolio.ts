import { useCallback, useEffect, useState } from 'react'
import type { Holding, HoldingDraft } from '../types'
import { createId, loadPortfolio, savePortfolio } from '../lib/storage'

/**
 * Owns the portfolio: the single source of truth for holdings plus every
 * action that changes them. Persistence is a side effect handled here, so no
 * component needs to know about storage.
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

  /**
   * Fills in company names the user left blank once the feed supplies them.
   * Runs when quotes arrive, so a position added as bare "AAPL" picks up
   * "Apple Inc." by itself.
   */
  const adoptNames = useCallback((names: Record<string, string>) => {
    setState((current) => {
      let changed = false
      const holdings = current.holdings.map((holding) => {
        const name = names[holding.symbol]
        if (!holding.name && name) {
          changed = true
          return { ...holding, name }
        }
        return holding
      })
      return changed ? { ...current, holdings } : current
    })
  }, [])

  return {
    holdings: state.holdings as Holding[],
    addHolding,
    updateHolding,
    removeHolding,
    adoptNames,
  }
}
