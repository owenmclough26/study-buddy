import { useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { pageview, resetAnalytics } from '../lib/analytics'
import { useData } from '../lib/store'
import { supabase } from '../lib/repo'
import { Coin, Flame, Icon, type IconName } from './Icon'

const TABS: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Home', icon: 'home' },
  { to: '/todos', label: 'To-do', icon: 'list' },
  { to: '/calendar', label: 'Calendar', icon: 'calendar' },
  { to: '/rooms', label: 'Rooms', icon: 'door' },
  { to: '/settings', label: 'Settings', icon: 'sliders' },
]

export function Layout() {
  const { state, actions, mode } = useData()
  const b = state.buddy!
  const streak = state.profile?.streak ?? 0
  const { pathname } = useLocation()
  useEffect(() => pageview(pathname), [pathname])
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 border-b-[1.5px] border-line bg-cream/90 pt-[env(safe-area-inset-top)] backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 sm:gap-6">
          <NavLink to="/" className="flex shrink-0 items-center gap-2">
            <img src="/favicon.svg" alt="" className="h-7 w-7" />
            <span className="font-display text-xl font-semibold tracking-tight">study buddy</span>
          </NavLink>

          {/* top tabs on laptops; phones get the bottom bar below */}
          <nav className="hidden flex-1 gap-1 sm:flex">
            {TABS.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.to === '/'}
                title={t.label}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-sm font-bold transition-colors ${
                    isActive ? 'bg-paper text-ink shadow-[0_2px_0_var(--color-line)] ring-[1.5px] ring-line' : 'text-ink/55 hover:text-ink'
                  }`
                }
              >
                <Icon name={t.icon} className="h-[18px] w-[18px]" />
                <span className="hidden md:inline">{t.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-3 text-sm font-extrabold sm:ml-0">
            <span title={`${streak}-day streak`} className="flex items-center gap-1">
              <Flame lit={streak > 0} className="h-[18px] w-[18px]" />
              {streak}
            </span>
            <span title="Coins" className="flex items-center gap-1">
              <Coin className="h-[18px] w-[18px]" />
              {b.coins}
            </span>
          </div>
        </div>
      </header>

      {mode === 'local' && (
        <div className="border-b border-line bg-mustard-soft px-4 py-1.5 text-center text-xs font-semibold text-ink/70">
          Guest mode: everything is saved in this browser only.
        </div>
      )}
      {state.error && (
        <div className="flex items-center justify-center gap-3 bg-accent-soft px-4 py-2 text-sm text-accent-dark">
          <span>Couldn't save: {state.error}</span>
          <button className="font-bold underline" onClick={actions.clearError}>Dismiss</button>
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-6 sm:py-8">
        <Outlet />
      </main>

      {/* phone tab bar, like a native app */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t-[1.5px] border-line bg-cream/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm sm:hidden"
        aria-label="Main"
      >
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 pb-2 pt-2.5 text-[11px] font-extrabold transition-colors ${isActive ? 'text-accent' : 'text-ink/45'}`
            }
          >
            <Icon name={t.icon} className="h-[22px] w-[22px]" />
            {t.label}
          </NavLink>
        ))}
      </nav>

      {supabase && (
        <footer className="-mt-16 pb-24 text-center sm:mt-0 sm:pb-5">
          <button className="text-xs font-bold text-ink/35 hover:text-ink/60" onClick={() => {
              resetAnalytics()
              void supabase!.auth.signOut()
            }}>
            Sign out
          </button>
        </footer>
      )}

      {state.toast && (
        <div className="anim-pop fixed bottom-24 left-1/2 z-[70] sm:bottom-5 -translate-x-1/2 rounded-2xl border-[1.5px] border-line bg-paper px-4 py-2.5 text-sm font-bold text-ink shadow-[0_3px_0_var(--color-line),0_12px_30px_-12px_rgb(90_55_25/.4)]">
          {state.toast}
        </div>
      )}
    </div>
  )
}
