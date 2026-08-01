import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import Header from './Header.jsx'

/**
 * Sidebar responsiveness, in one place:
 *   ≥1024px  240px sidebar with labels
 *   768–1023 64px icon rail
 *   <768px   hidden, slides in over a backdrop from the header toggle
 */
export default function AppShell() {
  const [navOpen, setNavOpen] = useState(false)
  const { pathname } = useLocation()

  // Navigating on mobile should close the drawer, not leave it covering the page.
  useEffect(() => setNavOpen(false), [pathname])

  useEffect(() => {
    if (!navOpen) return
    const onKey = (e) => e.key === 'Escape' && setNavOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navOpen])

  return (
    <div className="min-h-screen bg-base">
      {/* Static sidebar: rail at md, full width at lg. Hidden below md. */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[var(--rail-w)] md:block lg:w-[var(--sidebar-w)]">
        <Sidebar />
      </aside>

      {/* Off-canvas sidebar, below md only. */}
      {navOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setNavOpen(false)}
            className="absolute inset-0 bg-black/60"
          />
          <aside className="absolute inset-y-0 left-0 w-[var(--sidebar-w)] max-w-[80vw]">
            {/* Always labelled here: the drawer has the room, and an icon-only
                overlay would be a worse experience than the rail it replaces. */}
            <Sidebar expanded onNavigate={() => setNavOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-h-screen flex-col md:pl-[var(--rail-w)] lg:pl-[var(--sidebar-w)]">
        <Header onOpenNav={() => setNavOpen(true)} />
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
