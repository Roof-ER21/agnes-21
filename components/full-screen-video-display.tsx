"use client"

import { useState, useEffect } from "react"
import { X, Trophy, TrendingUp, Users, Award, Crown, Star } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { MonthlySignupData, YearlyRevenueData } from "../lib/google-sheets"
import type { User } from "../types/user"

interface FullScreenVideoDisplayProps {
  monthlySignupLeaders: MonthlySignupData[]
  yearlyRevenueLeaders: YearlyRevenueData[]
  users: User[]
  isActive: boolean
  onClose: () => void
}

export function FullScreenVideoDisplay({
  monthlySignupLeaders = [],
  yearlyRevenueLeaders = [],
  users = [],
  isActive,
  onClose,
}: FullScreenVideoDisplayProps) {
  const [isClient, setIsClient] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [currentSlide, setCurrentSlide] = useState(0)
  const [slideProgress, setSlideProgress] = useState(0)

  const SLIDE_DURATION = 8000 // 8 seconds per slide
  const PROGRESS_INTERVAL = 50 // Update progress every 50ms

  useEffect(() => {
    setIsClient(true)
    setCurrentDate(new Date())
  }, [])

  const slides = [
    { id: "header", title: "Roof-ER's Millionaire Club", subtitle: "Performance Leaderboard" },
    {
      id: "monthly-signups",
      title: "Monthly Signup Leaders",
      subtitle: isClient ? currentDate.toLocaleString("default", { month: "long", year: "numeric" }) : "",
    },
    { id: "yearly-revenue", title: "Yearly Revenue Leaders", subtitle: "2025 Year-to-Date" },
  ]

  useEffect(() => {
    if (!isActive) {
      setCurrentSlide(0)
      setSlideProgress(0)
      return
    }

    const progressTimer = setInterval(() => {
      setSlideProgress((prev) => {
        const newProgress = prev + (PROGRESS_INTERVAL / SLIDE_DURATION) * 100
        if (newProgress >= 100) {
          setCurrentSlide((prevSlide) => (prevSlide + 1) % slides.length)
          return 0
        }
        return newProgress
      })
    }, PROGRESS_INTERVAL)

    return () => clearInterval(progressTimer)
  }, [isActive, currentSlide, slides.length])

  if (!isActive) return null

  const renderHeaderSlide = () => (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-8">
      <div className="relative">
        <Crown className="h-32 w-32 text-yellow-400 drop-shadow-2xl animate-pulse" />
        <div className="absolute -top-4 -right-4">
          <Star className="h-12 w-12 text-yellow-300 animate-spin" style={{ animationDuration: "3s" }} />
        </div>
      </div>
      <div className="space-y-4">
        <h1 className="text-8xl font-bold text-white drop-shadow-2xl tracking-tight">Roof-ER's</h1>
        <h2 className="text-6xl font-bold text-yellow-400 drop-shadow-2xl">Millionaire Club</h2>
        <p className="text-3xl text-gray-200 font-medium mt-8">Performance Leaderboard</p>
      </div>
      <div className="flex items-center space-x-4 text-2xl text-gray-300">
        <Trophy className="h-8 w-8" />
        <span>Excellence in Sales</span>
        <TrendingUp className="h-8 w-8" />
      </div>
    </div>
  )

  const renderMonthlySignupsSlide = () => (
    <div className="h-full flex flex-col">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center space-x-4 mb-4">
          <Users className="h-16 w-16 text-blue-400" />
          <h1 className="text-7xl font-bold text-white drop-shadow-2xl">Monthly Signup Leaders</h1>
        </div>
        <p className="text-3xl text-gray-300">
          {isClient ? currentDate.toLocaleString("default", { month: "long", year: "numeric" }) : ""}
        </p>
      </div>
      <div className="flex-1 grid grid-cols-2 gap-8 px-16">
        {monthlySignupLeaders.slice(0, 10).map((leader, index) => {
          const isTopThree = index < 3
          const rankColors = ["text-yellow-400", "text-gray-300", "text-orange-400"]
          const bgColors = [
            "bg-gradient-to-r from-yellow-600/20 to-yellow-400/20",
            "bg-gradient-to-r from-gray-600/20 to-gray-400/20",
            "bg-gradient-to-r from-orange-600/20 to-orange-400/20",
          ]
          return (
            <Card
              key={leader.name}
              className={`${isTopThree ? bgColors[index] : "bg-white/10"} border-2 ${isTopThree ? "border-white/30" : "border-white/20"} backdrop-blur-sm transform hover:scale-105 transition-all duration-300`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className={`text-4xl font-bold ${isTopThree ? rankColors[index] : "text-white"}`}>
                      #{leader.rank}
                    </div>
                    {isTopThree && <Trophy className={`h-8 w-8 ${rankColors[index]}`} />}
                  </div>
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-200 text-lg px-4 py-2">
                    {leader.signups} signups
                  </Badge>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{leader.name}</h3>
                {leader.bonus && leader.bonus > 0 && (
                  <div className="flex items-center space-x-2">
                    <Award className="h-5 w-5 text-green-400" />
                    <span className="text-green-400 font-semibold text-lg">
                      ${isClient ? leader.bonus.toLocaleString() : leader.bonus} bonus
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
      {monthlySignupLeaders.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <Users className="h-24 w-24 mx-auto mb-4 opacity-50" />
            <p className="text-2xl">No signup data available</p>
            <p className="text-lg">Sync with Google Sheets to see leaders</p>
          </div>
        </div>
      )}
    </div>
  )

  const renderYearlyRevenueSlide = () => (
    <div className="h-full flex flex-col">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center space-x-4 mb-4">
          <TrendingUp className="h-16 w-16 text-green-400" />
          <h1 className="text-7xl font-bold text-white drop-shadow-2xl">Yearly Revenue Leaders</h1>
        </div>
        <p className="text-3xl text-gray-300">2025 Year-to-Date</p>
      </div>
      <div className="flex-1 grid grid-cols-2 gap-8 px-16">
        {yearlyRevenueLeaders.slice(0, 10).map((leader, index) => {
          const isTopThree = index < 3
          const rankColors = ["text-yellow-400", "text-gray-300", "text-orange-400"]
          const bgColors = [
            "bg-gradient-to-r from-yellow-600/20 to-yellow-400/20",
            "bg-gradient-to-r from-gray-600/20 to-gray-400/20",
            "bg-gradient-to-r from-orange-600/20 to-orange-400/20",
          ]
          return (
            <Card
              key={leader.name}
              className={`${isTopThree ? bgColors[index] : "bg-white/10"} border-2 ${isTopThree ? "border-white/30" : "border-white/20"} backdrop-blur-sm transform hover:scale-105 transition-all duration-300`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className={`text-4xl font-bold ${isTopThree ? rankColors[index] : "text-white"}`}>
                      #{leader.rank}
                    </div>
                    {isTopThree && <Trophy className={`h-8 w-8 ${rankColors[index]}`} />}
                  </div>
                  <Badge variant="secondary" className="bg-green-500/20 text-green-200 text-lg px-4 py-2">
                    ${isClient ? leader.total.toLocaleString() : leader.total}
                  </Badge>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{leader.name}</h3>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                  <span className="text-green-400 font-semibold text-lg">Revenue Leader</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      {yearlyRevenueLeaders.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <TrendingUp className="h-24 w-24 mx-auto mb-4 opacity-50" />
            <p className="text-2xl">No revenue data available</p>
            <p className="text-lg">Sync with Google Sheets to see leaders</p>
          </div>
        </div>
      )}
    </div>
  )

  const renderCurrentSlide = () => {
    const slide = slides[currentSlide]
    switch (slide.id) {
      case "header":
        return renderHeaderSlide()
      case "monthly-signups":
        return renderMonthlySignupsSlide()
      case "yearly-revenue":
        return renderYearlyRevenueSlide()
      default:
        return renderHeaderSlide()
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <Button
        onClick={onClose}
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-10 text-white hover:bg-white/20 h-12 w-12"
      >
        <X className="h-6 w-6" />
      </Button>
      <div className="absolute top-0 left-0 w-full h-2 bg-black/30">
        <div
          className="h-full bg-gradient-to-r from-blue-400 to-purple-400 transition-all duration-75 ease-linear"
          style={{ width: `${slideProgress}%` }}
        />
      </div>
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentSlide(index)
              setSlideProgress(0)
            }}
            className={`w-4 h-4 rounded-full transition-all duration-300 ${
              index === currentSlide ? "bg-white scale-125" : "bg-white/50 hover:bg-white/75"
            }`}
          />
        ))}
      </div>
      <div className="h-full p-8">{renderCurrentSlide()}</div>
    </div>
  )
}
