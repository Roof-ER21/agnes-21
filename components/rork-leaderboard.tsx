"use client"

import { useState, useEffect } from "react"
import { Navigation } from "./navigation"
import { MyGoalsPage } from "./my-goals-page"
import { LeaderboardPage } from "./leaderboard-page"
import type { User, Team, Contest, Notification, GoogleSheetsConfig } from "@/types/user"
import { TeamGoalsPage } from "./team-goals-page"
import { ContestPage } from "./contest-page"
import { BonusNotification } from "./bonus-notification"
import { useBonusNotifications } from "@/hooks/use-bonus-notifications"
import { DataSyncService } from "@/services/data-sync-service"
import { FullScreenVideoDisplay } from "./full-screen-video-display"
import type { MonthlySignupData, YearlyRevenueData } from "@/lib/google-sheets"
import { users as mockUsers, notifications as mockNotifications } from "@/lib/data"

const initialTeams: Team[] = []
const initialContests: Contest[] = []

const mockGoogleSheetsConfig: GoogleSheetsConfig = {
  spreadsheetId: process.env.NEXT_PUBLIC_GOOGLE_SHEETS_ID || "demo-spreadsheet-id",
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY || "",
  range: "Sheet1!A1:Z100",
  lastSync: "2024-01-20T20:00:00Z",
  isEnabled: true,
  syncFrequency: "daily",
}

