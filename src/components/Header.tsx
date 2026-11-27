import { formatAge } from '../lib/money'

type Props = {
  updatedAt: string | null
  isLoading: boolean
  error: string | null
  onRefresh: () => void
}

/** App title plus the state of the price feed. */
export function Header({ updatedAt, isLoading, error, onRefresh }: Props) {
  return (
    <header className="flex items-center justify-between gap-3 pt-2 pb-5">
      <div className="flex items-center gap-2.5">
        <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="h-9 w-9" />
        <div>
          <h1 className="text-lg font-bold leading-tight text-slate-100">מניות</h1>
          <p className="text-xs leading-tight text-slate-400">מעקב תיק השקעות</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onRefresh}
        disabled={isLoading}
        className="flex min-h-11 items-center gap-2 rounded-xl bg-ink-800 px-3 text-xs ring-1 ring-ink-700 transition-colors hover:bg-ink-700 disabled:opacity-60"
      >
        <span className={isLoading ? 'animate-spin' : ''} aria-hidden="true">
          ⟳
        </span>
        <span className={error ? 'text-down' : 'text-slate-400'}>
          {/*
            On a cold start there is nothing to be stale yet, and "לא עודכן"
            reads like a failure. Say what is actually happening instead.
          */}
          {error ?? (isLoading && !updatedAt ? 'טוען מחירים' : formatAge(updatedAt))}
        </span>
      </button>
    </header>
  )
}
