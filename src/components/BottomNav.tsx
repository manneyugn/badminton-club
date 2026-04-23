'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/',            label: 'Rankings',  icon: '🏆' },
  { href: '/handicap',   label: 'Handicap',  icon: '⚖️' },
  { href: '/matches/new', label: 'Record',    icon: '➕' },
  { href: '/sets',        label: 'History',   icon: '📋' },
]

export default function BottomNav() {
  const path = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t flex"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      {links.map(l => {
        const active = l.href === '/' ? path === '/' : path.startsWith(l.href)
        return (
          <Link key={l.href} href={l.href}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs transition-colors"
            style={{ color: active ? 'var(--accent)' : 'var(--muted)' }}>
            <span className="text-lg leading-none">{l.icon}</span>
            <span>{l.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
