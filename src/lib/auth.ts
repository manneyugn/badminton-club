import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'

const allowedEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean)

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
      if (allowedEmails.length === 0) return true // no restriction if not configured
      return allowedEmails.includes(profile.email)
    },
    async session({ session }) {
      return session
    },
  },
})

export function isAdmin(email?: string | null): boolean {
  if (!email) return false
  if (allowedEmails.length === 0) return true
  return allowedEmails.includes(email)
}
