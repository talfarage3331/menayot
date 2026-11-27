import { useEffect, useState } from 'react'
import type { Holding, HoldingDraft, Quote } from '../types'
import { parseNumber, parseOptionalNumber, formatMoney } from '../lib/money'

type Props = {
  /** The holding being edited, or null when adding a new one. */
  holding: Holding | null
  quotes: Record<string, Quote>
  onSave: (draft: HoldingDraft) => void
  onDelete: (() => void) | null
  onClose: () => void
}

/** Owning the stock, or only watching it for alerts. */
type Mode = 'own' | 'watch'

type Fields = {
  symbol: string
  name: string
  quantity: string
  buyPrice: string
  manualPrice: string
  alertLow: string
  alertHigh: string
}

const BLANK: Fields = {
  symbol: '',
  name: '',
  quantity: '',
  buyPrice: '',
  manualPrice: '',
  alertLow: '',
  alertHigh: '',
}

function fieldsFor(holding: Holding | null): Fields {
  if (!holding) return BLANK
  return {
    symbol: holding.symbol,
    name: holding.name,
    quantity: holding.quantity === 0 ? '' : String(holding.quantity),
    buyPrice: holding.buyPrice === 0 ? '' : String(holding.buyPrice),
    manualPrice: holding.manualPrice === null ? '' : String(holding.manualPrice),
    alertLow: holding.alertLow === null ? '' : String(holding.alertLow),
    alertHigh: holding.alertHigh === null ? '' : String(holding.alertHigh),
  }
}

