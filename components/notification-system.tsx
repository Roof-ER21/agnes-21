"use client"

import { useState } from "react"
import { Bell, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Notification } from "../types/user"

interface NotificationSystemProps {
  notifications: Notification[]
  userId: string
  onMarkAsRead: (notificationId: string, userId: string) => void
  onDismiss: (notificationId: string, userId: string) => void
}

export function NotificationSystem({ notifications, userId, onMarkAsRead, onDismiss }: NotificationSystemProps) {
  const [isOpen, setIsOpen] = useState(false)

  const unreadCount = notifications.filter((n) => !n.isRead[userId]).length

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute right-0 mt-2 w-80 shadow-lg z-10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Notifications</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-500">No new notifications.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg ${!notification.isRead[userId] ? "bg-blue-50" : "bg-white"}`}
                  >
                    <h4 className="font-semibold">{notification.title}</h4>
                    <p className="text-sm text-gray-600">{notification.message}</p>
                    <div className="flex justify-end space-x-2 mt-2">
                      {!notification.isRead[userId] && (
                        <Button size="sm" variant="link" onClick={() => onMarkAsRead(notification.id, userId)}>
                          Mark as read
                        </Button>
                      )}
                      <Button size="sm" variant="link" onClick={() => onDismiss(notification.id, userId)}>
                        Dismiss
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
