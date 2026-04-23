import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { findAllPlayers, appendPlayer } from '@/lib/sheets/repository'
import { v4 as uuidv4 } from 'uuid'
import type { PlayerRow } from '@/types'

const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean)

async function ensurePlayer(email: string, name: string) {
  try {
    const players = await findAllPlayers()
    const exists = players.find(p => p.email === email)
    if (!exists) {
      const player: PlayerRow = {
        player_id: uuidv4(),
        name,
        email,
        elo: 1200,
        sets_played: 0,
        wins: 0,
        losses: 0,
        created_at: new Date().toISOString(),
        is_active: true,
      }
      await appendPlayer(player)
    }
  } catch {
    // Don't block sign-in if player creation fails
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      if (!profile?.email) return false
      // Auto-create player profile on first sign-in
      await ensurePlayer(profile.email, profile.name ?? profile.email.split('@')[0])
      return true
    },
    async session({ session }) {
      return session
    },
  },
})

export function isAdmin(email?: string | null): boolean {
  if (!email) return false
  if (adminEmails.length === 0) return true
  return adminEmails.includes(email)
}
