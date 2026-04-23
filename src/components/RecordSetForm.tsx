'use client'
import { useState } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import type { PlayerRow } from '@/types'

const btn = (active: boolean) =>
  `flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${active ? 'text-black' : 'opacity-50'}`

export default function RecordSetForm({ players }: { players: PlayerRow[] }) {
  const { data: session } = useSession()
  const router = useRouter()

  const [matchType, setMatchType] = useState<'singles' | 'doubles'>('singles')
  const [gamePoints, setGamePoints] = useState<15 | 21>(21)
  const [teamA, setTeamA] = useState(['', ''])
  const [teamB, setTeamB] = useState(['', ''])
  const [scoreA, setScoreA] = useState('')
  const [scoreB, setScoreB] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const playerCount = matchType === 'singles' ? 1 : 2

  const winner = (() => {
    const a = parseInt(scoreA), b = parseInt(scoreB)
    if (isNaN(a) || isNaN(b)) return null
    if (a >= gamePoints && a > b) return 'team_a'
    if (b >= gamePoints && b > a) return 'team_b'
    return null
  })()

  const valid =
    teamA.slice(0, playerCount).every(Boolean) &&
    teamB.slice(0, playerCount).every(Boolean) &&
    winner !== null &&
    new Set([...teamA.slice(0, playerCount), ...teamB.slice(0, playerCount)]).size === playerCount * 2

  async function submit() {
    if (!valid) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          match_type: matchType,
          team_a_player_ids: teamA.slice(0, playerCount),
          team_b_player_ids: teamB.slice(0, playerCount),
          score_a: parseInt(scoreA),
          score_b: parseInt(scoreB),
          game_points: gamePoints,
          winner,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      router.push('/sets')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return (
      <div className="text-center py-16">
        <p className="mb-4" style={{ color: 'var(--muted)' }}>Sign in to record sets</p>
        <button onClick={() => signIn('google')}
          className="px-6 py-3 rounded-xl font-semibold text-black"
          style={{ background: 'var(--accent)' }}>
          Sign in with Google
        </button>
      </div>
    )
  }

  const select = (value: string, onChange: (v: string) => void, exclude: string[]) => (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full p-3 rounded-xl text-sm appearance-none"
      style={{ background: 'var(--border)', color: value ? 'var(--foreground)' : 'var(--muted)', border: '1px solid var(--border)' }}>
      <option value="">Select player</option>
      {players.filter(p => !exclude.includes(p.player_id) || p.player_id === value).map(p => (
        <option key={p.player_id} value={p.player_id}>{p.name} ({Math.round(p.elo)})</option>
      ))}
    </select>
  )

  const allSelected = [...teamA.slice(0, playerCount), ...teamB.slice(0, playerCount)].filter(Boolean)

  return (
    <div className="flex flex-col gap-5">
      {/* Match type */}
      <div>
        <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Type</p>
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--surface)' }}>
          {(['singles', 'doubles'] as const).map(t => (
            <button key={t} onClick={() => { setMatchType(t); setTeamA(['','']); setTeamB(['','']) }}
              className={btn(matchType === t)}
              style={{ background: matchType === t ? 'var(--accent)' : 'transparent' }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Game points */}
      <div>
        <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Game to</p>
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--surface)' }}>
          {([15, 21] as const).map(pts => (
            <button key={pts} onClick={() => setGamePoints(pts)}
              className={btn(gamePoints === pts)}
              style={{ background: gamePoints === pts ? 'var(--accent)' : 'transparent' }}>
              {pts} pts
            </button>
          ))}
        </div>
      </div>

      {/* Players */}
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Team A</p>
          <div className="flex flex-col gap-2">
            {select(teamA[0], v => setTeamA([v, teamA[1]]), allSelected.filter(x => x !== teamA[0]))}
            {matchType === 'doubles' && select(teamA[1], v => setTeamA([teamA[0], v]), allSelected.filter(x => x !== teamA[1]))}
          </div>
        </div>

        <div className="text-center text-sm font-bold" style={{ color: 'var(--muted)' }}>vs</div>

        <div>
          <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Team B</p>
          <div className="flex flex-col gap-2">
            {select(teamB[0], v => setTeamB([v, teamB[1]]), allSelected.filter(x => x !== teamB[0]))}
            {matchType === 'doubles' && select(teamB[1], v => setTeamB([teamB[0], v]), allSelected.filter(x => x !== teamB[1]))}
          </div>
        </div>
      </div>

      {/* Score */}
      <div>
        <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Score</p>
        <div className="flex items-center gap-3">
          <input type="number" min="0" max="30" value={scoreA}
            onChange={e => setScoreA(e.target.value)} placeholder="A"
            className="flex-1 p-3 rounded-xl text-center text-xl font-bold"
            style={{ background: 'var(--surface)', border: `1px solid ${winner === 'team_a' ? 'var(--accent)' : 'var(--border)'}`, color: 'var(--foreground)' }} />
          <span className="text-lg font-bold" style={{ color: 'var(--muted)' }}>—</span>
          <input type="number" min="0" max="30" value={scoreB}
            onChange={e => setScoreB(e.target.value)} placeholder="B"
            className="flex-1 p-3 rounded-xl text-center text-xl font-bold"
            style={{ background: 'var(--surface)', border: `1px solid ${winner === 'team_b' ? 'var(--accent)' : 'var(--border)'}`, color: 'var(--foreground)' }} />
        </div>
        {winner && (
          <p className="text-xs text-center mt-2" style={{ color: 'var(--accent)' }}>
            Team {winner === 'team_a' ? 'A' : 'B'} wins
          </p>
        )}
      </div>

      {error && <p className="text-sm text-red-400 text-center">{error}</p>}

      <button onClick={submit} disabled={!valid || loading}
        className="w-full py-4 rounded-xl font-bold text-black transition-opacity disabled:opacity-40"
        style={{ background: 'var(--accent)' }}>
        {loading ? 'Saving…' : 'Save Set'}
      </button>
    </div>
  )
}
