"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Trophy,
  Medal,
  Award,
  Crown,
  DollarSign,
  Users,
  Star,
  Database,
  RefreshCw,
  Settings,
  AlertCircle,
  TrendingUp,
} from "lucide-react"
import type { User as UserType } from "../types/user"
import { GoogleSheetsService, getCurrentMonthName, formatMonthName } from "../lib/google-sheets"
import { getProfileImage, getInitials } from "../utils/profile-images"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"

interface LeaderboardPageProps {
  users: UserType[]
  currentUser?: UserType | null
  onUpdateUserFromSheets?: (updates: { userId: string; signups: number; revenue: number }[]) => void
}

interface LeaderboardEntry {
  name: string
  signups: {
    [month: string]: number
    total: number
  }
  revenue: {
    [month: string]: number
    total: number
  }
  currentMonthSignups: number
  currentMonthRevenue: number
}

export function LeaderboardPage({ users, currentUser = null, onUpdateUserFromSheets }: LeaderboardPageProps) {
  const [isClient, setIsClient] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null)
  const [sortBy, setSortBy] = useState<"revenue" | "signups">("revenue")

  // Google Sheets Integration
  const [sheetsData, setSheetsData] = useState<LeaderboardEntry[]>([])
  const [isLoadingSheets, setIsLoadingSheets] = useState(false)
  const [sheetsError, setSheetsError] = useState<string | null>(null)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthName())
  const months = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ]

  // Configuration state
  const [config, setConfig] = useState({
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY || "",
    spreadsheetId: process.env.NEXT_PUBLIC_GOOGLE_SHEETS_ID || "",
  })

  useEffect(() => {
    setIsClient(true)
    if (config.apiKey && config.spreadsheetId) {
      fetchSheetsData()
    }
  }, [])

  // Sort users by selected metric
  const sortedUsers = [...users].sort((a, b) => {
    if (sortBy === "revenue") {
      return b.currentRevenue - a.currentRevenue
    }
    return b.currentSignups - a.currentSignups
  })

  const fetchSheetsData = async () => {
    if (!config.apiKey || !config.spreadsheetId) {
      setSheetsError("Please configure Google Sheets via the Admin Panel.")
      return
    }

    setIsLoadingSheets(true)
    setSheetsError(null)

    try {
      const sheetsService = new GoogleSheetsService(config.apiKey, config.spreadsheetId)
      const { signups, revenue } = await sheetsService.getCombinedData()

      const nameMap = new Map<string, LeaderboardEntry>()

      signups.forEach((signup) => {
        const entry: LeaderboardEntry = {
          name: signup.name,
          signups: { ...signup },
          revenue: { total: 0 },
          currentMonthSignups: (signup[selectedMonth as keyof typeof signup] as number) || 0,
          currentMonthRevenue: 0,
        }
        nameMap.set(signup.name, entry)
      })

      revenue.forEach((rev) => {
        const existing = nameMap.get(rev.name)
        if (existing) {
          existing.revenue = { ...rev }
          existing.currentMonthRevenue = (rev[selectedMonth as keyof typeof rev] as number) || 0
        } else {
          const entry: LeaderboardEntry = {
            name: rev.name,
            signups: { total: 0 },
            revenue: { ...rev },
            currentMonthSignups: 0,
            currentMonthRevenue: (rev[selectedMonth as keyof typeof rev] as number) || 0,
          }
          nameMap.set(rev.name, entry)
        }
      })

      const sortedData = Array.from(nameMap.values()).sort((a, b) => {
        if (sortBy === "signups") {
          return selectedMonth === "total"
            ? b.signups.total - a.signups.total
            : b.currentMonthSignups - a.currentMonthSignups
        } else {
          return selectedMonth === "total"
            ? b.revenue.total - a.revenue.total
            : b.currentMonthRevenue - a.currentMonthRevenue
        }
      })

      setSheetsData(sortedData)
      setLastSync(new Date())

      if (onUpdateUserFromSheets) {
        const updates = sortedData.map((entry) => ({
          userId: entry.name,
          signups: entry.currentMonthSignups,
          revenue: entry.currentMonthRevenue,
        }))
        onUpdateUserFromSheets(updates)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch data"
      setSheetsError(errorMessage)
    } finally {
      setIsLoadingSheets(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-red-800" />
      case 2:
        return <Trophy className="h-6 w-6 text-gray-400" />
      case 3:
        return <Medal className="h-6 w-6 text-amber-600" />
      default:
        return <Award className="h-5 w-5 text-gray-500" />
    }
  }

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-red-600 to-red-800 text-white"
      case 2:
        return "bg-gradient-to-r from-gray-300 to-gray-500 text-white"
      case 3:
        return "bg-gradient-to-r from-amber-400 to-amber-600 text-white"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case "badge":
        return <Award className="h-4 w-4 text-yellow-500" />
      case "milestone":
        return <Star className="h-4 w-4 text-blue-500" />
      case "award":
        return <Trophy className="h-4 w-4 text-gold-500" />
      case "bonus":
        return <DollarSign className="h-4 w-4 text-green-500" />
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

  // Check if user is admin
  const isCurrentUserAdmin = currentUser && currentUser.role === "admin"

  return (
    <div className="space-y-6">
      <Card className="border-red-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-red-600 to-red-700 text-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center space-x-2">
                <Trophy className="h-8 w-8" />
                <span>Roof-ER Leaderboard</span>
              </CardTitle>
              <p className="text-red-100">Top performers leading the way to success</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {sheetsError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-2 text-red-800">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">Google Sheets Error:</span>
                <pre className="mt-1 text-sm whitespace-pre-wrap">{sheetsError}</pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="border-red-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Monthly Revenue</div>
                <div className="text-2xl font-bold text-gray-900">
                  {isClient
                    ? `$${users.reduce((sum, user) => sum + user.currentRevenue, 0).toLocaleString()}`
                    : `$${users.reduce((sum, user) => sum + user.currentRevenue, 0)}`}
                </div>
                <div className="text-xs text-gray-500">
                  Goal:{" "}
                  {isClient
                    ? `$${users.reduce((sum, user) => sum + user.revenueGoal, 0).toLocaleString()}`
                    : `$${users.reduce((sum, user) => sum + user.revenueGoal, 0)}`}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Monthly Signups</div>
                <div className="text-2xl font-bold text-gray-900">
                  {users.reduce((sum, user) => sum + user.currentSignups, 0)}
                </div>
                <div className="text-xs text-gray-500">
                  Goal: {users.reduce((sum, user) => sum + user.monthlySignupGoal, 0)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Trophy className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Yearly Revenue</div>
                <div className="text-2xl font-bold text-gray-900">
                  {isClient
                    ? `$${(users.reduce((sum, user) => sum + user.currentRevenue, 0) * 12).toLocaleString()}`
                    : `$${users.reduce((sum, user) => sum + user.currentRevenue, 0) * 12}`}
                </div>
                <div className="text-xs text-gray-500">Projected Annual</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Star className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Team Performance</div>
                <div className="text-2xl font-bold text-gray-900">
                  {Math.round(
                    (users.reduce((sum, user) => sum + user.currentRevenue / user.revenueGoal, 0) / users.length) * 100,
                  )}
                  %
                </div>
                <div className="text-xs text-gray-500">Average Goal Completion</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="internal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="internal">Internal Data</TabsTrigger>
          <TabsTrigger value="sheets" disabled={isLoadingSheets || sheetsData.length === 0}>
            Live Google Sheets Data{" "}
            {isLoadingSheets ? "(Loading...)" : sheetsData.length > 0 && `(${sheetsData.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="internal" className="space-y-6">
          <div className="flex space-x-2">
            <Button
              variant={sortBy === "revenue" ? "default" : "outline"}
              onClick={() => setSortBy("revenue")}
              className={
                sortBy === "revenue" ? "bg-red-600 hover:bg-red-700" : "border-red-200 text-red-600 hover:bg-red-50"
              }
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Sort by Revenue
            </Button>
            <Button
              variant={sortBy === "signups" ? "default" : "outline"}
              onClick={() => setSortBy("signups")}
              className={
                sortBy === "signups" ? "bg-red-600 hover:bg-red-700" : "border-red-200 text-red-600 hover:bg-red-50"
              }
            >
              <Users className="h-4 w-4 mr-2" />
              Sort by Signups
            </Button>
          </div>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sales Leaderboard</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Rank</TableHead>
                      <TableHead>Sales Rep</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Signups</TableHead>
                      <TableHead>Revenue Goal Progress</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedUsers.map((user, index) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium text-lg">{index + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={user.profilePicture || "/placeholder.svg"} alt={user.name} />
                              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-green-600 font-semibold">
                          ${user.currentRevenue.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{user.currentSignups}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={(user.currentRevenue / user.revenueGoal) * 100} className="w-full" />
                            <span className="text-sm text-muted-foreground">
                              {Math.round((user.currentRevenue / user.revenueGoal) * 100)}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sheets" className="space-y-6">
          {sheetsData.length > 0 ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div>
                    <Label className="text-sm font-medium">View Month</Label>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="total">All Year</SelectItem>
                        {months.map((month) => (
                          <SelectItem key={month} value={month}>
                            {formatMonthName(month)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Sort By</Label>
                    <Select value={sortBy} onValueChange={(value: "signups" | "revenue") => setSortBy(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="signups">Signups</SelectItem>
                        <SelectItem value="revenue">Revenue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={fetchSheetsData} disabled={isLoadingSheets} size="sm">
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingSheets ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-green-600" />
                      <div>
                        <div className="text-sm text-gray-600">Total Signups</div>
                        <div className="text-xl font-bold text-green-600">
                          {selectedMonth === "total"
                            ? sheetsData.reduce((sum, entry) => sum + entry.signups.total, 0)
                            : sheetsData.reduce((sum, entry) => sum + entry.currentMonthSignups, 0)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="text-sm text-gray-600">Total Revenue</div>
                        <div className="text-xl font-bold text-blue-600">
                          {isClient
                            ? `$` +
                              (selectedMonth === "total"
                                ? sheetsData.reduce((sum, entry) => sum + entry.revenue.total, 0)
                                : sheetsData.reduce((sum, entry) => sum + entry.currentMonthRevenue, 0)
                              ).toLocaleString()
                            : `$` +
                              (selectedMonth === "total"
                                ? sheetsData.reduce((sum, entry) => sum + entry.revenue.total, 0)
                                : sheetsData.reduce((sum, entry) => sum + entry.currentMonthRevenue, 0))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-purple-200">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Trophy className="h-5 w-5 text-purple-600" />
                      <div>
                        <div className="text-sm text-gray-600">Top Performer</div>
                        <div className="text-lg font-bold text-purple-600">{sheetsData[0]?.name || "N/A"}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-orange-200">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-orange-600" />
                      <div>
                        <div className="text-sm text-gray-600">Active Reps</div>
                        <div className="text-xl font-bold text-orange-600">
                          {
                            sheetsData.filter((entry) =>
                              selectedMonth === "total" ? entry.signups.total > 0 : entry.currentMonthSignups > 0,
                            ).length
                          }
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="space-y-3">
                {sheetsData.map((entry, index) => {
                  const rank = index + 1
                  const isTopThree = rank <= 3
                  const signupCount = selectedMonth === "total" ? entry.signups.total : entry.currentMonthSignups
                  const revenueAmount = selectedMonth === "total" ? entry.revenue.total : entry.currentMonthRevenue
                  const bonus = calculateBonus(signupCount)

                  return (
                    <Card
                      key={entry.name}
                      className={`transition-all hover:shadow-md ${
                        isTopThree ? "border-yellow-200 bg-yellow-50" : "border-gray-200 bg-white"
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <Badge className={`px-3 py-1 text-sm font-bold ${getRankBadgeColor(rank)}`}>
                                #{rank}
                              </Badge>
                              {getRankIcon(rank)}
                            </div>
                            <Avatar className="h-12 w-12 border-2 border-gray-200">
                              <AvatarImage src={getProfileImage(entry.name) || "/placeholder.svg"} alt={entry.name} />
                              <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white font-semibold">
                                {getInitials(entry.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-bold text-lg text-gray-900">{entry.name}</h3>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span className="flex items-center space-x-1">
                                  <Users className="h-4 w-4" />
                                  <span>{signupCount} signups</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <DollarSign className="h-4 w-4" />
                                  <span>{isClient ? `$${revenueAmount.toLocaleString()}` : `$${revenueAmount}`}</span>
                                </span>
                              </div>
                            </div>
                          </div>
                          {bonus > 0 && (
                            <div className="text-right">
                              <div className="text-lg font-bold text-green-600">
                                {isClient ? `$${bonus.toLocaleString()}` : `$${bonus}`}
                              </div>
                              <div className="text-sm text-gray-600">Bonus Earned</div>
                            </div>
                          )}
                        </div>
                        {selectedMonth === "total" && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <Tabs defaultValue="signups" className="w-full">
                              <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="signups">Monthly Signups</TabsTrigger>
                                <TabsTrigger value="revenue">Monthly Revenue</TabsTrigger>
                              </TabsList>
                              <TabsContent value="signups" className="mt-4">
                                <div className="grid grid-cols-6 gap-2">
                                  {months.slice(0, 6).map((month) => (
                                    <div key={month} className="text-center p-2 bg-gray-50 rounded">
                                      <div className="text-xs text-gray-600">{formatMonthName(month).slice(0, 3)}</div>
                                      <div className="font-semibold">{entry.signups[month] || 0}</div>
                                    </div>
                                  ))}
                                </div>
                                <div className="grid grid-cols-6 gap-2 mt-2">
                                  {months.slice(6).map((month) => (
                                    <div key={month} className="text-center p-2 bg-gray-50 rounded">
                                      <div className="text-xs text-gray-600">{formatMonthName(month).slice(0, 3)}</div>
                                      <div className="font-semibold">{entry.signups[month] || 0}</div>
                                    </div>
                                  ))}
                                </div>
                              </TabsContent>
                              <TabsContent value="revenue" className="mt-4">
                                <div className="grid grid-cols-6 gap-2">
                                  {months.slice(0, 6).map((month) => (
                                    <div key={month} className="text-center p-2 bg-gray-50 rounded">
                                      <div className="text-xs text-gray-600">{formatMonthName(month).slice(0, 3)}</div>
                                      <div className="font-semibold text-sm">
                                        {isClient
                                          ? `$${(entry.revenue[month] || 0).toLocaleString()}`
                                          : `$${entry.revenue[month] || 0}`}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="grid grid-cols-6 gap-2 mt-2">
                                  {months.slice(6).map((month) => (
                                    <div key={month} className="text-center p-2 bg-gray-50 rounded">
                                      <div className="text-xs text-gray-600">{formatMonthName(month).slice(0, 3)}</div>
                                      <div className="font-semibold text-sm">
                                        {isClient
                                          ? `$${(entry.revenue[month] || 0).toLocaleString()}`
                                          : `$${entry.revenue[month] || 0}`}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </TabsContent>
                            </Tabs>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Database className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Live Data Available</h3>
              <p className="text-gray-600 mb-4">Configure and sync Google Sheets to see live data here.</p>
              {isCurrentUserAdmin && (
                <Button asChild className="bg-blue-600 hover:bg-blue-700">
                  <Link href="/admin">
                    <Settings className="h-4 w-4 mr-2" />
                    Go to Admin Panel
                  </Link>
                </Button>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader className="bg-gradient-to-r from-red-600 to-red-700 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16 border-4 border-white">
                    <AvatarImage
                      src={getProfileImage(selectedUser.name) || "/placeholder.svg"}
                      alt={selectedUser.name}
                    />
                    <AvatarFallback className="bg-white text-red-600 text-xl font-bold">
                      {getInitials(selectedUser.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedUser.name}</h2>
                    <p className="text-red-100">{selectedUser.bio || "Sales Professional"}</p>
                  </div>
                </div>
                <Button variant="ghost" onClick={() => setSelectedUser(null)} className="text-white hover:bg-red-800">
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {isClient
                        ? `$${selectedUser.currentRevenue.toLocaleString()}`
                        : `$${selectedUser.currentRevenue}`}
                    </div>
                    <div className="text-sm text-gray-600">Current Revenue</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{selectedUser.currentSignups}</div>
                    <div className="text-sm text-gray-600">Monthly Signups</div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Achievements</h3>
                  {selectedUser.achievements.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedUser.achievements.map((achievement) => (
                        <div key={achievement.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          {getAchievementIcon(achievement.category)}
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">{achievement.title}</div>
                            <div className="text-sm text-gray-600">{achievement.description}</div>
                            <div className="text-xs text-gray-500">
                              {isClient
                                ? new Date(achievement.earnedDate).toLocaleDateString()
                                : achievement.earnedDate}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No achievements yet</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}