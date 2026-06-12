// Server-side only — never import from client components

export type Format = 'individual' | 'pair' | 'group'
export type LessonsCount = 1 | 4 | 8 | 12

// Base price per person per lesson (before tier multiplier)
const BASE_PRICES: Record<Format, Record<LessonsCount, number>> = {
  individual: { 1: 25, 4: 24, 8: 23, 12: 21 },
  pair:       { 1: 20, 4: 19, 8: 18, 12: 17 },
  group:      { 1: 15, 4: 14, 8: 14, 12: 13 },
}

const STUDENTS_COUNT: Record<Format, number> = {
  individual: 1,
  pair: 2,
  group: 5,
}

export type PriceTier = 'eu' | 'us' | 'baltics' | 'cis'

const TIER_MULTIPLIERS: Record<PriceTier, number> = {
  eu:      1.30,
  us:      1.35,
  baltics: 1.00,
  cis:     0.60,
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
export const FORMAT_OPTIONS: Format[] = ['individual', 'pair', 'group']
export const DISCOUNTS: Record<LessonsCount, string> = {
  1: '',
  4: '-5%',
  8: '-10%',
  12: '-15%',
}
