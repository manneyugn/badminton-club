import { findAllSets } from '@/lib/sheets/repository'
import { findAllPlayers } from '@/lib/sheets/repository'
import SetHistoryList from '@/components/SetHistoryList'

export const revalidate = 30

export default async function SetsPage() {
  const [sets, players] = await Promise.all([findAllSets(), findAllPlayers()])
  const playerMap = Object.fromEntries(players.map(p => [p.player_id, p.name]))
  const confirmed = sets.filter(s => s.status === 'confirmed').reverse()

  return (
    <div className="py-6">
      <h1 className="text-2xl font-bold mb-1">History</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
        {confirmed.length} sets recorded
      </p>
      <SetHistoryList sets={confirmed} playerMap={playerMap} />
    </div>
  )
}
