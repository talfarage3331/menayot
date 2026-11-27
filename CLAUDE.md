# מניות — Project Guide for Claude

Read this first. It tells you what this project is, how it ships, and the
conventions to follow, so a session started from a phone with no prior context
can make a change correctly on the first try.

## What this is

A Hebrew, right-to-left, mobile-first **PWA** for tracking a personal portfolio
of US-listed stocks. Prices update by themselves, each holding can carry an
upper and a lower price alert, and the app shows when each company next
reports earnings. A holding with **zero quantity is a watch-only entry**: it
gets alerts and statistics but is kept out of the portfolio totals.

**Live URL:** https://talfarage3331.github.io/menayot/

## How the owner works

The owner (Tal) gives instructions from a phone, away from a computer. He does
not run commands, read diffs, or open a terminal. So:

- **Do the whole job yourself** — change the code, build it, verify it, commit,
  push to `main`. He has given standing permission to push to `main`; never
  hand back a command for him to run.
- **End every change with the live URL** so he can tap it and check.
- **Verify before claiming success.** Run `npm run build` and `npm run lint`,
  and drive the real UI with Playwright (see "Verifying"). Do not say something
  works because the code looks right.
- **The Hebrew must be correct.** He has asked for this explicitly, and it is
  the thing that breaks most often. See "RTL and Hebrew" below.
- Prefer finishing over asking. Ask only when a wrong guess would mean throwing
  the work away.

## Stack

- **Vite 8** + **React 19** + **TypeScript**
- **Tailwind CSS v4** via `@tailwindcss/vite`. There is no `tailwind.config.js`;
  design tokens live in the `@theme` block at the top of `src/index.css`.
- **vite-plugin-pwa** for the manifest and service worker.
- No router, no state library, no backend server. Keep it that way.

## How prices work, and why

Everything is USD. Every instrument tracked is US-listed and quoted in dollars,
so there is no currency setting and no exchange rate anywhere. Do not add one
without also adding a real FX source.

The quote provider sends **no CORS headers**, so the browser cannot call it.
The way round that, without any paid service or extra account:

1. `.github/workflows/prices.yml` runs every 10 minutes while US markets are
   open and calls `scripts/fetch-prices.mjs`.
2. That script reads `scripts/universe.json`, fetches quotes 20 symbols at a
   time (the upstream limit), and writes `prices.json`.
3. The workflow **force-pushes that one file to the `data` branch**, replacing
   it each run so the repository does not grow by a commit every 5 minutes.
4. The app reads it from `raw.githubusercontent.com`, which *does* send
   `access-control-allow-origin: *`.

### The earnings calendar — built, wired, and NOT currently fed

The app reads an `earnings.json` from the `data` branch and shows the next
report date, its EPS forecast and market cap. All of that works. **No such
file is being produced**, so the earnings parts of the UI simply do not appear.
This is the honest state of things; do not describe the feature as working.

`scripts/fetch-earnings.mjs` and `.github/workflows/earnings.yml` exist and are
correct, pointed at Nasdaq's keyless calendar. Its schedule is switched off
because that source **refuses datacenter addresses**: a GitHub runner fetched
0 of the days it asked for, exactly as the development container did. This was
confirmed from a CI log, not guessed.

What was tried, so it is not tried again:

- **Nasdaq's calendar** — keyless and perfect in shape (date, pre/post market,
  EPS forecast, market cap), but blocked from any cloud address. A browser or a
  home connection gets a 200 in two seconds.
- **The quote provider's own fundamentals endpoint** — answers 401 without a
  session token. Obtaining that token means working around an access control,
  so it was not pursued.
- **Node's `fetch` against Nasdaq** — dies with "other side closed" after 30
  seconds where curl gets a 200 in two, which is why the script shells out to
  curl with `--http1.1` (its HTTP/2 streams abort with INTERNAL_ERROR). Keep
  that if the script is ever revived.

Two routes remain, and the owner has to pick:

1. **A free API key** (Finnhub or similar — free tier, no card) gives real
   announced dates. Point `fetch-earnings.mjs` at it, hold the key in a
   repository secret, re-enable the cron.
