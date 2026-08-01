import { USE_MOCKS } from './env.js'
import { http } from './http.js'
import * as mock from '../mocks/index.js'

/**
 * The only network layer in the app. No component imports fetch; no component
 * imports fixtures. Flipping VITE_USE_MOCKS swaps the data source here and
 * changes nothing else about how the app behaves.
 */

/** POST /api/bank-statement — multipart, field name `file`. */
export function uploadBankStatement(file) {
  if (USE_MOCKS) return mock.uploadBankStatement(file)

  const body = new FormData()
  body.append('file', file, file.name)
  return http('/api/bank-statement', { method: 'POST', body })
}

/** POST /api/receipts — multipart, repeated field name `files`. */
export function uploadReceipts(files) {
  if (USE_MOCKS) return mock.uploadReceipts(files)

  const body = new FormData()
  for (const file of files) body.append('files', file, file.name)
  return http('/api/receipts', { method: 'POST', body })
}

/** POST /api/reconcile — resolves to { summary, rows } per the contract. */
export function runReconciliation() {
  if (USE_MOCKS) return mock.runReconciliation()

  return http('/api/reconcile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  })
}
