import { useEffect, useState } from 'react'

const DISMISS_KEY = 'menayot.installHint.dismissed'

/**
 * Nudges visitors to add the app to their home screen. Android and desktop
 * Chrome fire `beforeinstallprompt`, so there we can install in one tap. iOS
 * Safari has no such event, so there we explain the Share-menu route instead.
 */
export function InstallHint() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isDismissed, setIsDismissed] = useState(wasDismissed)

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault()
      setPrompt(event as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  }, [])

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1')
    setIsDismissed(true)
  }

  if (isDismissed || isStandalone()) return null

  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
  if (!prompt && !isIos) return null

  return (
    <section className="flex items-start gap-3 rounded-2xl bg-ink-800 p-4 ring-1 ring-ink-700">
      <span className="text-xl" aria-hidden="true">📲</span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-100">
          להתקין את "מניות" כאפליקציה?
        </p>
        {prompt ? (
          <button
            type="button"
            onClick={async () => {
              await prompt.prompt()
              setPrompt(null)
            }}
            className="mt-2 h-9 rounded-lg bg-up px-4 text-sm font-bold text-ink-950"
          >
            התקנה
          </button>
        ) : (
          <p className="mt-1 text-sm leading-relaxed text-slate-400">
            בספארי: כפתור השיתוף למטה, ואז "הוספה למסך הבית".
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={dismiss}
        aria-label="סגירה"
        className="-m-1 shrink-0 p-1 text-slate-500 hover:text-slate-300"
      >
        ✕
      </button>
    </section>
  )
}

function wasDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari exposes standalone mode on navigator instead.
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

/** Chromium's install prompt event, which TypeScript's DOM lib does not define. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
}
