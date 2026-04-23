import { notFound } from 'next/navigation'
import { getPlayer, getEloHistory } from '@/services/playerService'
import { findAllSets } from '@/lib/sheets/repository'
import EloChart from '@/components/EloChart'
import SetHistoryList from '@/components/SetHistoryList'
import { findAllPlayers } from '@/lib/sheets/repository'

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [player, history, allSets, allPlayers] = await Promise.all([
    getPlayer(id),
    getEloHistory(id),
    findAllSets(),
    findAllPlayers(),
  ])

  if (!player) notFound()

  const playerMap = Object.fromEntries(allPlayers.map(p => [p.player_id, p.name]))
  const winRate = player.sets_played > 0
    ? Math.round((player.wins / player.sets_played) * 100)
    : 0

  const playerSets = allSets
    .filter(s =>
      s.status === 'confirmed' &&
      [s.team_a_p1, s.team_a_p2, s.team_b_p1, s.team_b_p2].includes(id)
    )
    .reverse()
    .slice(0, 20)

  const chartData = history.map(h => ({
    date: new Date(h.recorded_at).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }),
    elo: h.elo_after,
  }))

  return (
    <div className="py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold shrink-0"
          style={{ background: '#14532d', color: 'var(--accent)' }}>
          {player.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{player.name}</h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            {player.sets_played} sets · {winRate}% win rate
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {[
          { label: 'ELO', value: Math.round(player.elo), accent: true },
          { label: 'Wins', value: player.wins },
          { label: 'Losses', value: player.losses },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl p-3 text-center"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="text-2xl font-bold" style={{ color: stat.accent ? 'var(--accent)' : undefined }}>
              {stat.value}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ELO chart */}
      {chartData.length > 1 && (
        <div className="rounded-xl p-4 mb-6"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-sm font-semibold mb-3">ELO History</p>
          <EloChart data={chartData} />
        </div>
      )}

      {/* Recent sets */}
      <p className="text-sm font-semibold mb-3">Recent Sets</p>
      {playerSets.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--muted)' }}>No sets yet.</p>
      ) : (
        <SetHistoryList sets={playerSets} playerMap={playerMap} highlightPlayerId={id} />
      )}
    </div>
  )
}
