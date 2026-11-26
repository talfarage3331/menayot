import { useCallback, useEffect, useRef, useState } from 'react'
import type { Quote } from '../types'
import { fetchPriceFeed } from '../lib/quotes'

/** How often to re-read the feed while the app is open, in milliseconds. */
const POLL_MS = 60_000

export type QuotesState = {
  quotes: Record<string, Quote>
  /** When the feed itself was generated, not when it was fetched. */
  updatedAt: string | null
  isLoading: boolean
  /** Set when the last attempt failed; the previous quotes are kept. */
  error: string | null
  refresh: () => void
}

/**
 * Keeps the price feed current: on mount, on a timer, and whenever the app
 * comes back to the foreground — which on a phone is the moment that matters,
 * since the timer does not run while the app is backgrounded.
 */
export function useQuotes(): QuotesState {
  const [quotes, setQuotes] = useState<Record<string, Quote>>({})
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Guards against two refreshes overlapping and against setting state after
  // the component is gone.
  const inFlight = useRef(false)
  const mounted = useRef(true)

  const refresh = useCallback(async () => {
    if (inFlight.current) return
    inFlight.current = true
    setIsLoading(true)

    try {
      const feed = await fetchPriceFeed()
      if (!mounted.current) return
      setQuotes(feed.quotes)
      setUpdatedAt(feed.updatedAt)
      setError(null)
    } catch {
      if (!mounted.current) return
      // Keep whatever quotes we already had; stale prices beat no prices.
      setError('לא הצלחנו לעדכן מחירים')
    } finally {
      inFlight.current = false
      if (mounted.current) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    mounted.current = true
    // Fetching the feed is exactly the "synchronizing with an external
    // system" that effects are for; the loading flag it sets on the way is
    // not a cascading render worth restructuring around.
    // oxlint-disable-next-line react/set-state-in-effect
    void refresh()

    const timer = setInterval(() => void refresh(), POLL_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      mounted.current = false
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [refresh])

  return { quotes, updatedAt, isLoading, error, refresh: () => void refresh() }
}
