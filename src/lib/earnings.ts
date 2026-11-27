import type { EarningsEntry, EarningsFeed } from '../types'

/**
 * The published earnings calendar, built once a day by a workflow and served
 * from the same branch as the prices.
 */
const FEED_URL =
  'https://raw.githubusercontent.com/talfarage3331/menayot/data/earnings.json'

const TIMEOUT_MS = 15_000

export async function fetchEarningsFeed(): Promise<EarningsFeed> {
  const response = await fetch(FEED_URL, {
    cache: 'no-cache',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })

  if (!response.ok) throw new Error(`earnings feed returned ${response.status}`)

  const body = (await response.json()) as unknown
  if (!isEarningsFeed(body)) throw new Error('earnings feed is malformed')

  return body
}

/**
 * Whole days from today until the report, in the user's own timezone.
 * 0 means today, negative means it has already happened.
 */
export function daysUntil(isoDate: string, now = new Date()): number {
  const [year, month, day] = isoDate.split('-').map(Number)
  if (!year || !month || !day) return Number.NaN

  const target = new Date(year, month - 1, day)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

/** "בעוד 3 ימים", "מחר", "היום" — how soon the report lands. */
export function formatCountdown(isoDate: string, now = new Date()): string {
  const days = daysUntil(isoDate, now)
  if (!Number.isFinite(days)) return ''
  if (days < 0) return 'כבר פורסם'
  if (days === 0) return 'היום'
  if (days === 1) return 'מחר'
  if (days === 2) return 'מחרתיים'
  if (days < 7) return `בעוד ${days} ימים`
  if (days < 14) return 'בעוד שבוע'
  if (days < 31) return `בעוד ${Math.round(days / 7)} שבועות`
  return `בעוד ${Math.round(days / 30)} חודשים`
}

/** "2 בדצמבר" — the report date, written out. */
export function formatReportDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  if (!year || !month || !day) return isoDate

  return new Intl.DateTimeFormat('he-IL', {
    day: 'numeric',
    month: 'long',
  }).format(new Date(year, month - 1, day))
}

/** Whether the company reports before the open or after the close. */
export function formatWhen(when: EarningsEntry['when']): string {
  if (when === 'pre') return 'לפני פתיחת המסחר'
  if (when === 'post') return 'אחרי נעילת המסחר'
  return 'שעה לא ידועה'
}

/** "$3.10 טריליון", "$159 מיליארד" — market cap at a readable scale. */
export function formatMarketCap(value: number | null | undefined): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return null

  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)} טריליון`
  if (value >= 1e9) return `$${Math.round(value / 1e9)} מיליארד`
  if (value >= 1e6) return `$${Math.round(value / 1e6)} מיליון`
  return `$${Math.round(value)}`
}

/** "53.1 מיליון" — trading volume, which runs to hundreds of millions. */
export function formatVolume(value: number | null | undefined): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return null

  if (value >= 1e9) return `${(value / 1e9).toFixed(1)} מיליארד`
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)} מיליון`
  if (value >= 1e3) return `${Math.round(value / 1e3)} אלף`
  return String(Math.round(value))
}

/**
 * Where a price sits inside a range, as a 0–1 ratio. Returns null when the
 * range is unusable, so the caller can hide the bar rather than draw a lie.
 */
export function positionInRange(
  price: number,
  low: number | null | undefined,
  high: number | null | undefined,
): number | null {
  if (typeof low !== 'number' || typeof high !== 'number') return null
  if (!Number.isFinite(low) || !Number.isFinite(high) || high <= low) return null

  return Math.min(1, Math.max(0, (price - low) / (high - low)))
}

function isEarningsFeed(value: unknown): value is EarningsFeed {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.updatedAt === 'string' &&
    typeof candidate.earnings === 'object' &&
    candidate.earnings !== null
  )
}
