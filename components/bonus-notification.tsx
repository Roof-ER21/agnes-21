"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, PartyPopper } from "lucide-react"
import type { BonusTier } from "../utils/bonus-calculator"

interface BonusNotificationProps {
  tier: BonusTier
  userName: string
  onDismiss: () => void
}

export function BonusNotification({ tier, userName, onDismiss }: BonusNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    const timer = setTimeout(() => {
      handleDismiss()
    }, 8000) // Auto-dismiss after 8 seconds

    return () => clearTimeout(timer)
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(onDismiss, 300) // Allow for fade-out animation
  }

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 transition-all duration-300 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
      }`}
    >
      <Card className="w-80 shadow-2xl bg-gradient-to-br from-green-400 to-teal-500 text-white">
        <CardContent className="p-4">
          <div className="flex items-start">
            <PartyPopper className="h-10 w-10 mr-4 text-yellow-300" />
            <div className="flex-grow">
              <h3 className="font-bold text-lg">Bonus Tier Unlocked!</h3>
              <p className="text-sm">
                Congrats, {userName}! You've reached the {tier.title} tier ({tier.minSignups} signups) and earned a $
                {tier.bonusAmount} bonus!
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="h-6 w-6 text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
