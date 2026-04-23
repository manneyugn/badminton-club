import { v4 as uuidv4 } from 'uuid'
import {
  findPlayerById,
  appendSet,
  appendEloEvents,
  batchUpdatePlayers,
  findSetById,
} from '@/lib/sheets/repository'
import { acquireLock, releaseLock } from './lockService'
import { winProbability, scoreWeightedOutcome, computeNewElo, teamElo } from './eloService'
import { cacheInvalidate, cacheInvalidatePrefix } from '@/lib/cache/memoryCache'
import type { RecordSetInput, EloUpdateResult, PlayerRow, EloHistoryRow, SetRow } from '@/types'

export interface RecordSetResult {
  set_id: string
  eloUpdates: EloUpdateResult[]
}

export async function recordSet(input: RecordSetInput): Promise<RecordSetResult> {
  // Idempotency check
  const existing = await findSetById(input.set_id)
  if (existing) return { set_id: input.set_id, eloUpdates: [] }

  const sessionId = uuidv4()
  const acquired = await acquireLock(sessionId, `record_set set_id=${input.set_id}`)
  if (!acquired) throw new Error('LOCK_HELD')

  try {
    const allIds = [...input.team_a_player_ids, ...input.team_b_player_ids]
    const players = await Promise.all(allIds.map(id => findPlayerById(id)))
    for (let i = 0; i < players.length; i++) {
      if (!players[i]) throw new Error(`Player not found: ${allIds[i]}`)
    }
    const typed = players as PlayerRow[]

    const teamA = typed.slice(0, input.team_a_player_ids.length)
    const teamB = typed.slice(input.team_a_player_ids.length)

    const eloA = teamElo(teamA.map(p => p.elo))
    const eloB = teamElo(teamB.map(p => p.elo))

    const pA = winProbability(eloA, eloB)
    const pB = 1 - pA
    const { sA, sB } = scoreWeightedOutcome(input.score_a, input.score_b, input.winner)

    const eloUpdates: EloUpdateResult[] = []
    const now = new Date().toISOString()
    const eloHistoryRows: EloHistoryRow[] = []

    const updatePlayer = (player: PlayerRow, s: number, e: number, won: boolean, oppElo: number): PlayerRow => {
      const newElo = computeNewElo(player.elo, e, s, player.sets_played, won, oppElo)
      eloUpdates.push({ player_id: player.player_id, elo_before: player.elo, elo_after: newElo, delta: newElo - player.elo })
      eloHistoryRows.push({
        event_id: uuidv4(),
        set_id: input.set_id,
        player_id: player.player_id,
        elo_before: player.elo,
        elo_after: newElo,
        delta: newElo - player.elo,
        recorded_at: now,
      })
      return {
        ...player,
        elo: newElo,
        sets_played: player.sets_played + 1,
        wins: player.wins + (won ? 1 : 0),
        losses: player.losses + (won ? 0 : 1),
      }
    }

    const wonA = input.winner === 'team_a'
    const updatedA = teamA.map(p => updatePlayer(p, sA, pA, wonA, eloB))
    const updatedB = teamB.map(p => updatePlayer(p, sB, pB, !wonA, eloA))

    const setRow: SetRow = {
      set_id: input.set_id,
      match_type: input.match_type,
      played_at: input.played_at,
      team_a_p1: input.team_a_player_ids[0] ?? '',
      team_a_p2: input.team_a_player_ids[1] ?? '',
      team_b_p1: input.team_b_player_ids[0] ?? '',
      team_b_p2: input.team_b_player_ids[1] ?? '',
      score_a: input.score_a,
      score_b: input.score_b,
      game_points: input.game_points,
      winner: input.winner,
      recorded_by: input.recorded_by,
      status: 'confirmed',
    }

    // Write in order: history → set → player updates
    await appendEloEvents(eloHistoryRows)
    await appendSet(setRow)
    await batchUpdatePlayers([...updatedA, ...updatedB])

    cacheInvalidate('players:all')
    cacheInvalidate('sets:recent')
    allIds.forEach(id => cacheInvalidate(`player:${id}`))
    cacheInvalidatePrefix('elo_history:')

    return { set_id: input.set_id, eloUpdates }
  } finally {
    await releaseLock()
  }
}
