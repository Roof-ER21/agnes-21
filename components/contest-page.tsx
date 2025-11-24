"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Gift, Trophy, Calendar, Users, Plus, Crown, Medal, Award, History, Target } from "lucide-react"
import type { User, Contest, ContestWinner } from "../types/user"

interface BonusWinner {
  id: string
  month: string
  year: number
  winners: {
    userId: string
    userName: string
    prize: string
    amount: number
    category: string
  }[]
}

interface ContestPageProps {
  currentUser: User
  contests: Contest[]
  allUsers: User[]
  bonusHistory: BonusWinner[]
  onCreateContest: (contestData: Omit<Contest, "id" | "createdBy">) => void
  onJoinContest: (contestId: string, userId: string) => void
  onEndContest: (contestId: string, winners: ContestWinner[]) => void
}

export function ContestPage({
  currentUser,
  contests,
  allUsers,
  bonusHistory,
  onCreateContest,
  onJoinContest,
  onEndContest,
}: ContestPageProps) {
  const [showCreateContest, setShowCreateContest] = useState(false)
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null)
  const [newContest, setNewContest] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    prize: "",
    rules: [""],
    contestType: "signups" as Contest["contestType"], // Default to signups since that's what bonuses are based on
  })
  const [filter, setFilter] = useState<"active" | "upcoming" | "completed">("active")

  const handleCreateContest = () => {
    if (newContest.title && newContest.startDate && newContest.endDate) {
      // Automatically add all eligible users (sales reps and team leads)
      const eligibleUsers = allUsers.filter((user) => user.role === "sales_rep" || user.role === "team_lead")
      const participants = eligibleUsers.map((user) => user.id)

      onCreateContest({
        ...newContest,
        participants,
        status: new Date(newContest.startDate) > new Date() ? "upcoming" : "active",
      })
      setNewContest({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        prize: "",
        rules: [""],
        contestType: "signups",
      })
      setShowCreateContest(false)
    }
  }

  const addRule = () => {
    setNewContest((prev) => ({
      ...prev,
      rules: [...prev.rules, ""],
    }))
  }

  const updateRule = (index: number, value: string) => {
    setNewContest((prev) => ({
      ...prev,
      rules: prev.rules.map((rule, i) => (i === index ? value : rule)),
    }))
  }

  const removeRule = (index: number) => {
    setNewContest((prev) => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index),
    }))
  }

  const getContestProgress = (contest: Contest) => {
    const now = new Date()
    const start = new Date(contest.startDate)
    const end = new Date(contest.endDate)

    if (now < start) return 0
    if (now > end) return 100

    const total = end.getTime() - start.getTime()
    const elapsed = now.getTime() - start.getTime()
    return (elapsed / total) * 100
  }

  const getContestLeaderboard = (contest: Contest) => {
    const participants = allUsers.filter((user) => contest.participants.includes(user.id))

    return participants.sort((a, b) => {
      switch (contest.contestType) {
        case "revenue":
          return b.currentRevenue - a.currentRevenue
        case "signups":
          return b.currentSignups - a.currentSignups
        case "streak":
          return b.streak - a.streak
        default:
          return b.currentSignups - a.currentSignups
      }
    })
  }

  const getStatusBadge = (status: Contest["status"]) => {
    switch (status) {
      case "upcoming":
        return <Badge className="bg-blue-500 text-white">Upcoming</Badge>
      case "active":
        return <Badge className="bg-green-500 text-white">Active</Badge>
      case "completed":
        return <Badge className="bg-gray-500 text-white">Completed</Badge>
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Trophy className="h-5 w-5 text-gray-400" />
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />
      default:
        return <Award className="h-4 w-4 text-gray-500" />
    }
  }

  const calculateBonus = (signups: number) => {
    if (signups >= 40) return 12000
    if (signups >= 35) return 10000
    if (signups >= 30) return 8000
    if (signups >= 25) return 6000
    if (signups >= 20) return 4000
    if (signups >= 15) return 2000
    return 0
  }

  const getParticipantProgress = (contest: Contest, userId: string) => {
    const user = allUsers.find((u) => u.id === userId)
    if (!user) return 0

    const value = contest.metric === "revenue" ? user.currentRevenue : user.currentSignups
    return (value / contest.goal) * 100
  }

  const filteredContests = contests.filter((c) => c.status === filter)

  // Get last 3 months of bonus winners
  const recentBonusHistory = bonusHistory.slice(-3)

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="text-center">
        <h1 className="text-4xl font-bold">Contests & Competitions</h1>
        <p className="text-lg text-gray-600 mt-2">Push your limits and win big!</p>
      </header>

      {/* Filter Buttons */}
      <div className="flex justify-center space-x-2">
        <Button variant={filter === "active" ? "default" : "outline"} onClick={() => setFilter("active")}>
          Active
        </Button>
        <Button variant={filter === "upcoming" ? "default" : "outline"} onClick={() => setFilter("upcoming")}>
          Upcoming
        </Button>
        <Button variant={filter === "completed" ? "default" : "outline"} onClick={() => setFilter("completed")}>
          Completed
        </Button>
      </div>

      {/* Bonus Calculation Info */}
      <Card className="border-green-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white">
          <CardTitle className="text-xl font-bold flex items-center space-x-2">
            <Target className="h-6 w-6" />
            <span>Monthly Signup Bonus Structure</span>
          </CardTitle>
          <p className="text-green-100">Earn bonuses based on your monthly signup performance</p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { signups: 15, bonus: 2000 },
              { signups: 20, bonus: 4000 },
              { signups: 25, bonus: 6000 },
              { signups: 30, bonus: 8000 },
              { signups: 35, bonus: 10000 },
              { signups: 40, bonus: 12000 },
            ].map((tier) => (
              <div key={tier.signups} className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">{tier.signups}</div>
                <div className="text-sm text-gray-600 mb-1">Signups</div>
                <div className="text-lg font-semibold text-green-700">${tier.bonus.toLocaleString()}</div>
                <div className="text-xs text-gray-500">Bonus</div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2 text-blue-800">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">
                Bonuses are calculated monthly and automatically updated via Google Sheets on the first Monday of each
                month
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Previous Bonus Winners */}
      {recentBonusHistory.length > 0 && (
        <Card className="border-yellow-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
            <CardTitle className="text-xl font-bold flex items-center space-x-2">
              <History className="h-6 w-6" />
              <span>Previous Bonus Winners - Last 3 Months</span>
            </CardTitle>
            <p className="text-yellow-100">Celebrating our recent champions</p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentBonusHistory.map((monthData) => (
                <Card key={monthData.id} className="border-gray-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-gray-900">
                      {monthData.month} {monthData.year}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {monthData.winners.map((winner, index) => (
                        <div key={winner.userId} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            {getRankIcon(index + 1)}
                            <span className="font-semibold">#{index + 1}</span>
                          </div>
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={`/generic-placeholder-graphic.png?height=40&width=40`} alt={winner.userName} />
                            <AvatarFallback className="bg-red-100 text-red-600">
                              {winner.userName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{winner.userName}</div>
                            <div className="text-sm text-gray-600">{winner.category}</div>
                            <div className="text-sm font-semibold text-green-600">
                              {winner.prize} - ${winner.amount.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Contest Modal */}
      {showCreateContest && (
        <Card className="border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Create New Contest</span>
              <Button variant="ghost" size="sm" onClick={() => setShowCreateContest(false)}>
                ✕
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Contest Title</Label>
                <Input
                  id="title"
                  value={newContest.title}
                  onChange={(e) => setNewContest((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter contest title"
                />
              </div>
              <div>
                <Label htmlFor="contestType">Contest Type</Label>
                <Select
                  value={newContest.contestType}
                  onValueChange={(value: Contest["contestType"]) =>
                    setNewContest((prev) => ({ ...prev, contestType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="signups">Signup Challenge</SelectItem>
                    <SelectItem value="revenue">Revenue Competition</SelectItem>
                    <SelectItem value="team">Team Competition</SelectItem>
                    <SelectItem value="streak">Streak Challenge</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newContest.description}
                onChange={(e) => setNewContest((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the contest..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={newContest.startDate}
                  onChange={(e) => setNewContest((prev) => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={newContest.endDate}
                  onChange={(e) => setNewContest((prev) => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="prize">Prize</Label>
                <Input
                  id="prize"
                  value={newContest.prize}
                  onChange={(e) => setNewContest((prev) => ({ ...prev, prize: e.target.value }))}
                  placeholder="e.g., $500 bonus"
                />
              </div>
            </div>

            <div>
              <Label>Contest Rules</Label>
              {newContest.rules.map((rule, index) => (
                <div key={index} className="flex items-center space-x-2 mt-2">
                  <Input
                    value={rule}
                    onChange={(e) => updateRule(index, e.target.value)}
                    placeholder={`Rule ${index + 1}`}
                  />
                  {newContest.rules.length > 1 && (
                    <Button variant="outline" size="sm" onClick={() => removeRule(index)}>
                      ✕
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addRule} className="mt-2 bg-transparent">
                <Plus className="h-4 w-4 mr-1" />
                Add Rule
              </Button>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>Note:</strong> All sales reps and team leads will be automatically enrolled in this contest.
              </div>
            </div>

            <div className="flex space-x-2">
              <Button onClick={handleCreateContest} className="bg-red-600 hover:bg-red-700">
                Create Contest
              </Button>
              <Button variant="outline" onClick={() => setShowCreateContest(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contests List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContests.map((contest) => (
          <Card key={contest.id} className="flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start">
                <Trophy className="h-8 w-8 text-yellow-500" />
                <Badge variant={contest.status === "active" ? "default" : "secondary"}>{contest.status}</Badge>
              </div>
              <CardTitle className="mt-2">{contest.title}</CardTitle>
              <CardDescription>{contest.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="space-y-4">
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>
                    {new Date(contest.startDate).toLocaleDateString()} -{" "}
                    {new Date(contest.endDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Target className="h-4 w-4 mr-2" />
                  <span>
                    Goal: {contest.goal.toLocaleString()} {contest.metric === "revenue" ? "in Revenue" : "Signups"}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Users className="h-4 w-4 mr-2" />
                  <span>{contest.participants.length} Participants</span>
                </div>
                {contest.status === "active" && contest.participants.includes(currentUser.id) && (
                  <div>
                    <p className="text-sm font-medium mb-1">Your Progress</p>
                    <Progress value={getParticipantProgress(contest, currentUser.id)} />
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              {contest.status === "upcoming" && !contest.participants.includes(currentUser.id) && (
                <Button onClick={() => onJoinContest(contest.id, currentUser.id)}>Join Contest</Button>
              )}
              {contest.status === "completed" && <Button variant="outline">View Results</Button>}
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {contests.length === 0 && (
        <Card className="border-gray-200">
          <CardContent className="text-center py-12">
            <Gift className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Contests Yet</h3>
            <p className="text-gray-600">Check back soon for exciting competitions and prizes!</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
