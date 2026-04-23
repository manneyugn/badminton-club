export interface PlayerRow {
  player_id: string
  name: string
  email: string
  elo: number
  sets_played: number
  wins: number
  losses: number
  created_at: string
  is_active: boolean
}

// One row = one set (single game to 15 or 21)
export interface SetRow {
  set_id: string
  match_type: 'singles' | 'doubles'
  played_at: string
  team_a_p1: string
  team_a_p2: string  // empty for singles
  team_b_p1: string
  team_b_p2: string  // empty for singles
  score_a: number
  score_b: number
  game_points: number  // 15 or 21
  winner: 'team_a' | 'team_b'
  recorded_by: string
  status: 'confirmed' | 'voided'
}

export interface EloHistoryRow {
  event_id: string
  set_id: string
  player_id: string
  elo_before: number
  elo_after: number
  delta: number
  recorded_at: string
}

export interface LockRow {
  lock_id: string
  acquired_by: string
  acquired_at: string
  expires_at: string
  operation: string
}

export interface RecordSetInput {
  set_id: string
  match_type: 'singles' | 'doubles'
  played_at: string
  team_a_player_ids: string[]
  team_b_player_ids: string[]
  score_a: number
  score_b: number
  game_points: 15 | 21
  winner: 'team_a' | 'team_b'
  recorded_by: string
}

export interface HandicapResult {
  handicap: number
  favored_side: 'A' | 'B' | 'equal'
  win_prob_a: number
  win_prob_b: number
  elo_a: number
  elo_b: number
  confidence: 'low' | 'medium' | 'high'
}

export interface EloUpdateResult {
  player_id: string
  elo_before: number
  elo_after: number
  delta: number
}
