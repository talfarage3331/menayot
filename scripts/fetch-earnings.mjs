#!/usr/bin/env node
/**
 * Builds the upcoming-earnings file: when each tracked company next reports.
 *
 * Nasdaq publishes its earnings calendar one day at a time and asks for no key,
 * so this walks forward a few weeks and keeps the first appearance of each
 * symbol in the universe. Runs once a day — earnings dates do not move by the
 * minute, and a daily pass is a few dozen requests rather than thousands.
 *
 * Usage: node scripts/fetch-earnings.mjs <output-path> [days-ahead]
 */

import { readFile, writeFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const run = promisify(execFile)

const HERE = dirname(fileURLToPath(import.meta.url))

const DEFAULT_DAYS = 45
const TIMEOUT_MS = 20_000
const RETRIES = 3
/**
 * This is a courtesy source with no API key, so the calls are spaced out.
 * Firing them back to back got requests refused within a few minutes.
 */
const DELAY_MS = 1200

async function main() {
  const outputPath = process.argv[2]
  const daysAhead = Number.parseInt(process.argv[3] ?? '', 10) || DEFAULT_DAYS
  if (!outputPath) {
    console.error('usage: node scripts/fetch-earnings.mjs <output-path> [days-ahead]')
    process.exit(1)
  }

  const universe = JSON.parse(await readFile(join(HERE, 'universe.json'), 'utf8'))
  const tracked = new Set(universe.symbols)

  /** symbol -> soonest upcoming report. First date wins, so never overwrite. */
  const earnings = {}
  let daysFetched = 0
  let daysFailed = 0

  for (const date of upcomingDates(daysAhead)) {
    try {
      const rows = await fetchDay(date)
      daysFetched += 1

      for (const row of rows) {
        const symbol = (row.symbol ?? '').trim().toUpperCase()
        if (!symbol || !tracked.has(symbol) || earnings[symbol]) continue

        earnings[symbol] = {
          date,
          // "time-pre-market" | "time-after-hours" | "time-not-supplied"
          when: normaliseTime(row.time),
          epsForecast: cleanMoney(row.epsForecast),
          lastYearEps: cleanMoney(row.lastYearEPS),
          fiscalQuarterEnding: row.fiscalQuarterEnding || null,
          marketCap: parseMarketCap(row.marketCap),
        }
      }
    } catch (error) {
      daysFailed += 1
      console.error(`${date} failed: ${error.message}`)
    }

    await sleep(DELAY_MS)
  }

  const found = Object.keys(earnings).length
  console.error(
    `fetched ${daysFetched} days (${daysFailed} failed), ` +
      `${found} tracked symbols report in the next ${daysAhead} days`,
  )

  // A run where nearly every day failed would publish an empty calendar over a
  // good one. Better to fail the job and keep yesterday's file.
  if (daysFetched < daysAhead / 2) {
    throw new Error(`only ${daysFetched} of ${daysAhead} days fetched; refusing to publish`)
  }

  await writeFile(
    outputPath,
    JSON.stringify({
      updatedAt: new Date().toISOString(),
      daysAhead,
      count: found,
      earnings,
    }) + '\n',
    'utf8',
  )
  console.error(`wrote ${outputPath}`)
}

/** ISO dates from today forward, as Nasdaq's calendar expects them. */
function* upcomingDates(days) {
  const today = new Date()
  for (let i = 0; i < days; i += 1) {
    const date = new Date(today)
    date.setUTCDate(today.getUTCDate() + i)
    const day = date.getUTCDay()
    // The calendar is empty at weekends; skip the requests entirely.
    if (day === 0 || day === 6) continue
    yield date.toISOString().slice(0, 10)
  }
}

/**
 * Fetched with curl rather than `fetch`.
 *
 * This host drops Node's HTTP client mid-handshake — every request dies with
 * "other side closed" after 30 seconds — while curl gets a 200 in about two.
 * curl is present on every GitHub runner, so shelling out is the reliable
 * option here. The User-Agent identifies this client honestly; it does not
 * pretend to be a browser.
 */
async function fetchDay(date) {
  const url = `https://api.nasdaq.com/api/calendar/earnings?date=${date}`

  let lastError
  for (let attempt = 1; attempt <= RETRIES; attempt += 1) {
    try {
      const { stdout } = await run(
        'curl',
        [
          '--silent',
          '--show-error',
          '--fail',
          // The host intermittently aborts HTTP/2 streams with INTERNAL_ERROR.
          // HTTP/1.1 is both reliable here and noticeably faster.
          '--http1.1',
          '--max-time',
          String(Math.round(TIMEOUT_MS / 1000)),
          '--user-agent',
          'menayot-earnings-feed (+https://github.com/talfarage3331/menayot)',
          '--header',
          'Accept: application/json',
          url,
        ],
        { maxBuffer: 16 * 1024 * 1024 },
      )

      const body = JSON.parse(stdout)
      return body?.data?.rows ?? []
    } catch (error) {
      lastError = error
      if (attempt < RETRIES) await sleep(attempt * 2500)
    }
  }
  throw lastError
}

function normaliseTime(value) {
  if (typeof value !== 'string') return 'unknown'
  if (value.includes('pre-market')) return 'pre'
  if (value.includes('after-hours')) return 'post'
  return 'unknown'
}

/** "$2.41" or "($0.32)" -> 2.41 / -0.32. Parentheses mean negative. */
function cleanMoney(value) {
  if (typeof value !== 'string' || value.trim() === '') return null
  const negative = value.includes('(')
  const number = Number.parseFloat(value.replace(/[^\d.]/g, ''))
  if (!Number.isFinite(number)) return null
  return negative ? -number : number
}

/** "$159,052,972,000" -> 159052972000 */
function parseMarketCap(value) {
  if (typeof value !== 'string') return null
  const number = Number.parseFloat(value.replace(/[^\d.]/g, ''))
  return Number.isFinite(number) && number > 0 ? number : null
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
