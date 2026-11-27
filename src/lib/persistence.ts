/**
 * Durability of the portfolio, which lives only in this browser.
 *
 * By default a browser may evict a site's storage when the device runs low on
 * space — silently, with no warning and no way back. `navigator.storage
 * .persist()` asks it not to. Chrome grants it to installed web apps and to
 * sites the user engages with; Safari grants it on installation to the home
 * screen. Where it is refused or unsupported, the backup file is the fallback,
 * which is why the app nudges people to keep one.
 */

const LAST_BACKUP_KEY = 'menayot.lastBackupAt'

export type StorageStatus = {
  /** True once the browser has promised not to evict this site's data. */
  persisted: boolean
  /** False when the browser has no such concept at all. */
  supported: boolean
}

export async function storageStatus(): Promise<StorageStatus> {
  if (!navigator.storage?.persisted) return { persisted: false, supported: false }
  try {
    return { persisted: await navigator.storage.persisted(), supported: true }
  } catch {
    return { persisted: false, supported: false }
  }
}

/**
 * Asks the browser to keep this site's data. Safe to call more than once, and
 * safe to call without a user gesture — browsers that require one simply
 * refuse, which is reported rather than thrown.
 */
export async function requestPersistence(): Promise<boolean> {
  if (!navigator.storage?.persist) return false
  try {
    if (await navigator.storage.persisted()) return true
    return await navigator.storage.persist()
  } catch {
    return false
  }
}

export function markBackedUp(now = new Date()): void {
  try {
    localStorage.setItem(LAST_BACKUP_KEY, now.toISOString())
  } catch {
    // Best effort; failing to record a backup must not block making one.
  }
}

export function lastBackupAt(): Date | null {
  try {
    const raw = localStorage.getItem(LAST_BACKUP_KEY)
    if (!raw) return null
    const date = new Date(raw)
    return Number.isNaN(date.getTime()) ? null : date
  } catch {
    return null
  }
}

/** A portfolio worth protecting that has never been exported, or not lately. */
const STALE_AFTER_DAYS = 30

export function backupIsOverdue(holdingCount: number, now = new Date()): boolean {
  if (holdingCount === 0) return false

  const last = lastBackupAt()
  if (!last) return true

  const days = (now.getTime() - last.getTime()) / 86_400_000
  return days > STALE_AFTER_DAYS
}
