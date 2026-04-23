import { getPlayers } from '@/services/playerService'
import RecordSetForm from '@/components/RecordSetForm'

export default async function RecordSetPage() {
  const players = await getPlayers()
  return (
    <div className="py-6">
      <h1 className="text-2xl font-bold mb-6">Record Set</h1>
      <RecordSetForm players={players} />
    </div>
  )
}
