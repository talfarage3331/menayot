# מניות — Design

**Date:** 2026-11-26
**Status:** Approved, implemented in the initial release

## The actual problem

The stated request was "create an app and give me a folder on my Desktop for
VS Code". The clarified request turned out to be something else entirely:

> I want to work from my phone by sending you instructions, and for you to
> build it, make it work, and send me links to check. At the end I want to
> send the link to people, and for them to be able to use it and add it to
> their home screen as an app.

So the real deliverable is **a pipeline**, not a Desktop folder:

1. The owner sends an instruction from a phone.
2. Claude changes the code and pushes.
3. A public URL updates automatically.
4. The owner taps the link and checks.
5. The same link can be shared with anyone, and installs as an app.

The Desktop folder is incidental, and was dropped as a requirement.

## Constraints that fall out of this

| Constraint | Consequence |
| --- | --- |
| Owner is on a phone, no terminal | No step may require him to run a command |
| Link must be shareable | Public URL, not a private preview |
| Must install to home screen | PWA: manifest, service worker, icons, HTTPS |
| Owner won't configure services | No account signups, no API tokens for v1 |
| Future sessions start with no memory | Conventions must live in the repo |

## Hosting: why GitHub Pages

Three options were weighed.

**GitHub Pages (chosen).** The repo is already public, so Pages is free and
needs no account or token. A GitHub Actions workflow builds and publishes on
every push to `main`, giving a permanent public HTTPS URL — which is exactly
what PWA installation requires. The cost is that it is static only: no server,
so no hidden API keys.

**Claude Artifacts (rejected).** Instant and zero-setup, but it produces a
single-file page behind a claude.ai URL. It is not a codebase that grows, and
it does not give the shareable, installable app the owner asked for.

**Vercel / Cloudflare Pages (deferred).** Real serverless functions, so API
keys could stay secret, and per-branch preview URLs. Rejected for v1 only
because it requires the owner to create an account and hand over a token —
precisely the kind of step he cannot do from a phone. Moving later is a config
change, not a rewrite.

## Architecture

A single-page React app with no router, no backend and no state library. Data
lives in `localStorage`, so every visitor gets their own private portfolio with
no account.

```
src/
  types.ts              Shared shapes
  lib/money.ts          Formatting and input parsing      (pure)
  lib/portfolio.ts      Value, profit/loss, allocation    (pure)
  lib/storage.ts        Persistence and validation        (pure + localStorage)
  hooks/usePortfolio.ts State ownership and actions
  components/           Rendering only
  App.tsx               Composition and sheet open/closed state
```

The layering is the point: calculations are pure functions that can be reasoned
about and tested in isolation, state and side effects are confined to one hook,
and components only render. A future instruction like "change how profit is
calculated" has exactly one place to go.

## Data model

```ts
type Holding = {
  id: string
  symbol: string        // uppercase ticker
  name: string          // optional company name
  quantity: number
  buyPrice: number      // per share
  currentPrice: number  // per share
}

type PortfolioState = {
  version: 1
  currency: 'ILS' | 'USD' | 'EUR'
  holdings: Holding[]
}
```

One currency for the whole portfolio rather than per holding. This avoids
needing exchange rates — which would need a network call, which would need an
API key — while covering the realistic case. Per-holding currency is listed as
a later step.

`version` exists so a future incompatible change can migrate instead of
discarding saved data.

## Price source

Current prices are entered by hand in v1. This is a real limitation and was
chosen deliberately: free stock quote APIs either require a key or refuse
browser CORS requests, and a key embedded in a static site is public.

The honest path to live prices, documented in `CLAUDE.md`, is a scheduled
GitHub Action that fetches quotes server-side with a key held in repository
secrets and commits a `public/prices.json` that the app reads. That keeps the
key secret and the hosting free, at the price of one setup step by the owner.

Calculations read `currentPrice` off the holding, so swapping manual entry for
a fetched price touches the data layer only.

## Error handling

- Corrupt or unreadable `localStorage` falls back to an empty portfolio. A bad
  stored value must never produce a blank screen.
- Writes are wrapped: private browsing mode or a full disk degrades to an
  in-memory portfolio rather than throwing.
- Form input is validated before save: a symbol is required, quantity must be
  positive, prices cannot be negative. An empty current price is treated as
  the buy price, meaning "hasn't moved".
- Number parsing tolerates pasted commas, spaces and currency symbols.

## RTL

The page is `dir="rtl"`. Latin tickers and formatted figures carry `dir="ltr"`
so bidi does not scramble them. `Intl.NumberFormat` injects invisible RTL marks
into Hebrew currency output which push the currency symbol to the wrong side
inside an LTR element, so `formatMoney` strips them. This is the single most
fragile part of the UI and the thing most likely to regress.

## Verification

Builds are type-checked (`tsc -b`) and the UI is driven end to end with
Playwright on an iPhone viewport: add a position, add a second at a loss,
reload to confirm persistence, open the edit sheet, and assert no console
errors. Screenshots are reviewed, because RTL problems are visual and do not
raise errors.

## Explicitly out of scope for v1

Live prices, export/import, charts, per-holding currency, dividends and fees,
accounts and sync. Each is listed in `CLAUDE.md` so a later session picks the
right next step without re-deriving the context.
