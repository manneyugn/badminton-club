'use client'
import { useState, useRef, useEffect } from 'react'
import type { PlayerRow } from '@/types'

interface Props {
  players: PlayerRow[]
  value: string
  onChange: (id: string) => void
  exclude?: string[]
  placeholder?: string
}

export default function PlayerSelect({ players, value, onChange, exclude = [], placeholder = 'Search player…' }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = players.find(p => p.player_id === value)

  const filtered = players.filter(p => {
    if (exclude.includes(p.player_id) && p.player_id !== value) return false
    return p.name.toLowerCase().includes(query.toLowerCase())
  })

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  function select(player: PlayerRow) {
    onChange(player.player_id)
    setQuery('')
    setOpen(false)
  }

  function clear() {
    onChange('')
    setQuery('')
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative w-full">
      {/* Trigger */}
      <div
        className="w-full p-3 rounded-xl text-sm flex items-center justify-between cursor-pointer"
        style={{ background: 'var(--border)', border: `1px solid ${open ? 'var(--accent)' : 'var(--border)'}` }}
        onClick={() => { setOpen(o => !o); setQuery('') }}>
        {selected ? (
          <span className="font-medium">{selected.name}
            <span className="ml-2 text-xs" style={{ color: 'var(--muted)' }}>
              {Math.round(selected.elo)} ELO
            </span>
          </span>
        ) : (
          <span style={{ color: 'var(--muted)' }}>{placeholder}</span>
        )}
        <div className="flex items-center gap-2">
          {selected && (
            <span
              className="text-xs px-1 rounded"
              style={{ color: 'var(--muted)' }}
              onClick={e => { e.stopPropagation(); clear() }}>
              ✕
            </span>
          )}
          <span style={{ color: 'var(--muted)' }}>{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden shadow-xl"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          {/* Search input */}
          <div className="p-2" style={{ borderBottom: '1px solid var(--border)' }}>
            <input
              autoFocus
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Type to search…"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'var(--border)', color: 'var(--foreground)' }}
              onClick={e => e.stopPropagation()}
            />
          </div>

          {/* List */}
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-sm" style={{ color: 'var(--muted)' }}>No players found</p>
            ) : (
              filtered.map(p => (
                <div key={p.player_id}
                  className="flex items-center justify-between px-4 py-3 cursor-pointer text-sm"
                  style={{
                    background: p.player_id === value ? '#14532d' : 'transparent',
                    color: p.player_id === value ? 'var(--accent)' : 'var(--foreground)',
                  }}
                  onMouseEnter={e => { if (p.player_id !== value) (e.currentTarget as HTMLDivElement).style.background = 'var(--border)' }}
                  onMouseLeave={e => { if (p.player_id !== value) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
                  onClick={() => select(p)}>
                  <span className="font-medium">{p.name}</span>
                  <span style={{ color: p.player_id === value ? 'var(--accent)' : 'var(--muted)' }}>
                    {Math.round(p.elo)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
