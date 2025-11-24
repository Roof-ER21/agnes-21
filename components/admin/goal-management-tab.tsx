"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { User } from "@/types/user"
import { Save } from "lucide-react"

interface GoalManagementTabProps {
  users: User[]
  onUpdateUser: (userId: string, updates: Partial<User>) => void
}

export function GoalManagementTab({ users, onUpdateUser }: GoalManagementTabProps) {
  const [editableUsers, setEditableUsers] = useState<Record<string, Partial<User>>>({})

  const handleGoalChange = (userId: string, goalType: "monthlySignupGoal" | "revenueGoal", value: string) => {
    const numericValue = Number(value)
    if (!isNaN(numericValue)) {
      setEditableUsers((prev) => ({
        ...prev,
        [userId]: {
          ...prev[userId],
          [goalType]: numericValue,
        },
      }))
    }
  }

  const handleSaveChanges = (userId: string) => {
    const updates = editableUsers[userId]
    if (updates) {
      onUpdateUser(userId, updates)
      setEditableUsers((prev) => {
        const newEditable = { ...prev }
        delete newEditable[userId]
        return newEditable
      })
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Monthly Signup Goal</TableHead>
          <TableHead>Yearly Revenue Goal ($)</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={user.profilePicture || "/placeholder.svg"} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{user.name}</span>
              </div>
            </TableCell>
            <TableCell>
              <Input
                type="number"
                value={editableUsers[user.id]?.monthlySignupGoal ?? user.monthlySignupGoal}
                onChange={(e) => handleGoalChange(user.id, "monthlySignupGoal", e.target.value)}
                className="w-32"
              />
            </TableCell>
            <TableCell>
              <Input
                type="number"
                value={editableUsers[user.id]?.revenueGoal ?? user.revenueGoal}
                onChange={(e) => handleGoalChange(user.id, "revenueGoal", e.target.value)}
                className="w-40"
              />
            </TableCell>
            <TableCell className="text-right">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleSaveChanges(user.id)}
                disabled={!editableUsers[user.id]}
              >
                <Save className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
