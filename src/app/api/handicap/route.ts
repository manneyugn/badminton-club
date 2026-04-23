import { NextRequest, NextResponse } from 'next/server'
import { getPlayer } from '@/services/playerService'
import { computeHandicap } from '@/services/handicapService'

// Singles: GET /api/handicap?playerA=<id>&playerB=<id>&points=21
// Doubles: GET /api/handicap?playerA=<id>&playerA2=<id>&playerB=<id>&playerB2=<id>&points=15
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl

  const playerAId = searchParams.get('playerA')
  const playerBId = searchParams.get('playerB')
  const playerA2Id = searchParams.get('playerA2')
  const playerB2Id = searchParams.get('playerB2')
  const rawPoints = searchParams.get('points')
  const gamePoints = rawPoints === '15' ? 15 : 21

  if (!playerAId || !playerBId) {
    return NextResponse.json({ error: 'playerA and playerB are required' }, { status: 400 })
  }

  try {
    const [pA, pB, pA2, pB2] = await Promise.all([
      getPlayer(playerAId),
      getPlayer(playerBId),
      playerA2Id ? getPlayer(playerA2Id) : null,
      playerB2Id ? getPlayer(playerB2Id) : null,
    ])

    if (!pA) return NextResponse.json({ error: `Player not found: ${playerAId}` }, { status: 404 })
    if (!pB) return NextResponse.json({ error: `Player not found: ${playerBId}` }, { status: 404 })

    const isDoubles = !!(pA2 && pB2)
    const eloA = isDoubles ? (pA.elo + pA2!.elo) / 2 : pA.elo
    const eloB = isDoubles ? (pB.elo + pB2!.elo) / 2 : pB.elo
    const setsA = isDoubles ? Math.min(pA.sets_played, pA2!.sets_played) : pA.sets_played
    const setsB = isDoubles ? Math.min(pB.sets_played, pB2!.sets_played) : pB.sets_played

    const result = computeHandicap(eloA, eloB, setsA, setsB, gamePoints)

    return NextResponse.json({
      ...result,
      game_points: gamePoints,
      match_type: isDoubles ? 'doubles' : 'singles',
      team_a: isDoubles ? [pA, pA2] : pA,
      team_b: isDoubles ? [pB, pB2] : pB,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to compute handicap' }, { status: 500 })
  }
}
