"use client"

import { CardContent } from "@/components/ui/card"
import { Card } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Crown, Trophy, Medal, Award, X } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { getProfileImage, getInitials } from "../utils/profile-images"
import type { MonthlySignupData, YearlyRevenueData } from "../lib/google-sheets"

interface EnhancedVideoDisplayProps {
  monthlySignupLeaders: MonthlySignupData[]
  yearlyRevenueLeaders: YearlyRevenueData[]
  isActive: boolean
  onClose: () => void
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 1000 : -1000,
    opacity: 0,
  }),
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    transition: {
      delay: i * 0.1,
    },
  }),
}

export function EnhancedVideoDisplay({
  monthlySignupLeaders,
  yearlyRevenueLeaders,
  isActive,
  onClose,
}: EnhancedVideoDisplayProps) {
  const [isClient, setIsClient] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const slides = [
    { type: "intro", duration: 5000 },
    { type: "monthly-signups", duration: 10000 },
    { type: "yearly-revenue", duration: 10000 },
  ]
  const [[page, direction], setPage] = useState([0, 0])

  useEffect(() => {
    setIsClient(true)
    setCurrentDate(new Date())
  }, [])

  useEffect(() => {
    if (!isActive) return
    const timer = setTimeout(() => {
      setPage(([prevPage]) => [(prevPage + 1) % slides.length, 1])
    }, slides[page].duration)
    return () => clearTimeout(timer)
  }, [page, isActive, slides])

  if (!isActive) return null

  const renderRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-8 w-8 text-yellow-400" />
    if (rank === 2) return <Trophy className="h-7 w-7 text-gray-300" />
    if (rank === 3) return <Medal className="h-6 w-6 text-amber-500" />
    return <Award className="h-5 w-5 text-gray-400" />
  }

  const renderIntro = () => (
    <div className="flex flex-col items-center justify-center h-full text-center text-white">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <Crown className="h-32 w-32 text-yellow-400 drop-shadow-lg" />
      </motion.div>
      <motion.h1
        className="text-7xl font-bold mt-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        Roof-ER's Performance Champions
      </motion.h1>
      <motion.p
        className="text-3xl text-gray-300 mt-2"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        Celebrating Our Top Performers
      </motion.p>
    </div>
  )

  const renderLeaderboard = (
    title: string,
    subtitle: string,
    leaders: (MonthlySignupData | YearlyRevenueData)[],
    metric: "signups" | "revenue",
  ) => (
    <div className="p-8 h-full flex flex-col">
      <div className="text-center mb-8">
        <h2 className="text-5xl font-bold text-white">{title}</h2>
        <p className="text-2xl text-gray-400">{subtitle}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-grow">
        {leaders.slice(0, 6).map((leader, i) => (
          <motion.div key={leader.name} custom={i} variants={itemVariants} initial="hidden" animate="visible">
            <Card className="bg-white/10 border-white/20 text-white h-full">
              <CardContent className="p-4 flex items-center">
                <div className="mr-4 text-3xl font-bold w-10 text-center">{renderRankIcon(leader.rank)}</div>
                <Avatar className="h-12 w-12 mr-4">
                  <AvatarImage src={getProfileImage(leader.name) || "/placeholder.svg"} />
                  <AvatarFallback>{getInitials(leader.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-grow">
                  <p className="font-bold text-lg">{leader.name}</p>
                  <p className="text-gray-300">
                    {metric === "signups"
                      ? `${(leader as MonthlySignupData).signups} Signups`
                      : isClient
                        ? `$${(leader as YearlyRevenueData).total.toLocaleString()} Revenue`
                        : `$${(leader as YearlyRevenueData).total}`}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )

  const renderSlideContent = () => {
    switch (slides[page].type) {
      case "monthly-signups":
        return renderLeaderboard(
          "Monthly Signup Leaders",
          isClient ? currentDate.toLocaleString("default", { month: "long", year: "numeric" }) : "",
          monthlySignupLeaders,
          "signups",
        )
      case "yearly-revenue":
        return renderLeaderboard("Yearly Revenue Champions", "Year-to-Date", yearlyRevenueLeaders, "revenue")
      default:
        return renderIntro()
    }
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 to-red-900 z-50 overflow-hidden">
      <Button onClick={onClose} variant="ghost" size="icon" className="absolute top-4 right-4 z-20 text-white">
        <X />
      </Button>
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={page}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          }}
          className="absolute inset-0"
        >
          {renderSlideContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
