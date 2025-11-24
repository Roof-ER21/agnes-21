import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getCurrentTier, getNextTier } from "../utils/bonus-calculator"
import type { User } from "../types/user"

interface BonusTrackerProps {
  currentUser: User
}

export function BonusTracker({ currentUser }: BonusTrackerProps) {
  const currentTier = getCurrentTier(currentUser.currentSignups)
  const nextTier = getNextTier(currentUser.currentSignups)

  const progress = nextTier ? (currentUser.currentSignups / nextTier.minSignups) * 100 : 100

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bonus Tier Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {currentTier ? (
            <div className="text-center p-4 bg-green-100 rounded-lg">
              <span className="text-4xl">{currentTier.emoji}</span>
              <h3 className="text-xl font-bold text-green-800 mt-2">{currentTier.title}</h3>
              <p className="text-green-600">You've unlocked a ${currentTier.bonusAmount.toLocaleString()} bonus!</p>
            </div>
          ) : (
            <div className="text-center p-4 bg-gray-100 rounded-lg">
              <h3 className="text-xl font-bold text-gray-800">Keep Pushing!</h3>
              <p className="text-gray-600">Your next bonus tier is within reach.</p>
            </div>
          )}

          <div>
            <div className="flex justify-between mb-1 text-sm">
              <span>{currentUser.currentSignups} Signups</span>
              {nextTier && <span>Next Tier: {nextTier.minSignups} Signups</span>}
            </div>
            <Progress value={progress} />
            {nextTier && (
              <p className="text-center text-sm text-gray-500 mt-2">
                Only {nextTier.minSignups - currentUser.currentSignups} more signups to unlock a $
                {nextTier.bonusAmount.toLocaleString()} bonus!
              </p>
            )}
            {!nextTier && currentTier && (
              <p className="text-center text-sm text-green-600 mt-2">
                You've reached the highest bonus tier! Amazing work!
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
