import { v4 as uuidv4 } from 'uuid'
import { findActivePlayers, findPlayerById, appendPlayer, findEloHistoryByPlayer } from '@/lib/sheets/repository'
import { cacheGet, cacheSet, cacheInvalidate } from '@/lib/cache/memoryCache'
import type { PlayerRow, EloHistoryRow } from '@/types'

const TTL_PLAYERS = 60_000
const TTL_HISTORY = 120_000

export async function getPlayers(): Promise<PlayerRow[]> {
  const cached = cacheGet<PlayerRow[]>('players:all')
  if (cached) return cached
  const players = await findActivePlayers()
  const sorted = [...players].sort((a, b) => b.elo - a.elo)
  cacheSet('players:all', sorted, TTL_PLAYERS)
  return sorted
}

export async function getPlayer(id: string): Promise<PlayerRow | null> {
  const cached = cacheGet<PlayerRow>(`player:${id}`)
  if (cached) return cached
  const player = await findPlayerById(id)
  if (player) cacheSet(`player:${id}`, player, TTL_PLAYERS)
  return player
}

export async function createPlayer(name: string, email = ''): Promise<PlayerRow> {
  const player: PlayerRow = {
    player_id: uuidv4(),
    name,
    email,
    elo: 1200,
    sets_played: 0,
    wins: 0,
    losses: 0,
    created_at: new Date().toISOString(),
    is_active: true,
  }
  await appendPlayer(player)
  cacheInvalidate('players:all')
  return player
}

export async function getEloHistory(playerId: string): Promise<EloHistoryRow[]> {
  const key = `elo_history:${playerId}`
  const cached = cacheGet<EloHistoryRow[]>(key)
  if (cached) return cached
  const history = await findEloHistoryByPlayer(playerId)
  cacheSet(key, history, TTL_HISTORY)
  return history
}
