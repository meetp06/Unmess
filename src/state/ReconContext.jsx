import { createContext, useCallback, useMemo, useRef, useState } from 'react'
import * as api from '../services/api.js'

export const ReconContext = createContext(null)

/**
 * Phases of the one and only async flow in the app.
 *   idle       nothing has run yet
 *   uploading  bank statement / receipts are being sent
 *   running    reconciliation is in flight
 *   ready      a report is on screen
 *   error      the last attempt failed; `error` holds the real message
 */
export const PHASE = {
  idle: 'idle',
  uploading: 'uploading',
  running: 'running',
  ready: 'ready',
  error: 'error',
}

let receiptSeq = 0

export function ReconProvider({ children }) {
  const [csv, setCsv] = useState(null) // { file, name, size, rowCount, error }
  const [receipts, setReceipts] = useState([]) // [{ id, file, name, size, url }]
  const [report, setReport] = useState(null)
  const [phase, setPhase] = useState(PHASE.idle)
  const [step, setStep] = useState(null) // human label for the in-flight step
  const [error, setError] = useState(null)

  // Guards against a double-click firing two pipelines at once.
  const inFlight = useRef(false)

  const attachCsv = useCallback((entry) => {
    setCsv(entry)
  }, [])

  const clearCsv = useCallback(() => setCsv(null), [])

  const addReceipts = useCallback((files) => {
    setReceipts((prev) => {
      const existing = new Set(prev.map((r) => `${r.name}:${r.size}`))
      const next = [...prev]
      for (const file of files) {
        const key = `${file.name}:${file.size}`
        if (existing.has(key)) continue // dropping the same folder twice is common
        existing.add(key)
        next.push({
          id: `r${++receiptSeq}`,
          file,
          name: file.name,
          size: file.size,
          url: URL.createObjectURL(file),
        })
      }
      return next
    })
  }, [])

  const removeReceipt = useCallback((id) => {
    setReceipts((prev) => {
      const target = prev.find((r) => r.id === id)
      if (target?.url) URL.revokeObjectURL(target.url)
      return prev.filter((r) => r.id !== id)
    })
  }, [])

  const clearReceipts = useCallback(() => {
    setReceipts((prev) => {
      prev.forEach((r) => r.url && URL.revokeObjectURL(r.url))
      return []
    })
  }, [])

  /**
   * The whole pipeline behind one button: upload the statement, upload the
   * receipts, then reconcile. Keeping it in one action means one error surface
   * and one retry, instead of three half-finished states to reason about.
   */
  const run = useCallback(async () => {
    if (inFlight.current) return
    if (!csv?.file || receipts.length === 0) return

    inFlight.current = true
    setError(null)
    setPhase(PHASE.uploading)

    try {
      setStep('Uploading bank statement')
      await api.uploadBankStatement(csv.file)

      setStep(`Uploading ${receipts.length} receipt${receipts.length === 1 ? '' : 's'}`)
      await api.uploadReceipts(receipts.map((r) => r.file))

      setPhase(PHASE.running)
      setStep('Matching receipts to transactions')
      const result = await api.runReconciliation()

      setReport(result)
      setPhase(PHASE.ready)
      setStep(null)
    } catch (err) {
      // The real message reaches the screen verbatim — no "Something went wrong".
      setError(err)
      setPhase(PHASE.error)
      setStep(null)
    } finally {
      inFlight.current = false
    }
  }, [csv, receipts])

  const dismissError = useCallback(() => {
    setError(null)
    setPhase(report ? PHASE.ready : PHASE.idle)
  }, [report])

  /** Why the Run button is disabled, in the user's words. Empty = it is enabled. */
  const blockers = useMemo(() => {
    const list = []
    if (!csv?.file) list.push('a bank statement CSV')
    if (receipts.length === 0) list.push('at least one receipt image')
    return list
  }, [csv, receipts.length])

  const busy = phase === PHASE.uploading || phase === PHASE.running

  const value = useMemo(
    () => ({
      csv,
      receipts,
      report,
      phase,
      step,
      error,
      busy,
      blockers,
      canRun: blockers.length === 0 && !busy,
      attachCsv,
      clearCsv,
      addReceipts,
      removeReceipt,
      clearReceipts,
      run,
      retry: run,
      dismissError,
    }),
    [
      csv,
      receipts,
      report,
      phase,
      step,
      error,
      busy,
      blockers,
      attachCsv,
      clearCsv,
      addReceipts,
      removeReceipt,
      clearReceipts,
      run,
      dismissError,
    ],
  )

  return <ReconContext.Provider value={value}>{children}</ReconContext.Provider>
}
