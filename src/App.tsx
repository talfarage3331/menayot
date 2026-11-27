import { useEffect, useMemo, useState } from 'react'
import type { Holding, HoldingDraft } from './types'
import { usePortfolio } from './hooks/usePortfolio'
import { useQuotes } from './hooks/useQuotes'
import { useEarnings } from './hooks/useEarnings'
import { useAlerts } from './hooks/useAlerts'
import { statsForPortfolio } from './lib/portfolio'
import { Header } from './components/Header'
import { SummaryCard } from './components/SummaryCard'
import { HoldingList } from './components/HoldingList'
import { UpcomingEarnings } from './components/UpcomingEarnings'
import { Allocation } from './components/Allocation'
import { HoldingDetail } from './components/HoldingDetail'
import { HoldingForm } from './components/HoldingForm'
import { EmptyState } from './components/EmptyState'
import { InstallHint } from './components/InstallHint'
import { NotificationSetup } from './components/NotificationSetup'
import { AlertBanner } from './components/AlertBanner'
import { BackupPanel } from './components/BackupPanel'

/**
 * What is open on top of the list: nothing, the detail view for a position,
 * the form for a new one, or the form editing an existing one.
 */
type Sheet =
  | { kind: 'closed' }
  | { kind: 'detail'; holding: Holding }
  | { kind: 'new' }
  | { kind: 'edit'; holding: Holding }

export default function App() {
  const portfolio = usePortfolio()
  const feed = useQuotes()
  const { earnings } = useEarnings()
  const alerts = useAlerts(portfolio.holdings, feed.quotes)
  const [sheet, setSheet] = useState<Sheet>({ kind: 'closed' })

  const stats = useMemo(
    () => statsForPortfolio(portfolio.holdings, feed.quotes),
    [portfolio.holdings, feed.quotes],
  )

  // Watch-only entries own nothing, so they are listed apart from the
  // portfolio and left out of its totals.
  const owned = portfolio.holdings.filter((holding) => holding.quantity > 0)
  const watched = portfolio.holdings.filter((holding) => holding.quantity === 0)

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

  const hasAnything = portfolio.holdings.length > 0
  const openDetail = (holding: Holding) => setSheet({ kind: 'detail', holding })

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

          {hasAnything ? (
            <>
              {owned.length > 0 && <SummaryCard stats={stats} />}

              <HoldingList
                title="האחזקות שלי"
                showCount
                holdings={owned}
                quotes={feed.quotes}
                earnings={earnings}
                onSelect={openDetail}
              />

              <HoldingList
                title="במעקב"
                showCount
                holdings={watched}
                quotes={feed.quotes}
                earnings={earnings}
                onSelect={openDetail}
              />

              <UpcomingEarnings
                holdings={portfolio.holdings}
                earnings={earnings}
                onSelect={openDetail}
              />

              {owned.length > 0 && <Allocation stats={stats} />}

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

      {hasAnything && (
        <button
          type="button"
          onClick={() => setSheet({ kind: 'new' })}
          aria-label="הוספת מניה"
          className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] end-4 h-14 w-14 rounded-full bg-up text-3xl font-light text-ink-950 shadow-lg shadow-black/50"
        >
          +
        </button>
      )}

      {sheet.kind === 'detail' && (
        <HoldingDetail
          key={sheet.holding.id}
          holding={sheet.holding}
          quotes={feed.quotes}
          earnings={earnings[sheet.holding.symbol]}
          onEdit={() => setSheet({ kind: 'edit', holding: sheet.holding })}
          onClose={() => setSheet({ kind: 'closed' })}
        />
      )}

      {(sheet.kind === 'new' || sheet.kind === 'edit') && (
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
