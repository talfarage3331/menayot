import { useEffect, useRef, useState } from 'react'
import type { Holding, Quote } from '../types'
import { detectBreaches, type Breach } from '../lib/alerts'
import { loadAlertState, saveAlertState } from '../lib/storage'
import { notifyBreach } from '../lib/notify'

/**
 * Watches prices against each holding's thresholds and raises an alert the
 * moment one is crossed.
 *
 * This runs in the page, so it only fires while the app is open or in the
 * background with the tab alive. Alerts that arrive when the app is fully
 * closed need a push server, which this build does not have.
 */
export function useAlerts(holdings: Holding[], quotes: Record<string, Quote>) {
  const [recent, setRecent] = useState<Breach[]>([])
  const alertState = useRef(loadAlertState())

  useEffect(() => {
    if (Object.keys(quotes).length === 0) return

    const { breaches, next } = detectBreaches(holdings, quotes, alertState.current)
    alertState.current = next
    saveAlertState(next)

    if (breaches.length === 0) return

    setRecent(breaches)
    for (const breach of breaches) void notifyBreach(breach)
  }, [holdings, quotes])

  return {
    /** Breaches from the latest check, for the in-app banner. */
    recent,
    dismiss: () => setRecent([]),
  }
}
