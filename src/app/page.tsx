import LeaderboardClient from '@/components/LeaderboardClient'

const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean)

export default function LeaderboardPage() {
  return <LeaderboardClient adminEmails={adminEmails} />
}