2. **SEC EDGAR** is official, explicitly welcomes automated clients and needs
   no key, but publishes *past* filings. The next report can only be estimated
   from the filing cadence, and the UI would have to say "expected", not
   promise a date.

Both workflows write the same `data` branch, so **each one fetches the branch
first and puts the other's file back** before force-pushing. Breaking that
would mean the 10-minute price run silently deletes the earnings file.

**To track a new symbol, add it to `scripts/universe.json`.** Nothing else.
A holding whose symbol is not in the universe falls back to a hand-typed
`manualPrice`, and the UI says so.

284 symbols are tracked, in 15 requests per run. After adding one, check the
run's log: the provider silently serves no data for a handful of perfectly
valid tickers (BK, MMC and K were removed for that reason, and neither the
batch nor the per-symbol endpoint returns them).

GitHub runs scheduled workflows on a best-effort basis, so prices can be
10–20 minutes old: the schedule itself may slip, and raw.githubusercontent.com
caches for 5 minutes on top. `Header` always shows how stale they are; never
present them as tick-by-tick live.

The schedule is deliberately not `*/5`. At GitHub's documented 5-minute floor
no scheduled run fired at all over two hours — runs at the floor are dropped
first under load. If prices go stale again, check
`list_workflow_runs` filtered to the `schedule` event before changing anything
else, and trigger `prices.yml` by hand (`workflow_dispatch`) to refresh now.
Genuinely frequent updates need a real scheduler, which is the same server
that would solve push.

## How alerts work, and their one real limit

`src/lib/alerts.ts` compares each holding's price against its `alertLow` and
`alertHigh`. An alert fires on the **transition** into a breach: the side is
remembered in localStorage and only clears when the price returns inside the
band, so one crossing notifies once rather than on every refresh.

**Alerts only fire while the app is running.** Notifying a phone whose app is
fully closed needs Web Push, which needs a server holding push subscriptions
and VAPID keys. There is no such server. Do not claim otherwise in the UI.

On iOS, notifications do not exist at all until the app is added to the home
screen (iOS 16.4+), and permission must be requested from a tap.
`NotificationSetup` explains this; keep that explanation accurate.

## Shipping

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds and
force-pushes `dist/` to the **`gh-pages` branch**. Pages serves that branch.
About a minute.

