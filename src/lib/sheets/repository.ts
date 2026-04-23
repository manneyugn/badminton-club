import { getValues, appendValues, updateValues, batchUpdateValues } from './client'
import { RANGES } from './ranges'
import type { PlayerRow, SetRow, EloHistoryRow, LockRow } from '@/types'

// ── Player helpers ────────────────────────────────────────────────────────────

function rowToPlayer(row: (string | number | boolean)[]): PlayerRow {
  return {
    player_id: String(row[0] ?? ''),
    name: String(row[1] ?? ''),
    email: String(row[2] ?? ''),
    elo: Number(row[3] ?? 1200),
    sets_played: Number(row[4] ?? 0),
    wins: Number(row[5] ?? 0),
    losses: Number(row[6] ?? 0),
    created_at: String(row[7] ?? ''),
    is_active: row[8] === true || row[8] === 'TRUE',
  }
}

function playerToRow(p: PlayerRow): (string | number | boolean)[] {
  return [p.player_id, p.name, p.email, p.elo, p.sets_played, p.wins, p.losses, p.created_at, p.is_active]
}

export async function findAllPlayers(): Promise<PlayerRow[]> {
  const rows = await getValues(RANGES.players.all)
  return rows.filter(r => r[0]).map(rowToPlayer)
}

export async function findActivePlayers(): Promise<PlayerRow[]> {
  const all = await findAllPlayers()
  return all.filter(p => p.is_active)
}

export async function findPlayerById(id: string): Promise<PlayerRow | null> {
  const all = await findAllPlayers()
  return all.find(p => p.player_id === id) ?? null
}

export async function appendPlayer(p: PlayerRow): Promise<void> {
  await appendValues(RANGES.players.cols, [playerToRow(p)])
}

export async function batchUpdatePlayers(players: PlayerRow[]): Promise<void> {
  const all = await findAllPlayers()
  const data = players.map(p => {
    const idx = all.findIndex(r => r.player_id === p.player_id)
    if (idx === -1) throw new Error(`Player ${p.player_id} not found in sheet`)
    const row = idx + 2 // +1 for header, +1 for 1-based index
    return {
      range: `players!A${row}:I${row}`,
      values: [playerToRow(p)],
    }
  })
  await batchUpdateValues(data)
}

// ── Set helpers ───────────────────────────────────────────────────────────────
// Sheet columns: set_id | match_type | played_at | team_a_p1 | team_a_p2 |
//                team_b_p1 | team_b_p2 | score_a | score_b | game_points |
//                winner | recorded_by | status
//                A         B            C          D          E
//                F          G            H        I           J
//                K          L             M

function rowToSet(row: (string | number | boolean)[]): SetRow {
  return {
    set_id: String(row[0] ?? ''),
    match_type: String(row[1] ?? 'singles') as 'singles' | 'doubles',
    played_at: String(row[2] ?? ''),
    team_a_p1: String(row[3] ?? ''),
    team_a_p2: String(row[4] ?? ''),
    team_b_p1: String(row[5] ?? ''),
    team_b_p2: String(row[6] ?? ''),
    score_a: Number(row[7] ?? 0),
    score_b: Number(row[8] ?? 0),
    game_points: Number(row[9] ?? 21) as 15 | 21,
    winner: String(row[10] ?? 'team_a') as 'team_a' | 'team_b',
    recorded_by: String(row[11] ?? ''),
    status: String(row[12] ?? 'confirmed') as 'confirmed' | 'voided',
  }
}

function setToRow(s: SetRow): (string | number | boolean)[] {
  return [
    s.set_id, s.match_type, s.played_at,
    s.team_a_p1, s.team_a_p2, s.team_b_p1, s.team_b_p2,
    s.score_a, s.score_b, s.game_points,
    s.winner, s.recorded_by, s.status,
  ]
}

export async function findAllSets(): Promise<SetRow[]> {
  const rows = await getValues(RANGES.sets.all)
  return rows.filter(r => r[0]).map(rowToSet)
}

export async function findSetById(id: string): Promise<SetRow | null> {
  const all = await findAllSets()
  return all.find(s => s.set_id === id) ?? null
}

export async function appendSet(s: SetRow): Promise<void> {
  await appendValues(RANGES.sets.cols, [setToRow(s)])
}

export async function voidSet(id: string): Promise<void> {
  const all = await findAllSets()
  const idx = all.findIndex(s => s.set_id === id)
  if (idx === -1) throw new Error(`Set ${id} not found`)
  const row = idx + 2
  await updateValues(`sets!M${row}`, [['voided']])
}

// ── EloHistory helpers ────────────────────────────────────────────────────────

function eloHistoryToRow(e: EloHistoryRow): (string | number | boolean)[] {
  return [e.event_id, e.set_id, e.player_id, e.elo_before, e.elo_after, e.delta, e.recorded_at]
}

export async function appendEloEvents(events: EloHistoryRow[]): Promise<void> {
  await appendValues(RANGES.eloHistory.cols, events.map(eloHistoryToRow))
}

export async function findEloHistoryByPlayer(playerId: string): Promise<EloHistoryRow[]> {
  const rows = await getValues(RANGES.eloHistory.all)
  return rows
    .filter(r => r[0] && r[2] === playerId)
    .map(row => ({
      event_id: String(row[0]),
      set_id: String(row[1]),
      player_id: String(row[2]),
      elo_before: Number(row[3]),
      elo_after: Number(row[4]),
      delta: Number(row[5]),
      recorded_at: String(row[6]),
    }))
}

// ── Write lock helpers ────────────────────────────────────────────────────────

export async function readLock(): Promise<LockRow | null> {
  const rows = await getValues(RANGES.writeLock.row)
  const row = rows[0]
  if (!row || !row[0]) return null
  return {
    lock_id: String(row[0]),
    acquired_by: String(row[1] ?? ''),
    acquired_at: String(row[2] ?? ''),
    expires_at: String(row[3] ?? ''),
    operation: String(row[4] ?? ''),
  }
}

export async function writeLock(sessionId: string, operation: string): Promise<void> {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 30_000)
  await updateValues(RANGES.writeLock.row, [[
    'GLOBAL_LOCK', sessionId, now.toISOString(), expiresAt.toISOString(), operation,
  ]])
}

export async function clearLock(): Promise<void> {
  await updateValues(RANGES.writeLock.row, [['', '', '', '', '']])
}
