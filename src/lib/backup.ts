import type { Holding } from '../types'
import { isHolding } from './storage'

/**
 * Backup and restore for the portfolio.
 *
 * The app has no server and no account, so a holding exists in exactly one
 * place: this browser's localStorage. Clearing browsing data wipes it with no
 * way back. A file the user keeps is the only safety net there is.
 */

const FILE_PREFIX = 'menayot-backup'

export type BackupFile = {
  app: 'menayot'
  version: 2
  exportedAt: string
  holdings: Holding[]
}

export function buildBackup(holdings: Holding[]): BackupFile {
  return {
    app: 'menayot',
    version: 2,
    exportedAt: new Date().toISOString(),
    holdings,
  }
}

export function backupFileName(date = new Date()): string {
  const stamp = date.toISOString().slice(0, 10)
  return `${FILE_PREFIX}-${stamp}.json`
}

/** Triggers a download of the portfolio as a JSON file. */
export function downloadBackup(holdings: Holding[]): void {
  const blob = new Blob([JSON.stringify(buildBackup(holdings), null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = backupFileName()
  document.body.appendChild(link)
  link.click()
  link.remove()

  // Revoke on the next tick; revoking immediately can cancel the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export type ParseResult =
  | { ok: true; holdings: Holding[] }
  | { ok: false; error: string }

/**
 * Reads a backup file's text. Rejects anything that is not recognisably one of
 * ours rather than silently importing nothing, so a user who picks the wrong
 * file is told instead of quietly losing their portfolio.
 */
export function parseBackup(text: string): ParseResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, error: 'הקובץ אינו קובץ JSON תקין' }
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { ok: false, error: 'הקובץ אינו קובץ גיבוי של מניות' }
  }

  const candidate = parsed as Partial<BackupFile>
  if (candidate.app !== 'menayot') {
    return { ok: false, error: 'הקובץ אינו קובץ גיבוי של מניות' }
  }
  if (!Array.isArray(candidate.holdings)) {
    return { ok: false, error: 'חסרה רשימת אחזקות בקובץ' }
  }

  const holdings = candidate.holdings.filter(isHolding)
  if (holdings.length === 0 && candidate.holdings.length > 0) {
    return { ok: false, error: 'האחזקות בקובץ פגומות' }
  }

  return { ok: true, holdings }
}

/** Describes what a file holds, for the confirmation step. */
export function describeBackup(holdings: Holding[]): string {
  if (holdings.length === 0) return 'הקובץ ריק מאחזקות'
  if (holdings.length === 1) return 'הקובץ מכיל אחזקה אחת'
  return `הקובץ מכיל ${holdings.length} אחזקות`
}
