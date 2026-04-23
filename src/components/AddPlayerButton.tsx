'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function AddPlayerButton({ adminEmails }: { adminEmails: string[] }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isAdmin = session?.user?.email &&
    (adminEmails.length === 0 || adminEmails.includes(session.user.email))

  if (!isAdmin) return null

  async function submit() {
    if (!name.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setOpen(false)
      setName('')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="w-full py-3 rounded-xl text-sm font-semibold mt-2"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--accent)' }}>
        + Add Player
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}>
          <div className="w-full max-w-lg rounded-2xl p-6 flex flex-col gap-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h2 className="text-lg font-bold">Add Player</h2>

            <input
              type="text"
              placeholder="Player name"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              autoFocus
              className="w-full p-3 rounded-xl text-sm"
              style={{ background: 'var(--border)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
            />

            {error && <p className="text-sm text-red-400">{error}</p>}

            <div className="flex gap-2">
              <button onClick={() => { setOpen(false); setName('') }}
                className="flex-1 py-3 rounded-xl text-sm font-semibold"
                style={{ background: 'var(--border)' }}>
                Cancel
              </button>
              <button onClick={submit} disabled={!name.trim() || loading}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-black disabled:opacity-40"
                style={{ background: 'var(--accent)' }}>
                {loading ? 'Adding…' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
