type Props = {
  onAdd: () => void
}

/** What a first-time visitor sees before anything is in the portfolio. */
export function EmptyState({ onAdd }: Props) {
  return (
    <section className="rounded-2xl border border-dashed border-ink-600 px-6 py-12 text-center">
      <p className="text-4xl" aria-hidden="true">📈</p>
      <h2 className="mt-3 text-lg font-bold text-slate-100">התיק שלך עדיין ריק</h2>
      <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-slate-400">
        הוסף את המניה הראשונה שלך — כמה יחידות קנית ובאיזה מחיר. המחירים
        מתעדכנים לבד, ואפשר להגדיר גבול עליון ותחתון שיתריעו לך.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-5 h-12 rounded-xl bg-up px-6 font-bold text-ink-950"
      >
        הוספת מניה ראשונה
      </button>

      <p className="mx-auto mt-5 max-w-xs text-xs leading-relaxed text-slate-500">
        התיק נשמר במכשיר שלך בלבד ולא נשלח לשום מקום. אפשר לעקוב גם אחרי מניה
        שאתה לא מחזיק, רק בשביל ההתראות.
      </p>
    </section>
  )
}
