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

---

# Addendum — real-time prices and price alerts

**Date:** 2026-11-26, same day, after the owner stated the real requirements.

## What changed

The owner added three requirements that the original design could not meet:

1. The Hebrew must have no text or bidi errors.
2. Users register holdings and get **push notifications on their phone**,
   including on a **minimum and maximum price** they set per holding.
3. The system must receive data in **real time**.

He also stated a strong preference: **no new accounts** if it can be avoided,
and otherwise build everything that does not depend on them.

A static site cannot do (2) and (3) on its own. This addendum records what was
built, what was not, and why.

## Markets

US-listed only, by the owner's choice. Free real-time data covers US exchanges;
Tel Aviv-listed stocks are generally not available without paying. Israeli
companies that dual-list in New York (TEVA, NICE, MNDY, WIX, GLBE…) are in the
tracked universe and work normally.

This is why the portfolio currency setting was **removed**. All instruments are
quoted in dollars, and a currency selector that displayed a dollar figure with
a shekel sign would have been exactly the class of bug the owner complained
about. Dollars throughout, no exchange rates.

## Prices without a server or an account

The constraint that shaped everything: the quote provider sends no
`access-control-allow-origin` header, so a browser cannot call it. Verified by
inspecting the response headers directly rather than assuming.

The route found, which needs no account at all:

- A scheduled GitHub Action calls the provider **server-side**, where CORS does
  not apply, in batches of 20 symbols (the upstream maximum, found by probing:
  20 succeeds, 25 returns 400).
- It force-pushes the resulting `prices.json` to a `data` branch. Force-pushing
  keeps that branch at one commit, so a file written every five minutes does
  not grow the repository without bound.
- The app fetches it from `raw.githubusercontent.com`, which **does** send
  `access-control-allow-origin: *` — verified, not assumed.

Committing prices to `main` instead was rejected: GitHub Pages throttles builds
to roughly ten an hour, and a five-minute cadence would exceed that.

"Real time" therefore means 5–15 minutes, since GitHub runs scheduled workflows
on a best-effort basis. The UI always shows the feed's age rather than implying
it is live.

## Alerts

`lib/alerts.ts` is pure: given holdings, quotes and the previously recorded
state, it returns only **newly** crossed thresholds. The side of the band a
holding sits on is persisted, so an alert fires on the transition into a breach
and not again until the price returns inside the band. Verified end to end,
including that a repeat refresh does not re-fire.

### The limit, stated plainly

Alerts fire **only while the app is running**. Notifying a phone whose app is
closed requires Web Push: a server holding each subscriber's push subscription
and VAPID keys, and a job that posts to the push endpoints. That server needs
an account, which the owner asked to avoid for now.

Cloudflare Workers on the free plan is the intended home when he wants it —
cron down to a minute, free KV or D1 for subscriptions, and Web Push is just a
signed HTTP POST. It costs one free account and no money.

On iOS there is a second constraint that no amount of engineering removes:
notifications are unavailable until the web app is added to the home screen
(iOS 16.4+), and permission must be requested from a tap. Confirmed against
Apple's own documentation. The UI explains this rather than failing silently.

## Hebrew and RTL

Treated as a requirement with its own verification, not a polish pass. Found
and fixed:

- **Currency symbols on the wrong side.** `Intl` threads invisible RTL marks
  (U+200F) through Hebrew currency output; inside a `dir="ltr"` element those
  marks reorder the string. Now formatted in `en-US`, which is also the correct
  convention for dollars, with the marks stripped as a guard.
- **`.Apple Inc`** — a Latin company name in an RTL paragraph had its trailing
  period moved to the wrong end. Free text of unknown direction now carries
  `dir="auto"`, which isolates the run and picks direction from its content.
- **A mirrored arrow.** `←` is bidi-mirrored and can render pointing the
  opposite way in an RTL paragraph, which would have made a step-by-step
  install instruction read backwards. Replaced with words.
- **Invisible characters in the source itself.** Two literal U+200E/U+200F
  characters had ended up inside a regular expression, where no reviewer would
  ever see them. Replaced with `\uXXXX` escapes, and the whole tree scanned.

## Deployment note

`actions/configure-pages` was asked to enable Pages automatically so the owner
would not have to touch repository settings from a phone. It fails with
"Resource not accessible by integration": the workflow token is not permitted
to create a Pages site. Removed. Enabling Pages is a one-time manual step.
