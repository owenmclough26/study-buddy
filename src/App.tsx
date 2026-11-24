import { useMemo } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { cloudRepo, localRepo, supabase } from './lib/repo'
import { DataProvider, useData } from './lib/store'
import { AuthGate } from './features/auth/AuthGate'
import { Layout } from './components/Layout'
import { HomePage } from './features/buddy/HomePage'
import { BuddyPicker } from './features/buddy/BuddyPicker'
import { CalendarPage } from './features/calendar/CalendarPage'
import { TodosPage } from './features/tasks/TodosPage'
import { RoomsPage } from './features/rooms/RoomsPage'
import { RoomPage } from './features/rooms/RoomPage'
import { SettingsPage } from './features/schedule/SettingsPage'
import { MemoriesPage } from './features/buddy/MemoriesPage'

function Routed() {
  const { state } = useData()
  if (state.loading) {
    return <div className="grid h-full place-items-center text-lg font-bold text-black/40">Waking up your buddy…</div>
  }
  if (!state.buddy) return <BuddyPicker />
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="todos" element={<TodosPage />} />
        <Route path="rooms" element={<RoomsPage />} />
        <Route path="rooms/:room" element={<RoomPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="memories" element={<MemoriesPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

const cloud = supabase ? cloudRepo(supabase) : null

export default function App() {
  const local = useMemo(() => localRepo(), [])
  if (!cloud) {
    // No Supabase keys yet: guest mode stores everything in this browser.
    return (
      <DataProvider repo={local} userId="local">
        <Routed />
      </DataProvider>
    )
  }
  return (
    <AuthGate>
      {(userId) => (
        <DataProvider key={userId} repo={cloud} userId={userId}>
          <Routed />
        </DataProvider>
      )}
    </AuthGate>
  )
}
