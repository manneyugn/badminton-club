import { readLock, writeLock, clearLock } from '@/lib/sheets/repository'

const LOCK_TTL_MS = 30_000
const CONFIRM_DELAY_MS = 1_000

export async function acquireLock(sessionId: string, operation: string): Promise<boolean> {
  const existing = await readLock()

  if (existing && existing.acquired_by) {
    const expired = new Date(existing.expires_at).getTime() < Date.now()
    if (!expired) {
      return false // lock is held
    }
  }

  await writeLock(sessionId, operation)

  // Wait then confirm we still own the lock
  await new Promise(r => setTimeout(r, CONFIRM_DELAY_MS))

  const confirmed = await readLock()
  return confirmed?.acquired_by === sessionId
}

export async function releaseLock(): Promise<void> {
  await clearLock()
}

export function lockTtlMs(): number {
  return LOCK_TTL_MS
}
