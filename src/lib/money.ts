import type { CurrencyCode } from '../types'

export const CURRENCIES: Record<CurrencyCode, { symbol: string; label: string }> = {
  ILS: { symbol: '₪', label: 'שקל' },
  USD: { symbol: '$', label: 'דולר' },
  EUR: { symbol: '€', label: 'אירו' },
}

/**
 * "1,234.50 ₪" — always shown left-to-right, even inside the RTL layout.
 *
 * Intl sprinkles right-to-left marks (U+200F) through its Hebrew currency
 * output. Inside a dir="ltr" element those marks reorder the string and the
 * currency symbol jumps in front of the digits, so they are stripped out and
 * the plain "number then symbol" order is kept.
 */
export function formatMoney(amount: number, currency: CurrencyCode): string {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  })
    .format(amount)
    .replace(/[\u200e\u200f]/g, '')
}

/** Same as formatMoney but with an explicit + for gains, for profit/loss figures. */
export function formatSignedMoney(amount: number, currency: CurrencyCode): string {
  const formatted = formatMoney(Math.abs(amount), currency)
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
  return new Intl.NumberFormat('he-IL', { maximumFractionDigits: 4 }).format(value)
}

/**
 * Reads a number the user typed. Accepts an empty string as 0 and tolerates
 * stray spaces, commas and currency symbols pasted in from elsewhere.
 */
export function parseNumber(input: string): number {
  const cleaned = input.replace(/[^\d.-]/g, '')
  const value = Number.parseFloat(cleaned)
  return Number.isFinite(value) ? value : 0
}
