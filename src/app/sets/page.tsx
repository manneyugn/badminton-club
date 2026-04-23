import { findAllSets, findAllPlayers } from '@/lib/sheets/repository'
import SetsPageClient from '@/components/SetsPageClient'

export default async function SetsPage() {
  const [sets, players] = await Promise.all([findAllSets(), findAllPlayers()])
  const playerMap = Object.fromEntries(players.map(p => [p.player_id, p.name]))
  const confirmed = sets.filter(s => s.status === 'confirmed').reverse()

  return (
    <div className="py-6">
      <h1 className="text-2xl font-bold mb-1">History</h1>
      <SetsPageClient initialSets={confirmed} playerMap={playerMap} />
    </div>
  )
}
