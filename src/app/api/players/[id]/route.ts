import { NextRequest, NextResponse } from 'next/server'
import { getPlayer, getEloHistory } from '@/services/playerService'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const [player, history] = await Promise.all([
      getPlayer(id),
      getEloHistory(id),
    ])
    if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    return NextResponse.json({ ...player, elo_history: history })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch player' }, { status: 500 })
  }
}
