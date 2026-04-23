import { getPlayers } from '@/services/playerService'
import HandicapWidget from '@/components/HandicapWidget'

export default async function HandicapPage() {
  const players = await getPlayers()
  return (
    <div className="py-6">
      <h1 className="text-2xl font-bold mb-1">Handicap</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
        Predict point head-start before a set
      </p>
      <HandicapWidget players={players} />
    </div>
  )
}
