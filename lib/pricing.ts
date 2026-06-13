// Server-side only — never import from client components

export type Format = 'individual' | 'pair' | 'group' | 'premade'
export type LessonsCount = 1 | 4 | 8 | 12

// Base price per person per lesson (before tier multiplier)
// group and premade are flat — same price regardless of pack size
const BASE_PRICES: Record<Format, Record<LessonsCount, number>> = {
  individual: { 1: 26, 4: 25, 8: 24, 12: 23 },
  pair:       { 1: 21, 4: 20, 8: 19, 12: 18 },
  group:      { 1: 15, 4: 15, 8: 15, 12: 15 },
  premade:    { 1: 18, 4: 18, 8: 18, 12: 18 },
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
  lessons: LessonsCount,
  tier: string = 'baltics'
): number {
  const base = BASE_PRICES[format][lessons]
  const multiplier = TIER_MULTIPLIERS[tier as PriceTier] ?? 1.00
  return Math.round(base * multiplier * 100) / 100
}

export function getStudentsCount(format: Format): number {
  return STUDENTS_COUNT[format]
}

export function getTotalAmount(
  format: Format,
  lessons: LessonsCount,
  tier: string = 'baltics'
): number {
  const pricePerLesson = getPricePerLesson(format, lessons, tier)
  const students = STUDENTS_COUNT[format]
  return Math.round(pricePerLesson * lessons * students * 100) / 100
}

// For display on the package page (base prices only, no tier)
export const DISPLAY_PRICES = BASE_PRICES
export const LESSONS_OPTIONS: LessonsCount[] = [1, 4, 8, 12]
export const FORMAT_OPTIONS: Format[] = ['individual', 'pair', 'group', 'premade']
export const DISCOUNTS: Record<LessonsCount, string> = {
  1: '',
  4: '-5%',
  8: '-10%',
  12: '-15%',
}
