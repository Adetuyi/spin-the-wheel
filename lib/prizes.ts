export type Prize = {
  slug: string
  name: string
  emoji: string
  maxQty: number | null // null = unlimited
  weight: number
  color: string
  textColor: string
  isPhysical: boolean // true = staff must hand it out
}

export const PRIZES: Prize[] = [
  {
    slug: 'airtime_500',
    name: 'Airtime ₦500',
    emoji: '📱',
    maxQty: 60,
    weight: 10,
    color: '#47F7AD',
    textColor: '#153853',
    isPhysical: false,
  },
  {
    slug: 'airtime_1000',
    name: 'Airtime ₦1,000',
    emoji: '💳',
    maxQty: 20,
    weight: 5,
    color: '#2DD4BF',
    textColor: '#153853',
    isPhysical: false,
  },
  {
    slug: 'mas_label',
    name: '100K MAS Label',
    emoji: '🏷️',
    maxQty: 20,
    weight: 3,
    color: '#F59E0B',
    textColor: '#153853',
    isPhysical: true,
  },
  {
    slug: 'chektrace_pilot',
    name: 'Chektrace Pilot',
    emoji: '🚀',
    maxQty: 10,
    weight: 2,
    color: '#8B5CF6',
    textColor: '#ffffff',
    isPhysical: true,
  },
  {
    slug: 'notepad',
    name: 'Notepad',
    emoji: '📒',
    maxQty: 50,
    weight: 15,
    color: '#1E6B8C',
    textColor: '#ffffff',
    isPhysical: true,
  },
  {
    slug: 'pen',
    name: 'Smart Pen',
    emoji: '🖊️',
    maxQty: 25,
    weight: 18,
    color: '#0E4D6E',
    textColor: '#47F7AD',
    isPhysical: true,
  },
  {
    slug: 'key_holder',
    name: 'Key Holder',
    emoji: '🔑',
    maxQty: 25,
    weight: 18,
    color: '#1A5C7A',
    textColor: '#47F7AD',
    isPhysical: true,
  },
  {
    slug: 'no_prize',
    name: 'Ouch! Bye 👋',
    emoji: '😢',
    maxQty: null,
    weight: 21,
    color: '#1E3A4F',
    textColor: '#6B8EA3',
    isPhysical: false,
  },
  {
    slug: 'spin_again',
    name: 'Spin Again!',
    emoji: '🔁',
    maxQty: null,
    weight: 8,
    color: '#FF6B6B',
    textColor: '#ffffff',
    isPhysical: false,
  },
]

export function getPrizeBySlug(slug: string): Prize | undefined {
  return PRIZES.find((p) => p.slug === slug)
}

/** Returns prizes still available (stock not exhausted), given current counts */
export function getAvailablePrizes(spentCounts: Record<string, number>): Prize[] {
  return PRIZES.filter((prize) => {
    if (prize.maxQty === null) return true
    return (spentCounts[prize.slug] ?? 0) < prize.maxQty
  })
}

/** Weighted random pick from available prizes */
export function pickPrize(available: Prize[]): Prize {
  const totalWeight = available.reduce((sum, p) => sum + p.weight, 0)
  let rand = Math.random() * totalWeight
  for (const prize of available) {
    rand -= prize.weight
    if (rand <= 0) return prize
  }
  return available[available.length - 1]
}
