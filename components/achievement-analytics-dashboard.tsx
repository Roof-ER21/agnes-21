"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts"
import { Trophy, TrendingUp, Users, DollarSign, Award, Target, Medal, Crown } from "lucide-react"
import type { User } from "../types/user"
import type { CustomAchievement } from "../types/achievement"

interface AchievementAnalyticsDashboardProps {
  users: User[]
  achievements: CustomAchievement[]
  onCreateAchievement?: (achievement: Omit<CustomAchievement, "id" | "createdAt" | "updatedAt">) => void
}

export function AchievementAnalyticsDashboard({
  users,
  achievements,
  onCreateAchievement,
}: AchievementAnalyticsDashboardProps) {
  const [timeframe, setTimeframe] = useState("30")

  // Use passed achievements if available, otherwise show sample data for demo
  // Sample achievement data for demonstration when no real data exists
  const sampleAchievements: CustomAchievement[] = [
    {
      id: "1",
      name: "Revenue Champion",
      description: "Achieve $50,000+ in monthly revenue",
      isActive: true,
      conditions: [
        {
          field: "revenue",
          operator: "gte",
          value: 50000,
          timeframe: "current_month",
        },
      ],
      rewards: {
        bonusAmount: 2000,
        points: 500,
        title: "Revenue Champion",
        privileges: [],
      },
      limits: { maxEarners: 5, resetPeriod: "monthly" },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "2",
      name: "Signup Master",
      description: "Get 25+ signups in a month",
      isActive: true,
      conditions: [
        {
          field: "signups",
          operator: "gte",
          value: 25,
          timeframe: "current_month",
        },
      ],
      rewards: {
        bonusAmount: 1000,
        points: 300,
        title: "Signup Master",
        privileges: [],
      },
      limits: { maxEarners: 10, resetPeriod: "monthly" },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "3",
      name: "Improvement Star",
      description: "Show 25%+ improvement from last month",
      isActive: true,
      conditions: [
        {
          field: "improvement",
          operator: "gte",
          value: 25,
          timeframe: "current_month",
        },
      ],
      rewards: {
        bonusAmount: 750,
        points: 200,
        title: "Rising Star",
        privileges: [],
      },
      limits: { maxEarners: 15, resetPeriod: "monthly" },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]

  // Use props or fall back to sample data
  const displayAchievements = achievements && achievements.length > 0 ? achievements : sampleAchievements
  const isUsingDemoData = !achievements || achievements.length === 0

  // Sample earned achievements data (only used in demo mode)
  const sampleEarnedAchievements = [
    { userId: "1", achievementId: "1", earnedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
    { userId: "2", achievementId: "1", earnedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
    { userId: "3", achievementId: "2", earnedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
    { userId: "1", achievementId: "3", earnedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { userId: "4", achievementId: "2", earnedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  ]

  // In demo mode, use sample data; otherwise, build earned achievements from users
  const earnedAchievements = isUsingDemoData
    ? sampleEarnedAchievements
    : users.flatMap(user =>
        user.achievements.map(ach => ({
          userId: user.id,
          achievementId: ach.id || ach.title,
          earnedAt: ach.unlockedAt || new Date().toISOString()
        }))
      )

  const activeAchievements = displayAchievements.filter((a) => a.isActive)
  const totalEarned = earnedAchievements.length
  const totalRewards = earnedAchievements.reduce((sum, earned) => {
    const achievement = displayAchievements.find((a) => a.id === earned.achievementId)
    return sum + (achievement?.rewards.bonusAmount || 0)
  }, 0)
  const engagementRate =
    users.length > 0 ? (new Set(earnedAchievements.map((e) => e.userId)).size / users.length) * 100 : 0

  // Achievement categories for overview
  const achievementCategories = [
    { name: "Performance", count: 8, color: "#3B82F6", icon: Trophy },
    { name: "Improvement", count: 5, color: "#10B981", icon: TrendingUp },
    { name: "Consistency", count: 3, color: "#F59E0B", icon: Target },
    { name: "Team Leadership", count: 2, color: "#8B5CF6", icon: Crown },
  ]

  // Most popular achievements
  const popularAchievements = displayAchievements
    .map((achievement) => {
      const earnedCount = earnedAchievements.filter((e) => e.achievementId === achievement.id).length
      const successRate = users.length > 0 ? (earnedCount / users.length) * 100 : 0
      return {
        ...achievement,
        earnedCount,
        successRate,
      }
    })
    .sort((a, b) => b.earnedCount - a.earnedCount)

  // Performance data for charts
  const performanceData = displayAchievements.map((achievement) => ({
    name: achievement.name.substring(0, 15) + "...",
    earned: earnedAchievements.filter((e) => e.achievementId === achievement.id).length,
    successRate:
      users.length > 0
        ? (earnedAchievements.filter((e) => e.achievementId === achievement.id).length / users.length) * 100
        : 0,
    rewards:
      earnedAchievements.filter((e) => e.achievementId === achievement.id).length *
      (achievement.rewards.bonusAmount || 0),
  }))

  // Trends data (mock monthly data)
  const trendsData = [
    { month: "Jan", achievements: 12, rewards: 8500, uniqueEarners: 8 },
    { month: "Feb", achievements: 18, rewards: 12000, uniqueEarners: 12 },
    { month: "Mar", achievements: 25, rewards: 16500, uniqueEarners: 15 },
    { month: "Apr", achievements: 22, rewards: 14000, uniqueEarners: 14 },
    { month: "May", achievements: 30, rewards: 19500, uniqueEarners: 18 },
    { month: "Jun", achievements: 35, rewards: 23000, uniqueEarners: 20 },
  ]

  // Top earners leaderboard
  const topEarners = users
    .map((user) => {
      const userAchievements = earnedAchievements.filter((e) => e.userId === user.id)
      const userTotalRewards = userAchievements.reduce((sum, earned) => {
        const achievement = displayAchievements.find((a) => a.id === earned.achievementId)
        return sum + (achievement?.rewards.bonusAmount || 0)
      }, 0)
      const lastEarned =
        userAchievements.length > 0 ? Math.max(...userAchievements.map((e) => new Date(e.earnedAt).getTime())) : 0

      return {
        ...user,
        achievementCount: userAchievements.length,
        totalRewards: userTotalRewards,
        lastEarned: lastEarned > 0 ? new Date(lastEarned) : null,
      }
    })
    .sort((a, b) => b.achievementCount - a.achievementCount)

  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444", "#06B6D4"]

  const totalAchievements = users.reduce((sum, user) => sum + user.achievements.length, 0)
  const usersWithAchievements = users.filter((user) => user.achievements.length > 0).length

  const achievementCounts: { [key: string]: number } = {}
  users.forEach((user) => {
    user.achievements.forEach((ach) => {
      achievementCounts[ach.title] = (achievementCounts[ach.title] || 0) + 1
    })
  })

  const mostCommonAchievement = Object.entries(achievementCounts).sort((a, b) => b[1] - a[1])[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Achievement Analytics</h2>
          <p className="text-gray-600">Track performance and engagement across all achievements</p>
        </div>
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Achievements</p>
                <p className="text-3xl font-bold text-gray-900">{activeAchievements.length}</p>
                <p className="text-sm text-gray-500">{displayAchievements.length - activeAchievements.length} inactive{isUsingDemoData && " (demo)"}</p>
              </div>
              <Award className="h-12 w-12 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Earned</p>
                <p className="text-3xl font-bold text-gray-900">{totalEarned}</p>
                <p className="text-sm text-green-600">+{Math.floor(totalEarned * 0.15)} this month</p>
              </div>
              <Trophy className="h-12 w-12 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rewards Distributed</p>
                <p className="text-3xl font-bold text-gray-900">${totalRewards.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Across all achievements</p>
              </div>
              <DollarSign className="h-12 w-12 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Engagement Rate</p>
                <p className="text-3xl font-bold text-gray-900">{engagementRate.toFixed(1)}%</p>
                <p className="text-sm text-gray-500">Users earning achievements</p>
              </div>
              <Users className="h-12 w-12 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        {/* New Key Metrics */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Achievements Earned</p>
                <p className="text-3xl font-bold text-gray-900">{totalAchievements}</p>
              </div>
              <Award className="h-12 w-12 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Users with Achievements</p>
                <p className="text-3xl font-bold text-gray-900">{usersWithAchievements}</p>
              </div>
              <Users className="h-12 w-12 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Most Common Achievement</p>
                <p className="text-3xl font-bold text-gray-900">
                  {mostCommonAchievement ? mostCommonAchievement[0] : "N/A"}
                </p>
              </div>
              <Trophy className="h-12 w-12 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Achievement Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Achievement Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {achievementCategories.map((category) => (
                    <div key={category.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                        <category.icon className="h-5 w-5 text-gray-600" />
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">{category.count}</Badge>
                        <div className="w-24">
                          <Progress value={(category.count / 18) * 100} className="h-2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Most Popular Achievements */}
            <Card>
              <CardHeader>
                <CardTitle>Most Popular Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {popularAchievements.slice(0, 5).map((achievement, index) => (
                    <div key={achievement.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                          <span className="text-sm font-bold text-gray-600">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{achievement.name}</p>
                          <p className="text-sm text-gray-500">{achievement.earnedCount} earned</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{achievement.successRate.toFixed(1)}%</p>
                        <p className="text-xs text-gray-500">success rate</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Success Rate Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Achievement Success Rates</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="successRate" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Reward Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Reward Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={performanceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: $${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="rewards"
                    >
                      {performanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Monthly Achievement Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Achievement Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={trendsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="achievements" stroke="#3B82F6" strokeWidth={2} />
                    <Line type="monotone" dataKey="uniqueEarners" stroke="#10B981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Rewards Distribution Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Rewards Distribution Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trendsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="rewards" stroke="#F59E0B" fill="#FEF3C7" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Achievement Earners</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topEarners.slice(0, 10).map((user, index) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold">
                        {index === 0 && <Crown className="h-5 w-5" />}
                        {index === 1 && <Medal className="h-5 w-5" />}
                        {index === 2 && <Trophy className="h-5 w-5" />}
                        {index > 2 && <span>#{index + 1}</span>}
                      </div>

                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.profilePicture || "/placeholder.svg"} alt={user.name} />
                        <AvatarFallback>
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>

                      <div>
                        <h4 className="font-semibold text-gray-900">{user.name}</h4>
                        <p className="text-sm text-gray-600">{user.role.replace("_", " ")}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="text-sm text-gray-600">Achievements</p>
                          <p className="text-2xl font-bold text-gray-900">{user.achievementCount}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Rewards</p>
                          <p className="text-2xl font-bold text-green-600">${user.totalRewards.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Last Earned</p>
                          <p className="text-sm text-gray-900">
                            {user.lastEarned ? user.lastEarned.toLocaleDateString() : "Never"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