It publishes to a branch rather than through `actions/deploy-pages` on
purpose: the Actions source has to be switched on by hand in repository
settings, and the workflow token may not do it ("Resource not accessible by
integration"). Pushing a `gh-pages` branch enabled Pages by itself and needs
no setup, so the repo deploys itself from a clean clone. Do not switch this
back without checking the Pages source first.

`vite.config.ts` sets `base: '/menayot/'` because this is a GitHub Pages
*project* page. **Never hardcode a leading `/` in an asset path** — use
`import.meta.env.BASE_URL`, or the asset 404s in production while working fine
locally.

## Layout

```
scripts/
  universe.json         Symbols both feeds track
  fetch-prices.mjs      Runs on CI every 10 minutes, writes prices.json
  fetch-earnings.mjs    Runs on CI daily, writes earnings.json
src/
  types.ts              Shared data shapes
  lib/
    money.ts            Formatting and input parsing
    portfolio.ts        Value, profit/loss, day change, allocation  (pure)
    alerts.ts           Threshold crossing detection                (pure)
    quotes.ts           Fetching the price feed, resolving a holding's price
    earnings.ts         Fetching the earnings feed; date, cap and volume text
    storage.ts          localStorage, validation, v1→v2 migration
    notify.ts           Notification permission and display
    backup.ts           Export and restore the portfolio as a JSON file
  hooks/
    usePortfolio.ts     Owns holdings and every action on them
    useQuotes.ts        Keeps the price feed current (timer + on refocus)
    useEarnings.ts      Loads the earnings calendar (on mount + on refocus)
    useAlerts.ts        Runs detection and raises notifications
  components/           One component per file, presentational
  App.tsx               Composition and the edit sheet's open state
```

`lib/` is pure and trivially testable, `hooks/` own state and side effects,
`components/` only render. Keep new code in the layer where it belongs rather
than widening `App.tsx`.

## RTL and Hebrew

The page is `dir="rtl"`. This is where bugs come from, so:

- **Ticker symbols and figures need `dir="ltr"`** on their element.
- **Free text of unknown direction needs `dir="auto"`** — company names come
  from the feed or the user and may be Latin or Hebrew. Without it, trailing
  punctuation moves: "Apple Inc." renders as ".Apple Inc".
- **Never call `Intl.NumberFormat` directly in a component.** Go through
  `formatMoney`, which formats in `en-US` on purpose: Hebrew currency output
  puts the symbol after the digits and threads invisible RTL marks through the
  string, which reorder it inside a `dir="ltr"` element.
- **No arrows in UI text.** `←` and `→` are bidi-mirrored and can render
  pointing the wrong way in an RTL paragraph. Write the word instead.
- **No invisible characters in source.** Use `\uXXXX` escapes. Scan with:
  `grep -rP '[\x{200b}-\x{200f}\x{202a}-\x{202e}\x{2066}-\x{2069}\x{feff}]' src/`
- Touch targets at least 44px tall; this is used on phones.
- Respect the safe-area insets already applied in `App.tsx` and
  `HoldingForm.tsx`.

## Data

`localStorage`, key `menayot.portfolio.v2`. No server, no account, so each
visitor's portfolio is their own and never leaves their device. `storage.ts`
migrates a v1 portfolio on first load.

If `PortfolioState` changes incompatibly, bump to v3 and migrate — do not drop
people's data.

## Verifying

```bash
npm run build      # tsc -b && vite build
npm run lint       # oxlint
npx vite preview --port 4173
```

Then drive it. `scripts/`-adjacent throwaway test files belong in the
scratchpad, not the repo. Mock the price feed so the test is deterministic:

```js
const { chromium, devices } = require('playwright')
const FEED = 'https://raw.githubusercontent.com/talfarage3331/menayot/data/prices.json'
const ctx = await (await chromium.launch({ args: ['--no-sandbox'] }))
  .newContext({ ...devices['iPhone 13'], locale: 'he-IL' })
await ctx.route(FEED, (route) => route.fulfill({
  status: 200, contentType: 'application/json',
  body: JSON.stringify({ updatedAt: new Date().toISOString(), count: 1, quotes: {
    AAPL: { price: 180, previousClose: 178, currency: 'USD', name: 'Apple Inc.', at: 1 } } }),
}))
const page = await ctx.newPage()
page.on('pageerror', console.log)
await page.goto('http://localhost:4173/menayot/')
await page.screenshot({ path: 'check.png' })
```

Look at the screenshot. RTL problems are visual and raise no errors.

Do not try to validate bidi by comparing a rendered string against the source
string: Hebrew letters paint right to left, so every mixed string looks
"wrong" and the check is useless. What actually breaks is a **numeric run
coming apart** — the currency symbol detaching from its digits, a minus sign
drifting across. Measure each run of digits and its attached neutrals with
`Range.getBoundingClientRect()` and assert it paints contiguously in written
order.

Note: this container's Node needs `NODE_USE_ENV_PROXY=1` to reach the quote
provider; CI does not.

## Known gaps, in rough priority order

0. **Feed the earnings calendar.** The UI is built and waiting; nothing
   produces the file. See "The earnings calendar" above for what was tried and
   the two routes left.
1. **Push when the app is closed.** The headline missing feature, and the only
   one that cannot be built here. It needs a server: somewhere to store push
   subscriptions and VAPID keys, plus a job that checks prices and posts to the
   push endpoints. GitHub Actions can do the sending — Web Push is just a
   signed HTTPS POST — but there is nowhere safe to keep subscriptions, because
   a browser cannot write to GitHub without an exposed token, and the repo is
   public. Cloudflare Workers on the free plan closes it (cron down to a
   minute, free KV or D1, no credit card). Costs the owner one free account.
2. **Price history and a chart** of portfolio value over time. Would need the
   price Action to append to a history file rather than replace it.
3. **Dividends and fees** in the profit calculation.
4. **A way to request a symbol** without editing `universe.json`.
5. **Earnings beyond 45 days**, and past results rather than only the next one.
