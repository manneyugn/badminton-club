import { winProbability } from './eloService'
import type { HandicapResult } from '@/types'

// Max handicap is ~57% of game points (12/21 ratio)
const MAX_HANDICAP_RATIO = 0.57

export function computeHandicap(
  eloA: number,
  eloB: number,
  setsA: number,
  setsB: number,
  gamePoints: 15 | 21 = 21
): HandicapResult {
  const pA = winProbability(eloA, eloB)
  const pB = 1 - pA

  const eloDiff = Math.abs(eloA - eloB)
  const pStrong = Math.max(pA, pB)

  const maxHandicap = gamePoints * MAX_HANDICAP_RATIO
  const raw = (pStrong - 0.5) * 2 * gamePoints
  const capped = Math.min(raw, maxHandicap)
  const rounded = Math.round(capped * 2) / 2
  const practical = capped >= 2 ? Math.max(2.5, rounded) : 0

  let favored_side: HandicapResult['favored_side'] = 'equal'
  if (eloDiff > 5) favored_side = eloA > eloB ? 'A' : 'B'

  let confidence: HandicapResult['confidence'] = 'high'
  if (setsA < 5 || setsB < 5) confidence = 'low'
  else if (Math.abs(setsA - setsB) > 10) confidence = 'medium'

  return {
    handicap: practical,
    favored_side,
    win_prob_a: pA,
    win_prob_b: pB,
    elo_a: eloA,
    elo_b: eloB,
    confidence,
  }
}
