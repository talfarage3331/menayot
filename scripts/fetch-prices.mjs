#!/usr/bin/env node
/**
 * Fetches quotes for every symbol in universe.json and writes prices.json.
 *
 * Runs on a GitHub Actions runner, not in a browser, which is the whole point:
 * the quote endpoint sends no CORS headers, so a page cannot call it directly.
 * The result is published to the `data` branch and served from
 * raw.githubusercontent.com, which does send them.
 *
 * Usage: node scripts/fetch-prices.mjs <output-path>
 */

import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))

/** Yahoo's batch endpoint rejects more than 20 symbols in one request. */
const BATCH_SIZE = 20
const RETRIES = 3
const TIMEOUT_MS = 20_000

async function main() {
  const outputPath = process.argv[2]
  if (!outputPath) {
    console.error('usage: node scripts/fetch-prices.mjs <output-path>')
    process.exit(1)
  }

  const universe = JSON.parse(await readFile(join(HERE, 'universe.json'), 'utf8'))
  const symbols = universe.symbols

  const quotes = {}
  let failedBatches = 0

  for (const batch of chunk(symbols, BATCH_SIZE)) {
    try {
      Object.assign(quotes, await fetchBatch(batch))
    } catch (error) {
      failedBatches += 1
      console.error(`batch failed (${batch[0]}…): ${error.message}`)
    }
  }

  const found = Object.keys(quotes).length
  console.error(`fetched ${found}/${symbols.length} symbols, ${failedBatches} failed batches`)

  // A run that got almost nothing is a broken run. Failing loudly beats
  // publishing a near-empty file over yesterday's good prices.
  if (found < symbols.length / 2) {
    throw new Error(`only ${found} of ${symbols.length} symbols resolved; refusing to publish`)
  }

  const payload = {
    updatedAt: new Date().toISOString(),
    count: found,
    quotes,
  }

  await writeFile(outputPath, JSON.stringify(payload) + '\n', 'utf8')
  console.error(`wrote ${outputPath}`)
}

async function fetchBatch(symbols) {
  const url =
    'https://query1.finance.yahoo.com/v7/finance/spark' +
    `?symbols=${symbols.map(encodeURIComponent).join(',')}&range=1d&interval=1d`

  const body = await getJsonWithRetry(url)
  const results = body?.spark?.result ?? []

  const quotes = {}
  for (const entry of results) {
    const meta = entry?.response?.[0]?.meta
    if (!meta?.symbol || typeof meta.regularMarketPrice !== 'number') continue

    quotes[meta.symbol] = {
      price: round(meta.regularMarketPrice),
      previousClose: round(meta.chartPreviousClose),
      currency: meta.currency ?? 'USD',
      name: meta.shortName ?? meta.longName ?? '',
      // Seconds since the epoch, as Yahoo reports it.
      at: meta.regularMarketTime ?? null,
    }
  }
  return quotes
}

async function getJsonWithRetry(url) {
  let lastError
  for (let attempt = 1; attempt <= RETRIES; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { 'user-agent': 'menayot-price-feed (+https://github.com/talfarage3331/menayot)' },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return await response.json()
    } catch (error) {
      lastError = error
      if (attempt < RETRIES) await sleep(attempt * 1500)
    }
  }
  throw lastError
}

function chunk(items, size) {
  const out = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

function round(value) {
  return typeof value === 'number' ? Math.round(value * 10000) / 10000 : null
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
