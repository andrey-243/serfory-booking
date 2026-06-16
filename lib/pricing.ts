// Server-side only — never import from client components

export type Format = 'individual' | 'pair' | 'group' | 'premade'
export type LessonsCount = 1 | 4 | 6 | 7 | 8 | 12

// Base price per person per lesson (before tier multiplier)
const BASE_PRICES: Record<Format, Partial<Record<LessonsCount, number>>> = {
  individual: { 1: 26, 4: 25, 8: 24, 12: 23 },
  pair:       { 1: 21, 4: 20, 8: 19, 12: 18 },
  group:      { 4: 15 },
  premade:    { 6: 18, 7: 18 },
}

const STUDENTS_COUNT: Record<Format, number> = {
  individual: 1,
  pair: 2,
  group: 1,
  premade: 1,
}

export type PriceTier = 'eu' | 'us' | 'baltics' | 'cis'

const TIER_MULTIPLIERS: Record<PriceTier, number> = {
  eu:      1.30,
  us:      1.35,
  baltics: 1.00,
  cis:     0.60,
}

const EMTA = 100 / 78

// Teacher rate for group/premade based on student count
// group:   base × (1 + (n-1) × 0.25) for all sizes
// premade: base rate (no %) + flat bonus: +2.6 if n=5, +5.2 if n=6
export function getTeacherRate(baseRate: number, format: Format, studentCount: number): number {
  if (format === 'individual' || format === 'pair') {
    const multiplier = 1 + (studentCount - 1) * 0.25
    return Math.round(baseRate * multiplier * 100) / 100
  }
  if (format === 'group') {
    const multiplier = 1 + (studentCount - 1) * 0.25
    return Math.round(baseRate * multiplier * 100) / 100
  }
  if (format === 'premade') {
    const bonus = studentCount === 5 ? 2.6 : studentCount === 6 ? 5.2 : 0
    return Math.round((baseRate + bonus) * 100) / 100
  }
  return baseRate
}

export function getTeacherGrossCost(baseRate: number, format: Format, studentCount: number): number {
  const net = getTeacherRate(baseRate, format, studentCount)
  return Math.round(net * EMTA * 100) / 100
}

export function getPricePerLesson(
  format: Format,
  lessons: number,
  tier: string = 'baltics'
): number {
  const multiplier = TIER_MULTIPLIERS[tier as PriceTier] ?? 1.00
  const base = format === 'premade' ? 18 : (BASE_PRICES[format][lessons as LessonsCount] ?? 0)
  return Math.ceil(base * multiplier)
}

export function getStudentsCount(format: Format): number {
  return STUDENTS_COUNT[format]
}

export function getTotalAmount(
  format: Format,
  lessons: number,
  tier: string = 'baltics'
): number {
  const pricePerLesson = getPricePerLesson(format, lessons, tier)
  const students = STUDENTS_COUNT[format]
  return pricePerLesson * lessons * students
}

export const DISPLAY_PRICES = BASE_PRICES
export const FORMAT_OPTIONS: Format[] = ['individual', 'pair', 'group', 'premade']
export const DISCOUNTS: Partial<Record<LessonsCount, string>> = {
  1: '', 4: '-5%', 6: '', 7: '', 8: '-10%', 12: '-15%',
}