/** Bottom sheet for adding or editing a position and its price alerts. */
export function HoldingForm({ holding, quotes, onSave, onDelete, onClose }: Props) {
  // App gives this component a key per position, so a fresh sheet always
  // mounts fresh and these initializers are the only reset needed.
  const [fields, setFields] = useState<Fields>(() => fieldsFor(holding))
  const [mode, setMode] = useState<Mode>(() =>
    holding && holding.quantity === 0 ? 'watch' : 'own',
  )
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

  // Looked up live so the sheet can tell the user whether this symbol is
  // tracked automatically, and hide the manual price field when it is.
  const typedSymbol = fields.symbol.trim().toUpperCase()
  const quote = quotes[typedSymbol]

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    const symbol = typedSymbol
    const quantity = mode === 'watch' ? 0 : parseNumber(fields.quantity)
    const buyPrice = mode === 'watch' ? 0 : parseNumber(fields.buyPrice)
    const manualPrice = parseOptionalNumber(fields.manualPrice)
    const alertLow = parseOptionalNumber(fields.alertLow)
    const alertHigh = parseOptionalNumber(fields.alertHigh)

    if (!symbol) return setError('צריך להזין סימול, למשל AAPL')
    if (mode === 'own' && quantity <= 0) {
      return setError('הכמות צריכה להיות גדולה מאפס, או שתעבור למעקב בלבד')
    }
    if (buyPrice < 0) return setError('מחיר הקנייה לא יכול להיות שלילי')
    if (alertLow !== null && alertHigh !== null && alertLow >= alertHigh) {
      return setError('הגבול התחתון צריך להיות נמוך מהגבול העליון')
    }
    if (mode === 'watch' && alertLow === null && alertHigh === null && !quote) {
      return setError('למעקב בלבד כדאי להגדיר לפחות גבול אחד, אחרת אין מה להתריע')
    }

    onSave({
      symbol,
      name: fields.name.trim() || quote?.name || '',
      quantity,
      buyPrice,
      manualPrice,
      alertLow,
      alertHigh,
    })
  }

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
        className="relative max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-ink-900 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] ring-1 ring-ink-700 sm:rounded-3xl"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-ink-600 sm:hidden" />

        <h2 className="mb-4 text-lg font-bold text-slate-100">
          {holding ? 'עריכת מניה' : 'הוספת מניה'}
        </h2>

        <div
          role="group"
          aria-label="סוג הרשומה"
          className="mb-4 flex rounded-xl bg-ink-800 p-1 ring-1 ring-ink-700"
        >
          <ModeButton
            active={mode === 'own'}
            onClick={() => setMode('own')}
            label="אחזקה"
            hint="קניתי אותה"
          />
          <ModeButton
            active={mode === 'watch'}
            onClick={() => setMode('watch')}
            label="מעקב בלבד"
            hint="רק התראות"
          />
        </div>

        <div className="flex flex-col gap-3">
          <Field label="סימול" hint="AAPL, NVDA, TEVA">
            <input
              dir="ltr"
              autoFocus={!holding}
              value={fields.symbol}
              onChange={set('symbol')}
              placeholder="AAPL"
              className={inputClass}
            />
          </Field>

          {typedSymbol &&
            (quote ? (
              <p className="-mt-1 text-xs text-up">
                במעקב אוטומטי · <span dir="auto">{quote.name}</span> · כעת{' '}
                <span dir="ltr" className="tabular-nums">
                  {formatMoney(quote.price)}
                </span>
              </p>
            ) : (
              <p className="-mt-1 text-xs text-slate-500">
                הסימול הזה לא במעקב האוטומטי — תוכל להזין מחיר ידנית למטה.
              </p>
            ))}

          <Field label="שם החברה" hint="לא חובה">
            <input
              value={fields.name}
              onChange={set('name')}
              placeholder={quote?.name || 'Apple Inc.'}
              className={inputClass}
            />
          </Field>

          {mode === 'own' && (
            <div className="grid grid-cols-2 gap-3">
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

              <Field label="מחיר קנייה ($)">
                <input
                  dir="ltr"
                  inputMode="decimal"
                  value={fields.buyPrice}
                  onChange={set('buyPrice')}
                  placeholder="150"
                  className={inputClass}
                />
              </Field>
            </div>
          )}

          {!quote && (
            <Field label="מחיר נוכחי ($)" hint="כי הסימול לא במעקב">
              <input
                dir="ltr"
                inputMode="decimal"
                value={fields.manualPrice}
                onChange={set('manualPrice')}
                placeholder="175"
                className={inputClass}
              />
            </Field>
          )}

          <fieldset className="mt-1 rounded-xl border border-ink-700 p-3">
            <legend className="px-1.5 text-sm font-semibold text-slate-300">
              התראות מחיר
            </legend>
            <p className="mb-3 text-xs leading-relaxed text-slate-500">
              נודיע לך ברגע שהמחיר יחצה אחד מהגבולות. אפשר למלא רק אחד מהם.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <Field label="גבול תחתון ($)">
                <input
                  dir="ltr"
                  inputMode="decimal"
                  value={fields.alertLow}
                  onChange={set('alertLow')}
                  placeholder="140"
                  className={inputClass}
                />
              </Field>

              <Field label="גבול עליון ($)">
                <input
                  dir="ltr"
                  inputMode="decimal"
                  value={fields.alertHigh}
                  onChange={set('alertHigh')}
                  placeholder="200"
                  className={inputClass}
                />
              </Field>
            </div>
          </fieldset>
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
          <button type="submit" className="h-12 flex-[2] rounded-xl bg-up font-bold text-ink-950">
            שמירה
          </button>
        </div>

        {onDelete && (
          <button
            type="button"
            onClick={() => (confirmingDelete ? onDelete() : setConfirmingDelete(true))}
            className="mt-3 h-11 w-full rounded-xl text-sm font-semibold text-down hover:bg-down/10"
          >
            {confirmingDelete ? 'בטוח? לחיצה נוספת תמחק' : 'מחיקת המניה'}
          </button>
        )}
      </form>
    </div>
  )
}

const inputClass =
  'h-12 w-full rounded-xl bg-ink-800 px-3.5 text-base text-slate-100 ring-1 ring-ink-700 outline-none placeholder:text-slate-600 focus:ring-2 focus:ring-up'

function ModeButton({
  active,
  onClick,
  label,
  hint,
}: {
  active: boolean
  onClick: () => void
  label: string
  hint: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex-1 rounded-lg py-2 transition-colors ${
        active ? 'bg-ink-600 text-slate-50' : 'text-slate-400'
      }`}
    >
      <span className="block text-sm font-semibold">{label}</span>
      <span className="block text-xs opacity-70">{hint}</span>
    </button>
  )
}

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
        {hint && (
          <span dir="auto" className="text-slate-600">
            {' · '}
            {hint}
          </span>
        )}
      </span>
      {children}
    </label>
  )
}
