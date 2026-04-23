'use client'
import { useState, useCallback } from 'react'
import type { PlayerRow } from '@/types'

export function usePlayers(initial: PlayerRow[]) {
  const [players, setPlayers] = useState<PlayerRow[]>(initial)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/players', { cache: 'no-store' })
      if (res.ok) setPlayers(await res.json())
    } catch {}
  }, [])

  return { players, refresh }
}
