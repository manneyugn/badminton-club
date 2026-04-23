import type { SetRow } from '@/types'

interface Props {
  sets: SetRow[]
  playerMap: Record<string, string>
  highlightPlayerId?: string
}

function teamName(ids: string[], playerMap: Record<string, string>) {
  return ids.filter(Boolean).map(id => playerMap[id] ?? '?').join(' & ')
}

export default function SetHistoryList({ sets, playerMap, highlightPlayerId }: Props) {
  if (sets.length === 0) {
    return <p className="text-sm py-4 text-center" style={{ color: 'var(--muted)' }}>No sets yet.</p>
  }

  return (
    <div className="flex flex-col gap-2">
      {sets.map(s => {
        const aIds = [s.team_a_p1, s.team_a_p2].filter(Boolean)
        const bIds = [s.team_b_p1, s.team_b_p2].filter(Boolean)
        const aWon = s.winner === 'team_a'
        const highlightA = highlightPlayerId && aIds.includes(highlightPlayerId)
        const highlightB = highlightPlayerId && bIds.includes(highlightPlayerId)
        const myWin = (highlightA && aWon) || (highlightB && !aWon)

        return (
          <div key={s.set_id} className="rounded-xl p-3"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 text-sm">
              {/* Team A */}
              <div className={`flex-1 min-w-0 ${aWon ? 'font-semibold' : 'opacity-60'}`}>
                <span className="truncate block">{teamName(aIds, playerMap)}</span>
              </div>

              {/* Score */}
              <div className="shrink-0 flex items-center gap-1 font-mono font-bold text-base">
                <span style={{ color: aWon ? 'var(--accent)' : 'var(--foreground)' }}>{s.score_a}</span>
                <span style={{ color: 'var(--muted)' }}>–</span>
                <span style={{ color: !aWon ? 'var(--accent)' : 'var(--foreground)' }}>{s.score_b}</span>
              </div>

              {/* Team B */}
              <div className={`flex-1 min-w-0 text-right ${!aWon ? 'font-semibold' : 'opacity-60'}`}>
                <span className="truncate block">{teamName(bIds, playerMap)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-1">
              <span className="text-xs" style={{ color: 'var(--muted)' }}>
                {s.match_type} · {s.game_points}pt
              </span>
              <div className="flex items-center gap-2">
                {highlightPlayerId && (
                  <span className="text-xs font-semibold" style={{ color: myWin ? 'var(--accent)' : '#ef4444' }}>
                    {myWin ? 'W' : 'L'}
                  </span>
                )}
                <span className="text-xs" style={{ color: 'var(--muted)' }}>
                  {new Date(s.played_at).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
