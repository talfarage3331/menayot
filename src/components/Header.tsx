import type { CurrencyCode } from '../types'
import { CURRENCIES } from '../lib/money'

type Props = {
  currency: CurrencyCode
  onCurrencyChange: (currency: CurrencyCode) => void
}

/** App title plus the portfolio-wide currency switch. */
export function Header({ currency, onCurrencyChange }: Props) {
  return (
    <header className="flex items-center justify-between gap-3 pt-2 pb-5">
      <div className="flex items-center gap-2.5">
        <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="h-9 w-9" />
        <div>
          <h1 className="text-lg font-bold leading-tight text-slate-100">מניות</h1>
          <p className="text-xs leading-tight text-slate-400">מעקב תיק השקעות</p>
        </div>
      </div>

      <div
        role="group"
        aria-label="מטבע התיק"
        className="flex rounded-xl bg-ink-800 p-1 ring-1 ring-ink-700"
      >
        {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => onCurrencyChange(code)}
            aria-pressed={currency === code}
            title={CURRENCIES[code].label}
            className={`h-8 w-9 rounded-lg text-sm font-semibold transition-colors ${
              currency === code
                ? 'bg-ink-600 text-slate-50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {CURRENCIES[code].symbol}
          </button>
        ))}
      </div>
    </header>
  )
}
