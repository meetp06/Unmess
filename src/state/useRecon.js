import { useContext } from 'react'
import { ReconContext } from './ReconContext.jsx'

export function useRecon() {
  const ctx = useContext(ReconContext)
  if (!ctx) throw new Error('useRecon must be used inside <ReconProvider>')
  return ctx
}
