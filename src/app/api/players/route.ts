import { NextRequest, NextResponse } from 'next/server'
import { auth, isAdmin } from '@/lib/auth'
import { getPlayers, createPlayer } from '@/services/playerService'
import { z } from 'zod'

export async function GET() {
  try {
    const players = await getPlayers()
    return NextResponse.json(players)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 })
  }
}

const CreatePlayerSchema = z.object({
  name: z.string().min(1).max(60),
  email: z.string().email().optional().default(''),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || !isAdmin(session.user?.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = CreatePlayerSchema.parse(await req.json())
    const player = await createPlayer(body.name, body.email)
    return NextResponse.json(player, { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues }, { status: 400 })
    return NextResponse.json({ error: 'Failed to create player' }, { status: 500 })
  }
}
