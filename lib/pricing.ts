// Server-side only — never import from client components

export type Format = 'individual' | 'pair' | 'group'
export type LessonsCount = 1 | 4 | 8 | 12

// Base price per person per lesson (before tier multiplier)
const BASE_PRICES: Record<Format, Record<LessonsCount, number>> = {
  individual: { 1: 28, 4: 27, 8: 25, 12: 24 },
  pair:       { 1: 20, 4: 19, 8: 18, 12: 17 },
  group:      { 1: 15, 4: 14, 8: 14, 12: 13 },
}

const STUDENTS_COUNT: Record<Format, number> = {
  individual: 1,
  pair: 2,
  group: 5,
}

const TIER_MULTIPLIERS: Record<'rich' | 'normal' | 'poor', number> = {
  rich:   1.20,
  normal: 1.00,
  poor:   0.80,
}

export function getPricePerLesson(
  format: Format,
  lessons: LessonsCount,
  tier: 'rich' | 'normal' | 'poor' = 'normal'
): number {
  const base = BASE_PRICES[format][lessons]
  return Math.round(base * TIER_MULTIPLIERS[tier] * 100) / 100
}

export function getStudentsCount(format: Format): number {
  return STUDENTS_COUNT[format]
}

export function getTotalAmount(
  format: Format,
  lessons: LessonsCount,
  tier: 'rich' | 'normal' | 'poor' = 'normal'
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
