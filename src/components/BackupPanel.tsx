import { useRef, useState } from 'react'
import type { Holding } from '../types'
import { describeBackup, downloadBackup, parseBackup } from '../lib/backup'

type Props = {
  holdings: Holding[]
  onRestore: (holdings: Holding[]) => void
}

type Pending = { holdings: Holding[]; description: string }

/**
 * Export and restore. The portfolio lives only in this browser, so a file the
 * user keeps is the only thing standing between them and losing it.
 */
export function BackupPanel({ holdings, onRestore }: Props) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<Pending | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const handleExport = () => {
    downloadBackup(holdings)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // Clear the input so picking the same file twice still fires a change.
    event.target.value = ''
    if (!file) return

    setError(null)
    const result = parseBackup(await file.text())

    if (!result.ok) {
      setError(result.error)
      return
    }
    setPending({ holdings: result.holdings, description: describeBackup(result.holdings) })
  }

  return (
    <section className="rounded-2xl bg-ink-800 p-4 ring-1 ring-ink-700">
      <h2 className="text-sm font-semibold text-slate-100">גיבוי התיק</h2>
      <p className="mt-1 text-xs leading-relaxed text-slate-400">
        התיק נשמר רק בדפדפן הזה. ניקוי היסטוריית הגלישה ימחק אותו. שמירה לקובץ
        היא הדרך היחידה לשחזר אותו אחר כך, או להעביר אותו למכשיר אחר.
      </p>

      <div className="mt-3 flex gap-2.5">
        <button
          type="button"
          onClick={handleExport}
          disabled={holdings.length === 0}
          className="h-11 flex-1 rounded-xl bg-ink-700 text-sm font-semibold text-slate-200 ring-1 ring-ink-600 disabled:opacity-50"
        >
          {saved ? 'הקובץ נשמר' : 'שמירה לקובץ'}
        </button>

        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="h-11 flex-1 rounded-xl bg-ink-700 text-sm font-semibold text-slate-200 ring-1 ring-ink-600"
        >
          שחזור מקובץ
        </button>
      </div>

      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        onChange={handleFile}
        className="hidden"
      />

      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-down">
          {error}
        </p>
      )}

      {pending && (
        <div className="mt-3 rounded-xl bg-ink-900 p-3 ring-1 ring-amber-500/40">
          <p className="text-sm text-slate-200">
            {pending.description}. השחזור יחליף את כל התיק הנוכחי.
          </p>
          <div className="mt-3 flex gap-2.5">
            <button
              type="button"
              onClick={() => setPending(null)}
              className="h-10 flex-1 rounded-lg bg-ink-800 text-sm font-semibold text-slate-300"
            >
              ביטול
            </button>
            <button
              type="button"
              onClick={() => {
                onRestore(pending.holdings)
                setPending(null)
              }}
              className="h-10 flex-1 rounded-lg bg-amber-500 text-sm font-bold text-ink-950"
            >
              שחזור
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
