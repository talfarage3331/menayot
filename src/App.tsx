import { useEffect, useMemo, useState } from 'react'
import type { Holding, HoldingDraft } from './types'
import { usePortfolio } from './hooks/usePortfolio'
import { useQuotes } from './hooks/useQuotes'
import { useAlerts } from './hooks/useAlerts'
import { statsForPortfolio } from './lib/portfolio'
import { Header } from './components/Header'
import { SummaryCard } from './components/SummaryCard'
import { HoldingList } from './components/HoldingList'
import { Allocation } from './components/Allocation'
import { HoldingForm } from './components/HoldingForm'
import { EmptyState } from './components/EmptyState'
import { InstallHint } from './components/InstallHint'
import { NotificationSetup } from './components/NotificationSetup'
import { AlertBanner } from './components/AlertBanner'
import { BackupPanel } from './components/BackupPanel'

/** Which position the edit sheet is open for: none, a new one, or an existing one. */
type SheetState = { kind: 'closed' } | { kind: 'new' } | { kind: 'edit'; holding: Holding }

export default function App() {
  const portfolio = usePortfolio()
  const feed = useQuotes()
  const alerts = useAlerts(portfolio.holdings, feed.quotes)
  const [sheet, setSheet] = useState<SheetState>({ kind: 'closed' })

  const stats = useMemo(
    () => statsForPortfolio(portfolio.holdings, feed.quotes),
    [portfolio.holdings, feed.quotes],
  )

  // Once quotes arrive they carry company names, so positions added as a bare
  // ticker fill themselves in.
  const { adoptNames } = portfolio
  useEffect(() => {
    const names: Record<string, string> = {}
    for (const [symbol, quote] of Object.entries(feed.quotes)) {
      if (quote.name) names[symbol] = quote.name
    }
    if (Object.keys(names).length > 0) adoptNames(names)
  }, [feed.quotes, adoptNames])

  const handleSave = (draft: HoldingDraft) => {
    if (sheet.kind === 'edit') {
      portfolio.updateHolding(sheet.holding.id, draft)
    } else {
      portfolio.addHolding(draft)
    }
    setSheet({ kind: 'closed' })
  }

  const handleDelete = () => {
    if (sheet.kind !== 'edit') return
    portfolio.removeHolding(sheet.holding.id)
    setSheet({ kind: 'closed' })
  }

  const hasHoldings = portfolio.holdings.length > 0

  return (
    <div className="min-h-dvh bg-ink-950">
      <div className="mx-auto w-full max-w-md px-4 pb-28 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <Header
          updatedAt={feed.updatedAt}
          isLoading={feed.isLoading}
          error={feed.error}
          onRefresh={feed.refresh}
        />

        <main className="flex flex-col gap-6">
          <AlertBanner breaches={alerts.recent} onDismiss={alerts.dismiss} />

          {hasHoldings ? (
            <>
              <SummaryCard stats={stats} holdingCount={portfolio.holdings.length} />
              <HoldingList
                holdings={portfolio.holdings}
                quotes={feed.quotes}
                onEdit={(holding) => setSheet({ kind: 'edit', holding })}
              />
              <Allocation stats={stats} />
              <NotificationSetup />
              <BackupPanel
                holdings={portfolio.holdings}
                onRestore={portfolio.replaceHoldings}
              />
            </>
          ) : (
            <EmptyState onAdd={() => setSheet({ kind: 'new' })} />
          )}

          <InstallHint />
        </main>
      </div>

      {hasHoldings && (
        <button
          type="button"
          onClick={() => setSheet({ kind: 'new' })}
          aria-label="הוספת אחזקה"
          className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] end-4 h-14 w-14 rounded-full bg-up text-3xl font-light text-ink-950 shadow-lg shadow-black/50"
        >
          +
        </button>
      )}

      {sheet.kind !== 'closed' && (
        <HoldingForm
          key={sheet.kind === 'edit' ? sheet.holding.id : 'new'}
          holding={sheet.kind === 'edit' ? sheet.holding : null}
          quotes={feed.quotes}
          onSave={handleSave}
          onDelete={sheet.kind === 'edit' ? handleDelete : null}
          onClose={() => setSheet({ kind: 'closed' })}
        />
      )}
    </div>
  )
}
