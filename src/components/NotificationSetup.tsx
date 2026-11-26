import { useState } from 'react'
import { permissionState, requestPermission, type PermissionState } from '../lib/notify'

/**
 * Asks for notification permission, which every browser grants only in
 * response to a tap, and is honest about what the alerts can and cannot do.
 *
 * Two things trip people up and both are stated here rather than discovered:
 * iOS gives no notifications at all until the app is on the home screen, and
 * nothing fires while the app is fully closed, because that needs a push
 * server this build does not have.
 */
export function NotificationSetup() {
  const [state, setState] = useState<PermissionState>(permissionState)

  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true

  if (state === 'granted') {
    return (
      <Shell tone="on">
        <p className="text-sm font-semibold text-slate-100">ההתראות פעילות</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-400">
          ההתראה נשלחת כל עוד האפליקציה פתוחה או רצה ברקע. אם גבול נחצה
          כשהאפליקציה סגורה לגמרי, תראה את ההתראה ברגע שתפתח אותה שוב.
        </p>
      </Shell>
    )
  }

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
      <p className="text-sm font-semibold text-slate-100">קבלת התראות על מחירים</p>
      <p className="mt-1 text-sm leading-relaxed text-slate-400">
        {isIos && !isStandalone
          ? 'כדאי קודם להוסיף את האפליקציה למסך הבית, אחרת האייפון לא ישלח התראות.'
          : 'נודיע לך כשמניה תחצה את הגבול העליון או התחתון שהגדרת לה, כל עוד האפליקציה פתוחה או רצה ברקע.'}
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

function Shell({
  children,
  tone = 'off',
}: {
  children: React.ReactNode
  tone?: 'on' | 'off'
}) {
  return (
    <section
      className={`flex items-start gap-3 rounded-2xl bg-ink-800 p-4 ring-1 ${
        tone === 'on' ? 'ring-up/30' : 'ring-ink-700'
      }`}
    >
      <span className="text-xl" aria-hidden="true">
        🔔
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </section>
  )
}
