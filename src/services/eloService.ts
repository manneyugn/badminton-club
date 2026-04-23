const K_PROVISIONAL = 40  // < 5 sets
const K_DEVELOPING = 32   // 5–9 sets
const K_ESTABLISHED = 24  // 10+ sets
const SCORE_ALPHA = 0.6   // blend weight: 40% win/loss, 60% point margin

export function getKFactor(setsPlayed: number): number {
  if (setsPlayed < 5) return K_PROVISIONAL
  if (setsPlayed < 10) return K_DEVELOPING
  return K_ESTABLISHED
}

// Scale K up when the ELO gap is large so mismatched matches still move ratings meaningfully.
// Gap 0–99: 1×, 100–199: 1.3×, 200–349: 1.7×, 350+: 2.2×
export function gapMultiplier(eloDiff: number): number {
  const gap = Math.abs(eloDiff)
  if (gap >= 350) return 2.2
  if (gap >= 200) return 1.7
  if (gap >= 100) return 1.3
  return 1.0
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
  won: boolean,
  opponentElo: number = rating
): number {
  const k = getKFactor(setsPlayed) * gapMultiplier(rating - opponentElo)
  const raw = k * (actualScore - expectedScore)
  // Guarantee: a win always gains at least +0.5, a loss always loses at least -0.5
  const delta = won ? Math.max(0.5, raw) : Math.min(-0.5, raw)
  return Math.round((rating + delta) * 10) / 10
}

// For doubles: average team ELO
export function teamElo(elos: number[]): number {
  return elos.reduce((s, e) => s + e, 0) / elos.length
}
