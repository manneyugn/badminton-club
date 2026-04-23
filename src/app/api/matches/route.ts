import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { recordSet } from '@/services/matchService'
import { cacheGet, cacheSet } from '@/lib/cache/memoryCache'
import { findAllSets } from '@/lib/sheets/repository'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'

export async function GET() {
  try {
    const cached = cacheGet<unknown[]>('sets:recent')
    if (cached) return NextResponse.json(cached)
    const sets = await findAllSets()
    const confirmed = sets.filter(s => s.status === 'confirmed').reverse()
    cacheSet('sets:recent', confirmed, 30_000)
    return NextResponse.json(confirmed)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch sets' }, { status: 500 })
  }
}

const RecordSetSchema = z.object({
  set_id: z.string().uuid().optional(),
  match_type: z.enum(['singles', 'doubles']),
  played_at: z.string().datetime().optional(),
  team_a_player_ids: z.array(z.string().uuid()).min(1).max(2),
  team_b_player_ids: z.array(z.string().uuid()).min(1).max(2),
  score_a: z.number().int().min(0).max(30),
  score_b: z.number().int().min(0).max(30),
  game_points: z.union([z.literal(15), z.literal(21)]).default(21),
  winner: z.enum(['team_a', 'team_b']),
}).refine(d => {
  if (d.match_type === 'singles') return d.team_a_player_ids.length === 1 && d.team_b_player_ids.length === 1
  if (d.match_type === 'doubles') return d.team_a_player_ids.length === 2 && d.team_b_player_ids.length === 2
  return true
}, { message: 'Singles requires 1 player per side, doubles requires 2' })
.refine(d => {
  const winnerScore = d.winner === 'team_a' ? d.score_a : d.score_b
  return winnerScore >= d.game_points
}, { message: "Winner's score must reach the game_points target" })
.refine(d => {
  const winnerScore = d.winner === 'team_a' ? d.score_a : d.score_b
  const loserScore  = d.winner === 'team_a' ? d.score_b : d.score_a
  const margin = winnerScore - loserScore
  // Must win by 2, except deuce caps: 30-29 for 21pt, 21-20 for 15pt
  const isCap = (d.game_points === 21 && winnerScore === 30 && loserScore === 29)
             || (d.game_points === 15 && winnerScore === 21 && loserScore === 20)
  return margin >= 2 || isCap
}, { message: 'Must win by at least 2 points (deuce rule)' })

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: z.infer<typeof RecordSetSchema>
  try {
    body = RecordSetSchema.parse(await req.json())
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues }, { status: 400 })
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  try {
    const result = await recordSet({
      set_id: body.set_id ?? uuidv4(),
      match_type: body.match_type,
      played_at: body.played_at ?? new Date().toISOString(),
      team_a_player_ids: body.team_a_player_ids,
      team_b_player_ids: body.team_b_player_ids,
      score_a: body.score_a,
      score_b: body.score_b,
      game_points: body.game_points,
      winner: body.winner,
      recorded_by: session.user?.email ?? '',
    })
    return NextResponse.json(result, { status: 201 })
  } catch (e) {
    if (e instanceof Error && e.message === 'LOCK_HELD') {
      return NextResponse.json({ error: 'Server busy, retry in 5 seconds', retryAfterMs: 5000 }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to record set' }, { status: 500 })
  }
}
