"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { User, Achievement, Notification, GoogleSheetsConfig } from "@/types/user"
import { UserManagementTab } from "./admin/user-management-tab"
import { GoalManagementTab } from "./admin/goal-management-tab"
import { AchievementManagementTab } from "./admin/achievement-management-tab"
import { NotificationManagementTab } from "./admin/notification-management-tab"
import { IntegrationManagementTab } from "./admin/integration-management-tab"

interface AdminPageProps {
  currentUser: User
  users: User[]
  notifications: Notification[]
  googleSheetsConfig: GoogleSheetsConfig
  onUpdateUser: (userId: string, updates: Partial<User>) => void
  onCreateAchievement: (achievement: Omit<Achievement, "id" | "earnedDate">) => void
  onSendNotification: (notification: Omit<Notification, "id" | "createdDate" | "isRead">) => void
  onUpdateGoogleSheets: (config: GoogleSheetsConfig) => void
  onSyncData: () => void
}

export function AdminPage({
  currentUser,
  users,
  notifications,
  googleSheetsConfig,
  onUpdateUser,
  onCreateAchievement,
  onSendNotification,
  onUpdateGoogleSheets,
  onSyncData,
}: AdminPageProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">Admin Dashboard</h1>
      <p className="mt-1 text-sm text-gray-600">Manage users, goals, achievements, and system settings.</p>

      <Tabs defaultValue="users" className="mt-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="goals">Goal Management</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="mt-4">
          <UserManagementTab users={users} onUpdateUser={onUpdateUser} />
        </TabsContent>
        <TabsContent value="goals" className="mt-4">
          <GoalManagementTab users={users} onUpdateUser={onUpdateUser} />
        </TabsContent>
        <TabsContent value="achievements" className="mt-4">
          <AchievementManagementTab onCreateAchievement={onCreateAchievement} />
        </TabsContent>
        <TabsContent value="notifications" className="mt-4">
          <NotificationManagementTab onSendNotification={onSendNotification} allUsers={users} />
        </TabsContent>
        <TabsContent value="integrations" className="mt-4">
          <IntegrationManagementTab
            config={googleSheetsConfig}
            onUpdateConfig={onUpdateGoogleSheets}
            onSyncData={onSyncData}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
