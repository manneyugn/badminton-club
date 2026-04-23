const K_PROVISIONAL = 40  // < 20 sets
const K_DEVELOPING = 32   // 20–59 sets
const K_ESTABLISHED = 24  // 60+ sets
const SCORE_ALPHA = 0.3   // blend weight: 70% win/loss, 30% point margin

export function getKFactor(setsPlayed: number): number {
  if (setsPlayed < 20) return K_PROVISIONAL
  if (setsPlayed < 60) return K_DEVELOPING
  return K_ESTABLISHED
}

// Cap at 0.95/0.05 so extreme gaps don't cause winners to lose ELO
export function winProbability(ratingA: number, ratingB: number): number {
  const raw = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400))
  return Math.min(0.95, Math.max(0.05, raw))
}

// Score-weighted outcome for a single set
export function scoreWeightedOutcome(
  scoreA: number,
  scoreB: number,
  winner: 'team_a' | 'team_b'
): { sA: number; sB: number } {
  const total = scoreA + scoreB
  const binaryA = winner === 'team_a' ? 1 : 0
  const binaryB = 1 - binaryA
  const ratioA = total > 0 ? scoreA / total : 0.5
  const ratioB = 1 - ratioA

  return {
    sA: (1 - SCORE_ALPHA) * binaryA + SCORE_ALPHA * ratioA,
    sB: (1 - SCORE_ALPHA) * binaryB + SCORE_ALPHA * ratioB,
  }
}

export function computeNewElo(
  rating: number,
  expectedScore: number,
  actualScore: number,
  setsPlayed: number,
  won: boolean
): number {
  const k = getKFactor(setsPlayed)
  const raw = k * (actualScore - expectedScore)
  // Guarantee: a win always gains at least +0.5, a loss always loses at least -0.5
  const delta = won ? Math.max(0.5, raw) : Math.min(-0.5, raw)
  return Math.round((rating + delta) * 10) / 10
}

// For doubles: average team ELO
export function teamElo(elos: number[]): number {
  return elos.reduce((s, e) => s + e, 0) / elos.length
}
