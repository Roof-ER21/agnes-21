"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import type { Notification, User } from "@/types/user"

interface NotificationManagementTabProps {
  onSendNotification: (notification: Omit<Notification, "id" | "createdDate" | "isRead">) => void
  allUsers: User[]
}

export function NotificationManagementTab({ onSendNotification, allUsers }: NotificationManagementTabProps) {
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [type, setType] = useState<"system" | "contest" | "achievement" | "general">("general")
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium")
  const [recipients, setRecipients] = useState<string[]>(["all"])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSendNotification({
      title,
      message,
      type,
      priority,
      recipients,
      createdBy: "admin", // Assuming admin is sending
    })
    // Reset form
    setTitle("")
    setMessage("")
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Send a Notification</CardTitle>
        <CardDescription>Broadcast a message to all or specific users.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="notif-title">Title</Label>
            <Input id="notif-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="notif-message">Message</Label>
            <Textarea id="notif-message" value={message} onChange={(e) => setMessage(e.target.value)} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="notif-type">Type</Label>
              <Select value={type} onValueChange={(v: any) => setType(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="contest">Contest</SelectItem>
                  <SelectItem value="achievement">Achievement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notif-priority">Priority</Label>
              <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Recipients</Label>
            <p className="text-sm text-gray-500">Currently sends to all users.</p>
          </div>
          <Button type="submit">Send Notification</Button>
        </form>
      </CardContent>
    </Card>
  )
}
