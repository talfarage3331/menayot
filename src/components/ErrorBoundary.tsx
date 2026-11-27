import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { error: Error | null }

/**
 * Catches a crash in the tree below it.
 *
 * Without this, a thrown render leaves a blank page — and this app lives on
 * people's home screens, where a blank page looks like the app is gone and
 * there is no address bar to retry from. The portfolio itself is safe in
 * localStorage, so the recovery is simply to reload; the point is to say so
 * and give them a button.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('menayot crashed:', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="flex min-h-dvh items-center justify-center bg-ink-950 p-6">
        <div className="w-full max-w-sm rounded-2xl bg-ink-800 p-6 text-center ring-1 ring-ink-700">
          <p className="text-3xl" aria-hidden="true">
            😕
          </p>
          <h1 className="mt-3 text-lg font-bold text-slate-100">משהו נתקע</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            התיק שלך שמור ולא נפגע. רענון של המסך בדרך כלל פותר את זה.
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 h-12 w-full rounded-xl bg-up font-bold text-ink-950"
          >
            רענון
          </button>

          <p dir="ltr" className="mt-4 break-words text-xs text-slate-600">
            {error.message}
          </p>
        </div>
      </div>
    )
  }
}
