import { Navigate, useParams } from 'react-router-dom'
import { RoomShell } from './RoomShell'
import { ChoresTools, HomeworkTools, ReadingTools, StudyTools, THEMES } from './rooms'
import { RelaxRoom } from './RelaxRoom'

export function RoomPage() {
  const { room } = useParams()
  switch (room) {
    case 'study':
      return <RoomShell theme={THEMES.study}>{(t) => <StudyTools task={t} />}</RoomShell>
    case 'homework':
      return <RoomShell theme={THEMES.homework}>{(t) => <HomeworkTools task={t} />}</RoomShell>
    case 'reading':
      return <RoomShell theme={THEMES.reading}>{(t) => <ReadingTools task={t} />}</RoomShell>
    case 'chores':
      return <RoomShell theme={THEMES.chores}>{() => <ChoresTools />}</RoomShell>
    case 'relax':
      return <RelaxRoom />
    default:
      return <Navigate to="/rooms" replace />
  }
}
