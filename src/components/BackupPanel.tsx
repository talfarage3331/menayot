import { useEffect, useRef, useState } from 'react'
import type { Holding } from '../types'
import { describeBackup, downloadBackup, parseBackup } from '../lib/backup'
import {
  backupIsOverdue,
  markBackedUp,
  requestPersistence,
  storageStatus,
} from '../lib/persistence'

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
  const [persisted, setPersisted] = useState<boolean | null>(null)

  useEffect(() => {
    let alive = true

    // Ask the browser to stop evicting this site's data under storage
    // pressure. Granted silently for installed web apps; refused elsewhere,
    // which is worth telling the user about rather than hiding.
    void (async () => {
      const granted = await requestPersistence()
      const status = await storageStatus()
      if (alive) setPersisted(status.supported ? granted || status.persisted : null)
    })()

    return () => {
      alive = false
    }
  }, [])

  // Derived, not stored: `markBackedUp` writes the timestamp this reads, and
  // every path that calls it also re-renders, so the nudge clears by itself.
  const overdue = backupIsOverdue(holdings.length)

  const handleExport = () => {
    downloadBackup(holdings)
    markBackedUp()
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

      {persisted === false && (
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          הדפדפן לא התחייב לשמור את הנתונים אם ייגמר מקום במכשיר. הוספה למסך
          הבית בדרך כלל פותרת את זה. בכל מקרה, כדאי להחזיק קובץ גיבוי.
        </p>
      )}

      {overdue && (
        <p className="mt-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-200">
          עוד לא שמרת קובץ גיבוי. אם תנקה את הדפדפן או תחליף מכשיר, התיק יאבד.
        </p>
      )}

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
                markBackedUp()
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
