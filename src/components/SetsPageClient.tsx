'use client'
import { useEffect } from 'react'
import { useSets } from '@/hooks/useSets'
import SetHistoryList from './SetHistoryList'
import type { SetRow } from '@/types'

interface Props {
  initialSets: SetRow[]
  playerMap: Record<string, string>
}

export default function SetsPageClient({ initialSets, playerMap }: Props) {
  const { sets, refresh } = useSets(initialSets)

  useEffect(() => { refresh() }, [refresh])

  return (
    <>
      <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
        {sets.length} sets recorded
      </p>
      <SetHistoryList sets={sets} playerMap={playerMap} />
    </>
  )
}
