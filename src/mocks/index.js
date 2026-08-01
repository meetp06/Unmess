import { MOCK_OPTIONS } from '../services/env.js'
import { ApiError } from '../services/http.js'
import { DEFAULT_ROW_COUNT, getMockReport } from './fixtures.js'

/**
 * Mock implementations of the three endpoints. Same signatures, same promise
 * shapes, same failure type as the real thing — so nothing downstream can tell
 * the difference except the data itself.
 */

function delay(ms) {
  const scaled = MOCK_OPTIONS.slow ? ms * 4 : ms
  return new Promise((resolve) => setTimeout(resolve, scaled))
}

/** ?fail=<step> forces the error path so the retry UI is demoable on demand. */
function maybeFail(step, message) {
  if (MOCK_OPTIONS.fail === step) {
    throw new ApiError(message, { status: 502, url: `mock://${step}` })
  }
}

export async function uploadBankStatement(file) {
  await delay(450)
  maybeFail(
    'upload',
    'Bank statement rejected: column "amount" not found in header row (mock failure via ?fail=upload)',
  )
  return {
    filename: file?.name ?? 'statement.csv',
    size: file?.size ?? 0,
    received: true,
  }
}

export async function uploadReceipts(files) {
  const list = Array.from(files ?? [])
  await delay(300 + list.length * 40)
  maybeFail(
    'receipts',
    `OCR worker unavailable while processing ${list.length} receipt(s) (mock failure via ?fail=receipts)`,
  )
  return { count: list.length, received: true }
}

export async function runReconciliation() {
  await delay(900)
  maybeFail(
    'reconcile',
    'Reconciliation engine timed out after 30s (mock failure via ?fail=reconcile)',
  )

  const { summary, rows } = getMockReport({
    rows: MOCK_OPTIONS.rowCount ?? DEFAULT_ROW_COUNT,
  })

  // Returned as fresh objects so a consumer that mutates the result cannot
  // corrupt the memoised fixture for the rest of the session.
  return { summary: { ...summary }, rows: rows.slice() }
}