export function RorkLeaderboard() {
  const [currentPage, setCurrentPage] = useState("leaderboard")
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [teams, setTeams] = useState<Team[]>(initialTeams)
  const [contests, setContests] = useState<Contest[]>(initialContests)
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [isVideoDisplayActive, setIsVideoDisplayActive] = useState(false)
  const [syncStatus, setSyncStatus] = useState<string>("idle")
  const [monthlySignupLeaders, setMonthlySignupLeaders] = useState<MonthlySignupData[]>([])
  const [yearlyRevenueLeaders, setYearlyRevenueLeaders] = useState<YearlyRevenueData[]>([])

  useEffect(() => {
    const adminUser = users.find((u) => u.role === "admin")
    setCurrentUser(adminUser || users[0])
  }, [users])

  const handleSendNotification = (notification: Omit<Notification, "id" | "createdDate" | "isRead">) => {
    const newNotification: Notification = {
      id: `notif-${notifications.length + 1}`,
      ...notification,
      createdDate: new Date().toISOString(),
      isRead: {},
    }
    setNotifications((prev) => [...prev, newNotification])
  }

  const { activeNotifications, checkForBonusTierChange, dismissNotification } =
    useBonusNotifications(handleSendNotification)

  const teamMembers = users.filter((user) => user.teamId === currentUser?.teamId)

  const handleUpdateUser = (userId: string, updates: Partial<User>) => {
    const user = users.find((u) => u.id === userId)
    if (user && updates.currentSignups !== undefined && updates.currentSignups !== user.currentSignups) {
      checkForBonusTierChange(userId, user.name, user.currentSignups, updates.currentSignups)
    }
    setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, ...updates } : user)))
  }

  const handleUpdateGoal = (userId: string, goalType: "revenue" | "signup", value: number) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId
          ? {
              ...user,
              ...(goalType === "revenue" ? { revenueGoal: value } : { monthlySignupGoal: value }),
            }
          : user,
      ),
    )
  }

  const handleCreateTeam = (teamData: { name: string; leadId: string; memberIds: string[] }) => {
    const newTeam: Team = {
      id: `team${teams.length + 1}`,
      ...teamData,
      totalRevenue: 0,
      totalSignups: 0,
      createdDate: new Date().toISOString(),
    }
    setTeams((prev) => [...prev, newTeam])
  }

  const handleCreateContest = (contestData: Omit<Contest, "id" | "createdBy">) => {
    const newContest: Contest = {
      id: `contest${contests.length + 1}`,
      ...contestData,
      createdBy: currentUser?.id || "1",
    }
    setContests((prev) => [...prev, newContest])
  }

  const handleJoinContest = (contestId: string, userId: string) => {
    setContests((prev) =>
      prev.map((contest) =>
        contest.id === contestId ? { ...contest, participants: [...contest.participants, userId] } : contest,
      ),
    )
  }

  const handleEndContest = (contestId: string, winners: any[]) => {
    setContests((prev) =>
      prev.map((contest) =>
        contest.id === contestId ? { ...contest, status: "completed" as const, winners } : contest,
      ),
    )
  }

  const handleMarkAsRead = (notificationId: string, userId: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId
          ? { ...notification, isRead: { ...(notification.isRead || {}), [userId]: true } }
          : notification,
      ),
    )
  }

  const handleSyncData = async () => {
    setSyncStatus("syncing")
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY
    const spreadsheetId = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_ID

    if (!apiKey || !spreadsheetId) {
      setSyncStatus("error")
      return
    }

    try {
      const syncService = new DataSyncService(apiKey, spreadsheetId)
      const connectionTest = await syncService.testConnection()
      if (!connectionTest.success) {
        setSyncStatus("error")
        return
      }

      const updatedUsers = await syncService.syncUsersWithSheets(users)
      const videoData = await syncService.getVideoDisplayData()

      setUsers(updatedUsers)
      setMonthlySignupLeaders(videoData.monthlySignupLeaders || [])
      setYearlyRevenueLeaders(videoData.yearlyRevenueLeaders || [])
      setSyncStatus("success")
    } catch (error) {
      setSyncStatus("error")
    }
  }

  const handleToggleVideoDisplay = async () => {
    if (!isVideoDisplayActive) {
      await handleSyncData()
    }
    setIsVideoDisplayActive(!isVideoDisplayActive)
  }

  useEffect(() => {
    handleSyncData()
  }, [])

  const renderPage = () => {
    if (!currentUser) {
      return <div>Loading...</div>
    }

    const mockTeam = teams.find((team) => team.id === currentUser?.teamId)
    switch (currentPage) {
      case "my-goals":
        return <MyGoalsPage currentUser={currentUser} team={mockTeam} teamMembers={teamMembers} />
      case "leaderboard":
        return <LeaderboardPage users={users} currentUser={currentUser} onUpdateUserFromSheets={() => {}} />
      case "team-goals":
        return (
          <TeamGoalsPage
            currentUser={currentUser}
            teams={teams}
            allUsers={users}
            onUpdateGoal={handleUpdateGoal}
            onCreateTeam={handleCreateTeam}
          />
        )
      case "contest":
        return (
          <ContestPage
            currentUser={currentUser}
            contests={contests}
            allUsers={users}
            bonusHistory={[]}
            onCreateContest={handleCreateContest}
            onJoinContest={handleJoinContest}
            onEndContest={handleEndContest}
          />
        )
      default:
        return <LeaderboardPage users={users} currentUser={currentUser} onUpdateUserFromSheets={() => {}} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        currentUser={currentUser}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onDismiss={(notifId, userId) => setNotifications((notifs) => notifs.filter((n) => n.id !== notifId))}
        onToggleVideoDisplay={handleToggleVideoDisplay}
        isVideoDisplayActive={isVideoDisplayActive}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{renderPage()}</main>

      {activeNotifications.map((notification) => (
        <BonusNotification
          key={notification.id}
          tier={notification.tier}
          userName={notification.userName}
          onDismiss={() => dismissNotification(notification.id)}
        />
      ))}

      <FullScreenVideoDisplay
        monthlySignupLeaders={monthlySignupLeaders}
        yearlyRevenueLeaders={yearlyRevenueLeaders}
        users={users}
        isActive={isVideoDisplayActive}
        onClose={() => setIsVideoDisplayActive(false)}
      />
    </div>
  )
}
