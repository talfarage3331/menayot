import { useCallback, useEffect, useRef, useState } from 'react'
import type { EarningsEntry } from '../types'
import { fetchEarningsFeed } from '../lib/earnings'

/**
 * Loads the earnings calendar. Unlike prices there is no timer: the file is
 * rebuilt once a day, so fetching on mount and when the app comes back to the
 * foreground is plenty.
 */
export function useEarnings() {
  const [earnings, setEarnings] = useState<Record<string, EarningsEntry>>({})
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const mounted = useRef(true)
  /**
   * No calendar is published yet, so the first fetch 404s. Without this the
   * app would retry on every refocus and every user would collect a failed
   * request each time. One attempt per page load is enough: the moment a feed
   * does appear, the next load picks it up with no code change.
   */
  const giveUp = useRef(false)

  const refresh = useCallback(async () => {
    if (giveUp.current) return
    try {
      const feed = await fetchEarningsFeed()
      if (!mounted.current) return
      setEarnings(feed.earnings)
      setUpdatedAt(feed.updatedAt)
    } catch {
      // The calendar is a nice-to-have; its absence must not break the app,
      // and whatever was already loaded stays on screen.
      giveUp.current = true
    }
  }, [])

  useEffect(() => {
    mounted.current = true
    // Fetching the feed is the external system this effect synchronises with.
    // oxlint-disable-next-line react/set-state-in-effect
    void refresh()

    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      mounted.current = false
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [refresh])

  return { earnings, updatedAt }
}
