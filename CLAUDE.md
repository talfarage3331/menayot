# מניות — Project Guide for Claude

Read this first. It tells you what this project is, how it ships, and the
conventions to follow, so a session started from a phone with no prior context
can make a change correctly on the first try.

## What this is

A Hebrew, right-to-left, mobile-first **PWA** for tracking a personal stock
portfolio. Visitors open a public URL, optionally add it to their home screen,
and track holdings that live in their own browser.

**Live URL:** https://talfarage3331.github.io/menayot/

## How the owner works

The owner (Tal) gives instructions from a phone, away from a computer. He does
not run commands, read diffs, or open a terminal. So:

- **Do the whole job yourself** — change the code, build it, verify it, commit,
  push. Never hand back a command for him to run.
- **End every change with the live URL** so he can tap it and check.
- **Verify before claiming success.** Run `npm run build`, and drive the real
  UI with Playwright (see "Verifying" below). Do not say something works
  because the code looks right.
- Prefer finishing over asking. Ask only when a wrong guess would mean
  throwing the work away.

## Stack

- **Vite 8** + **React 19** + **TypeScript**
- **Tailwind CSS v4** via `@tailwindcss/vite`. There is no `tailwind.config.js`;
  design tokens live in the `@theme` block at the top of `src/index.css`.
- **vite-plugin-pwa** for the manifest and service worker.
- No router, no state library, no backend. Keep it that way unless a request
  genuinely needs one.

## Shipping

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds and
publishes to GitHub Pages. A deploy takes roughly a minute. There is nothing
else to do and nothing to configure per change.

`vite.config.ts` sets `base: '/menayot/'` because this is a GitHub Pages
*project* page. **Never hardcode a leading `/` in an asset path** — use
`import.meta.env.BASE_URL` or a path relative to the page, or the asset will
404 in production while working fine locally.

## Layout

```
src/
  types.ts              Shared data shapes (Holding, PortfolioState…)
  lib/
    money.ts            Currency, percent and number formatting; input parsing
    portfolio.ts        Pure calculations: value, profit/loss, allocation
    storage.ts          localStorage read/write, validation, id generation
  hooks/
    usePortfolio.ts     Owns holdings + currency and every action on them
  components/           One component per file, presentational
  App.tsx               Composition and the open/closed state of the edit sheet
```

The split is deliberate: `lib/` is pure and trivially testable, `hooks/` owns
state and side effects, `components/` only render. Keep new code in the layer
where it belongs rather than widening `App.tsx`.

## Conventions

- **Hebrew UI, RTL.** The page is `dir="rtl"`. Any ticker symbol, figure or
  Latin text needs `dir="ltr"` on its element or bidi will scramble it.
- **Currency formatting goes through `formatMoney`**, which strips the hidden
  RTL marks `Intl` injects. Calling `Intl.NumberFormat` directly in a component
  puts the currency symbol on the wrong side. Never do it.
- **Tailwind only.** No CSS files beyond `src/index.css`, no inline `style`
  except for genuinely dynamic values such as a computed bar width or colour.
- **Colour means direction.** `text-up` (green) for gains, `text-down` (red)
  for losses. Surfaces use the `ink` scale.
- **Touch targets are at least 44px tall** — this is used on phones.
- Respect the safe-area insets already applied in `App.tsx` and
  `HoldingForm.tsx`; phones have notches.
- Comments explain *why*, not *what*. Do not narrate the obvious.

## Data

Everything lives in `localStorage` under `menayot.portfolio.v1`. There is no
server and no account, so each visitor's data is their own and never leaves
their device.

If the shape of `PortfolioState` ever changes incompatibly, bump the key to
`v2` and migrate from `v1` in `loadPortfolio` rather than silently dropping
people's data.

## Verifying

```bash
npm run build      # must pass; this is tsc + vite build
npx vite preview --port 4173
```

Then drive the real thing before saying it works:

```js
const { chromium, devices } = require('playwright')
const ctx = await (await chromium.launch({ args: ['--no-sandbox'] }))
  .newContext({ ...devices['iPhone 13'], locale: 'he-IL' })
const page = await ctx.newPage()
page.on('pageerror', console.log)
await page.goto('http://localhost:4173/menayot/')
await page.screenshot({ path: 'check.png' })
```

Look at the screenshot. Check the console for errors. Verify RTL still reads
correctly — it is the thing that breaks most often.

## Known gaps, in rough priority order

These are the obvious next requests. Each is small and self-contained.

1. **Live prices.** Current prices are typed in by hand. Free quote APIs either
   need a key or block browser CORS, so the practical route is a scheduled
   GitHub Action that fetches quotes server-side with a key stored in repo
   secrets and commits a `public/prices.json` the app reads. That keeps the key
   secret and the hosting free. It needs the owner to create a free API key
   (Finnhub or Twelve Data) and add it as a repository secret.
2. **Export / import.** Data is localStorage-only, so clearing the browser
   loses it. A JSON download and upload would be a cheap safety net.
3. **Price history and a chart** of portfolio value over time.
4. **Per-holding currency** with FX conversion. Today the whole portfolio is in
   one currency.
5. **Dividends and fees** in the profit calculation.
