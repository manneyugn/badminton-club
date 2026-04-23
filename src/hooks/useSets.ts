'use client'
import { useState, useCallback } from 'react'
import type { SetRow } from '@/types'

export function useSets(initial: SetRow[]) {
  const [sets, setSets] = useState<SetRow[]>(initial)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/matches', { cache: 'no-store' })
      if (res.ok) setSets(await res.json())
    } catch {}
  }, [])

  return { sets, refresh }
}
