import { useState } from 'react'
import { permissionState, requestPermission, type PermissionState } from '../lib/notify'

/**
 * Asks for notification permission, which every browser grants only in
 * response to a tap, and explains the iOS rule that trips people up: Safari
 * will not offer notifications at all until the app is on the home screen.
 */
export function NotificationSetup() {
  const [state, setState] = useState<PermissionState>(permissionState)

  if (state === 'granted') return null

  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true

  // On iOS, Notification simply does not exist in a plain Safari tab. Telling
  // the user to install first is the only useful thing to say.
  if (state === 'unsupported') {
    if (!isIos) return null
    return (
      <Shell>
        <p className="text-sm font-semibold text-slate-100">
          רוצה לקבל התראות על מחירים?
        </p>
        <p className="mt-1 text-sm leading-relaxed text-slate-400">
          באייפון התראות עובדות רק אחרי שמוסיפים את האפליקציה למסך הבית: כפתור
          השיתוף בספארי, ואז "הוספה למסך הבית". אחר כך תפתח אותה משם ותוכל
          לאשר.
        </p>
      </Shell>
    )
  }

  if (state === 'denied') {
    return (
      <Shell>
        <p className="text-sm font-semibold text-slate-100">ההתראות חסומות</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-400">
          חסמת התראות לאתר הזה. אפשר לבטל את החסימה בהגדרות הדפדפן, תחת
          ההרשאות של האתר.
        </p>
      </Shell>
    )
  }

  return (
    <Shell>
      <p className="text-sm font-semibold text-slate-100">
        קבלת התראות על מחירים
      </p>
      <p className="mt-1 text-sm leading-relaxed text-slate-400">
        {isIos && !isStandalone
          ? 'כדאי קודם להוסיף את האפליקציה למסך הבית, אחרת האייפון לא ישלח התראות.'
          : 'נודיע לך כשמניה תחצה את הגבול העליון או התחתון שהגדרת לה.'}
      </p>
      <button
        type="button"
        onClick={async () => setState(await requestPermission())}
        className="mt-3 h-10 rounded-lg bg-up px-4 text-sm font-bold text-ink-950"
      >
        אישור התראות
      </button>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex items-start gap-3 rounded-2xl bg-ink-800 p-4 ring-1 ring-ink-700">
      <span className="text-xl" aria-hidden="true">🔔</span>
      <div className="min-w-0 flex-1">{children}</div>
    </section>
  )
}
