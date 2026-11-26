import type { Breach } from './alerts'
import { formatMoney } from './money'

export type PermissionState = 'unsupported' | 'default' | 'granted' | 'denied'

export function permissionState(): PermissionState {
  if (typeof Notification === 'undefined') return 'unsupported'
  return Notification.permission as PermissionState
}

/**
 * Asks for notification permission. Must be called from a tap or click —
 * every browser requires a user gesture, and Safari rejects it outright
 * without one.
 */
export async function requestPermission(): Promise<PermissionState> {
  if (typeof Notification === 'undefined') return 'unsupported'
  try {
    return (await Notification.requestPermission()) as PermissionState
  } catch {
    return permissionState()
  }
}

/**
 * Shows a system notification for a crossed threshold.
 *
 * Routed through the service worker registration when there is one: on
 * Android and in installed web apps that is the only way a notification
 * survives the page being backgrounded. Falls back to a plain Notification.
 */
export async function notifyBreach(breach: Breach): Promise<void> {
  if (permissionState() !== 'granted') return

  const direction = breach.side === 'high' ? 'עלתה אל מעל' : 'ירדה אל מתחת'
  const title = `${breach.symbol} ${breach.side === 'high' ? '▲' : '▼'}`
  const body =
    `${breach.symbol} ${direction} ל־${formatMoney(breach.threshold)}. ` +
    `המחיר כעת ${formatMoney(breach.price)}.`

  const options: NotificationOptions = {
    body,
    icon: `${import.meta.env.BASE_URL}icons/icon-192.png`,
    badge: `${import.meta.env.BASE_URL}icons/icon-192.png`,
    lang: 'he',
    dir: 'rtl',
    // One notification per holding and side, so a flapping price replaces its
    // own notification instead of stacking up a dozen of them.
    tag: `${breach.holdingId}:${breach.side}`,
  }

  try {
    const registration = await navigator.serviceWorker?.getRegistration()
    if (registration) {
      await registration.showNotification(title, options)
      return
    }
  } catch {
    // Fall through to the plain Notification below.
  }

  try {
    new Notification(title, options)
  } catch {
    // Some browsers refuse the constructor entirely; the in-app banner still
    // tells the user what happened.
  }
}
