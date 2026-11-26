/**
 * "$1,234.50" — always rendered left-to-right, even inside the RTL layout.
 *
 * Formatted with en-US rather than he-IL on purpose. Hebrew currency output
 * puts the symbol after the digits and threads invisible right-to-left marks
 * through the string; inside a dir="ltr" element those marks reorder it and
 * the symbol lands in the wrong place. Dollar amounts are written "$1,234.50"
 * anyway, and every caller wraps this in dir="ltr".
 *
 * The mark strip stays as a guard in case a runtime adds marks of its own.
 */
export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  })
    .format(amount)
    .replace(/[\u200e\u200f]/g, '')
}

/** Same as formatMoney but with an explicit + for gains. */
export function formatSignedMoney(amount: number): string {
  const formatted = formatMoney(Math.abs(amount))
  if (amount > 0) return `+${formatted}`
  if (amount < 0) return `-${formatted}`
  return formatted
}

/** 0.0734 -> "+7.34%" */
export function formatSignedPercent(ratio: number): string {
  const percent = ratio * 100
  const sign = percent > 0 ? '+' : percent < 0 ? '-' : ''
  return `${sign}${Math.abs(percent).toFixed(2)}%`
}

/** 0.0734 -> "7.3%" — for allocation shares, where a sign would be noise. */
export function formatPercent(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('he-IL', { maximumFractionDigits: 4 })
    .format(value)
    .replace(/[\u200e\u200f]/g, '')
}

/** "לפני 4 דקות" — how stale the price feed is, in plain Hebrew. */
export function formatAge(isoTimestamp: string | null): string {
  if (!isoTimestamp) return 'לא עודכן'

  const minutes = Math.floor((Date.now() - new Date(isoTimestamp).getTime()) / 60_000)
  if (!Number.isFinite(minutes) || minutes < 0) return 'לא עודכן'
  if (minutes < 1) return 'עודכן עכשיו'
  if (minutes === 1) return 'עודכן לפני דקה'
  if (minutes < 60) return `עודכן לפני ${minutes} דקות`

  const hours = Math.floor(minutes / 60)
  if (hours === 1) return 'עודכן לפני שעה'
  if (hours < 24) return `עודכן לפני ${hours} שעות`

  const days = Math.floor(hours / 24)
  return days === 1 ? 'עודכן לפני יום' : `עודכן לפני ${days} ימים`
}

/**
 * Reads a number the user typed. Returns null for an empty field, so a blank
 * alert threshold stays "no alert" instead of becoming an alert at zero.
 */
export function parseOptionalNumber(input: string): number | null {
  if (input.trim() === '') return null
  const value = Number.parseFloat(input.replace(/[^\d.-]/g, ''))
  return Number.isFinite(value) ? value : null
}

/** Same, but an empty or unreadable field counts as 0. */
export function parseNumber(input: string): number {
  return parseOptionalNumber(input) ?? 0
}
