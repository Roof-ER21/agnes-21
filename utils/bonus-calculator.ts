export interface BonusTier {
  level: number
  title: string
  minSignups: number
  bonusAmount: number
  emoji: string
}

export const bonusTiers: BonusTier[] = [
  { level: 1, title: "Spark Starter", minSignups: 5, bonusAmount: 100, emoji: "✨" },
  { level: 2, title: "Momentum Maker", minSignups: 10, bonusAmount: 250, emoji: "🚀" },
  { level: 3, title: "Growth Guru", minSignups: 20, bonusAmount: 600, emoji: "💡" },
  { level: 4, title: "Sales Samurai", minSignups: 30, bonusAmount: 1200, emoji: "⚔️" },
  { level: 5, title: "Deal Dominator", minSignups: 50, bonusAmount: 2500, emoji: "👑" },
]

export function calculateBonus(signups: number): number {
  let totalBonus = 0
  for (const tier of bonusTiers) {
    if (signups >= tier.minSignups) {
      totalBonus = tier.bonusAmount
    } else {
      break
    }
  }
  return totalBonus
}

export function getCurrentTier(signups: number): BonusTier | null {
  let currentTier: BonusTier | null = null
  for (const tier of bonusTiers) {
    if (signups >= tier.minSignups) {
      currentTier = tier
    } else {
      break
    }
  }
  return currentTier
}

export function getNextTier(signups: number): BonusTier | null {
  for (const tier of bonusTiers) {
    if (signups < tier.minSignups) {
      return tier
    }
  }
  return null
}
