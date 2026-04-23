import { NextRequest, NextResponse } from 'next/server'
import { auth, isAdmin } from '@/lib/auth'
import { findSetById, voidSet } from '@/lib/sheets/repository'
import { cacheInvalidate } from '@/lib/cache/memoryCache'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const set = await findSetById(id)
    if (!set) return NextResponse.json({ error: 'Set not found' }, { status: 404 })
    return NextResponse.json(set)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch set' }, { status: 500 })
  }
}

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || !isAdmin(session.user?.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  try {
    const set = await findSetById(id)
    if (!set) return NextResponse.json({ error: 'Set not found' }, { status: 404 })
    if (set.status === 'voided') return NextResponse.json({ error: 'Set already voided' }, { status: 400 })

    await voidSet(id)
    cacheInvalidate('sets:recent')
    return NextResponse.json({ set_id: id, status: 'voided' })
  } catch {
    return NextResponse.json({ error: 'Failed to void set' }, { status: 500 })
  }
}
