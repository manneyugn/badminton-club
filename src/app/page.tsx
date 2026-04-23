import Link from 'next/link'
import { getPlayers } from '@/services/playerService'

export const revalidate = 60

export default async function LeaderboardPage() {
  const players = await getPlayers()

  return (
    <div className="py-6">
      <h1 className="text-2xl font-bold mb-1">Rankings</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
        {players.length} players
      </p>

      {players.length === 0 ? (
        <p className="text-center py-16" style={{ color: 'var(--muted)' }}>
          No players yet.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {players.map((p, i) => {
            const winRate = p.sets_played > 0
              ? Math.round((p.wins / p.sets_played) * 100)
              : 0
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null

            return (
              <Link key={p.player_id} href={`/players/${p.player_id}`}>
                <div className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div className="w-7 text-center text-sm font-mono" style={{ color: 'var(--muted)' }}>
                    {medal ?? `#${i + 1}`}
                  </div>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                    style={{ background: '#14532d', color: 'var(--accent)' }}>
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{p.name}</div>
                    <div className="text-xs" style={{ color: 'var(--muted)' }}>
                      {p.sets_played} sets · {p.wins}W {p.losses}L · {winRate}%
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-lg" style={{ color: 'var(--accent)' }}>
                      {Math.round(p.elo)}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--muted)' }}>ELO</div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
