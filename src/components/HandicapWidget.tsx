'use client'
import { useState, useEffect } from 'react'
import type { PlayerRow, HandicapResult } from '@/types'
import PlayerSelect from './PlayerSelect'
import { usePlayers } from '@/hooks/usePlayers'

export default function HandicapWidget({ players: initialPlayers }: { players: PlayerRow[] }) {
  const { players, refresh } = usePlayers(initialPlayers)
  useEffect(() => { refresh() }, [refresh])
  const [matchType, setMatchType] = useState<'singles' | 'doubles'>('singles')
  const [gamePoints, setGamePoints] = useState<15 | 21>(21)
  const [pA, setPA] = useState('')
  const [pA2, setPA2] = useState('')
  const [pB, setPB] = useState('')
  const [pB2, setPB2] = useState('')
  const [result, setResult] = useState<HandicapResult & { game_points: number } | null>(null)
  const [loading, setLoading] = useState(false)

  const isDoubles = matchType === 'doubles'
  const valid = pA && pB && (!isDoubles || (pA2 && pB2))
  const all = [pA, pA2, pB, pB2].filter(Boolean)

  const btn = (active: boolean) =>
    `flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${active ? 'text-black' : 'opacity-50'}`

  async function calculate() {
    if (!valid) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ playerA: pA, playerB: pB, points: String(gamePoints) })
      if (isDoubles) { params.set('playerA2', pA2); params.set('playerB2', pB2) }
      const res = await fetch(`/api/handicap?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Match type */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--surface)' }}>
        {(['singles', 'doubles'] as const).map(t => (
          <button key={t} onClick={() => { setMatchType(t); setPA2(''); setPB2(''); setResult(null) }}
            className={btn(matchType === t)}
            style={{ background: matchType === t ? 'var(--accent)' : 'transparent' }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Game points */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--surface)' }}>
        {([15, 21] as const).map(pts => (
          <button key={pts} onClick={() => { setGamePoints(pts); setResult(null) }}
            className={btn(gamePoints === pts)}
            style={{ background: gamePoints === pts ? 'var(--accent)' : 'transparent' }}>
            {pts} pts
          </button>
        ))}
      </div>

      {/* Players */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Team A</p>
        <PlayerSelect players={players} value={pA}
          onChange={v => { setPA(v); setResult(null) }}
          exclude={all.filter(x => x !== pA)} placeholder="Select player A" />
        {isDoubles && (
          <PlayerSelect players={players} value={pA2}
            onChange={v => { setPA2(v); setResult(null) }}
            exclude={all.filter(x => x !== pA2)} placeholder="Select player A2" />
        )}
      </div>

      <div className="text-center text-sm font-bold" style={{ color: 'var(--muted)' }}>vs</div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Team B</p>
        <PlayerSelect players={players} value={pB}
          onChange={v => { setPB(v); setResult(null) }}
          exclude={all.filter(x => x !== pB)} placeholder="Select player B" />
        {isDoubles && (
          <PlayerSelect players={players} value={pB2}
            onChange={v => { setPB2(v); setResult(null) }}
            exclude={all.filter(x => x !== pB2)} placeholder="Select player B2" />
        )}
      </div>

      <button onClick={calculate} disabled={!valid || loading}
        className="w-full py-4 rounded-xl font-bold text-black disabled:opacity-40"
        style={{ background: 'var(--accent)' }}>
        {loading ? 'Calculating…' : 'Calculate Handicap'}
      </button>

      {result && (
        <div className="rounded-xl p-5 flex flex-col gap-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          {result.favored_side === 'equal' ? (
            <p className="text-center text-lg font-bold">Even match — no handicap</p>
          ) : (
            <>
              <div className="text-center">
                <div className="text-5xl font-black mb-1" style={{ color: 'var(--accent)' }}>
                  +{result.handicap}
                </div>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  pts head-start for Team {result.favored_side === 'A' ? 'B' : 'A'}
                </p>
              </div>
              <p className="text-center text-sm" style={{ color: 'var(--muted)' }}>
                e.g. Team {result.favored_side === 'A' ? 'B' : 'A'} starts {result.handicap}–0
              </p>
            </>
          )}
          <div className="flex gap-2">
            {[
              { label: 'Team A', prob: result.win_prob_a, elo: result.elo_a },
              { label: 'Team B', prob: result.win_prob_b, elo: result.elo_b },
            ].map(side => (
              <div key={side.label} className="flex-1 rounded-xl p-3 text-center"
                style={{ background: 'var(--border)' }}>
                <div className="text-xs mb-1" style={{ color: 'var(--muted)' }}>{side.label}</div>
                <div className="font-bold">{Math.round(side.prob * 100)}%</div>
                <div className="text-xs" style={{ color: 'var(--muted)' }}>{Math.round(side.elo)} ELO</div>
              </div>
            ))}
          </div>
          <div className="text-center text-xs" style={{ color: 'var(--muted)' }}>
            Confidence: <span className="capitalize">{result.confidence}</span>
          </div>
        </div>
      )}
    </div>
  )
}
