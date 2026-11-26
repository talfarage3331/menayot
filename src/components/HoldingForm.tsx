import { useEffect, useState } from 'react'
import type { CurrencyCode, Holding, HoldingDraft } from '../types'
import { CURRENCIES, parseNumber } from '../lib/money'

type Props = {
  /** The holding being edited, or null when adding a new one. */
  holding: Holding | null
  currency: CurrencyCode
  onSave: (draft: HoldingDraft) => void
  onDelete: (() => void) | null
  onClose: () => void
}

type Fields = {
  symbol: string
  name: string
  quantity: string
  buyPrice: string
  currentPrice: string
}

const BLANK: Fields = { symbol: '', name: '', quantity: '', buyPrice: '', currentPrice: '' }

function fieldsFor(holding: Holding | null): Fields {
  if (!holding) return BLANK
  return {
    symbol: holding.symbol,
    name: holding.name,
    quantity: String(holding.quantity),
    buyPrice: String(holding.buyPrice),
    currentPrice: String(holding.currentPrice),
  }
}

/** Bottom sheet for adding or editing a position. */
export function HoldingForm({ holding, currency, onSave, onDelete, onClose }: Props) {
  // App gives this component a key per position, so a fresh sheet always
  // mounts fresh and these initializers are the only reset needed.
  const [fields, setFields] = useState<Fields>(() => fieldsFor(holding))
  const [error, setError] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const set = (key: keyof Fields) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFields((current) => ({ ...current, [key]: event.target.value }))
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    const symbol = fields.symbol.trim().toUpperCase()
    const quantity = parseNumber(fields.quantity)
    const buyPrice = parseNumber(fields.buyPrice)
    const currentPrice = parseNumber(fields.currentPrice)

    if (!symbol) return setError('צריך להזין סימול, למשל AAPL')
    if (quantity <= 0) return setError('הכמות צריכה להיות גדולה מאפס')
    if (buyPrice < 0 || currentPrice < 0) return setError('מחיר לא יכול להיות שלילי')

    onSave({
      symbol,
      name: fields.name.trim(),
      quantity,
      buyPrice,
      // An empty "current price" means the position has not moved yet.
      currentPrice: fields.currentPrice.trim() === '' ? buyPrice : currentPrice,
    })
  }

  const currencySymbol = CURRENCIES[currency].symbol

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="סגירה"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md rounded-t-3xl bg-ink-900 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] ring-1 ring-ink-700 sm:rounded-3xl"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-ink-600 sm:hidden" />

        <h2 className="mb-4 text-lg font-bold text-slate-100">
          {holding ? 'עריכת אחזקה' : 'הוספת אחזקה'}
        </h2>

        <div className="flex flex-col gap-3">
          <Field label="סימול" hint="AAPL, TEVA">
            <input
              dir="ltr"
              autoFocus={!holding}
              value={fields.symbol}
              onChange={set('symbol')}
              placeholder="AAPL"
              className={inputClass}
            />
          </Field>

          <Field label="שם החברה" hint="לא חובה">
            <input
              value={fields.name}
              onChange={set('name')}
              placeholder="Apple"
              className={inputClass}
            />
          </Field>

          <Field label="כמות">
            <input
              dir="ltr"
              inputMode="decimal"
              value={fields.quantity}
              onChange={set('quantity')}
              placeholder="10"
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={`מחיר קנייה (${currencySymbol})`}>
              <input
                dir="ltr"
                inputMode="decimal"
                value={fields.buyPrice}
                onChange={set('buyPrice')}
                placeholder="150"
                className={inputClass}
              />
            </Field>

            <Field label={`מחיר נוכחי (${currencySymbol})`}>
              <input
                dir="ltr"
                inputMode="decimal"
                value={fields.currentPrice}
                onChange={set('currentPrice')}
                placeholder="175"
                className={inputClass}
              />
            </Field>
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-3 text-sm font-medium text-down">
            {error}
          </p>
        )}

        <div className="mt-5 flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="h-12 flex-1 rounded-xl bg-ink-800 font-semibold text-slate-300 ring-1 ring-ink-700"
          >
            ביטול
          </button>
          <button
            type="submit"
            className="h-12 flex-[2] rounded-xl bg-up font-bold text-ink-950"
          >
            שמירה
          </button>
        </div>

        {onDelete && (
          <button
            type="button"
            onClick={() => (confirmingDelete ? onDelete() : setConfirmingDelete(true))}
            className="mt-3 h-11 w-full rounded-xl text-sm font-semibold text-down hover:bg-down/10"
          >
            {confirmingDelete ? 'בטוח? לחיצה נוספת תמחק' : 'מחיקת האחזקה'}
          </button>
        )}
      </form>
    </div>
  )
}

const inputClass =
  'h-12 w-full rounded-xl bg-ink-800 px-3.5 text-base text-slate-100 ring-1 ring-ink-700 outline-none placeholder:text-slate-600 focus:ring-2 focus:ring-up'

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-slate-400">
        {label}
        {hint && <span className="text-slate-600"> · {hint}</span>}
      </span>
      {children}
    </label>
  )
}
