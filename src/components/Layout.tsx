import { NavLink, Outlet } from 'react-router-dom'
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
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 border-b-[1.5px] border-line bg-cream/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 sm:gap-6">
          <NavLink to="/" className="flex shrink-0 items-center gap-2">
            <img src="/favicon.svg" alt="" className="h-7 w-7" />
            <span className="hidden font-display text-xl font-semibold tracking-tight sm:inline">study buddy</span>
          </NavLink>

          <nav className="flex flex-1 justify-center gap-0.5 sm:justify-start sm:gap-1">
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

          <div className="flex shrink-0 items-center gap-3 text-sm font-extrabold">
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

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">
        <Outlet />
      </main>

      {supabase && (
        <footer className="pb-5 text-center">
          <button className="text-xs font-bold text-ink/35 hover:text-ink/60" onClick={() => supabase!.auth.signOut()}>
            Sign out
          </button>
        </footer>
      )}

      {state.toast && (
        <div className="anim-pop fixed bottom-5 left-1/2 z-[70] -translate-x-1/2 rounded-2xl border-[1.5px] border-line bg-paper px-4 py-2.5 text-sm font-bold text-ink shadow-[0_3px_0_var(--color-line),0_12px_30px_-12px_rgb(90_55_25/.4)]">
          {state.toast}
        </div>
      )}
    </div>
  )
}
