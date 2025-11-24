"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import type { Achievement } from "@/types/user"

interface AchievementManagementTabProps {
  onCreateAchievement: (achievement: Omit<Achievement, "id" | "earnedDate">) => void
}

export function AchievementManagementTab({ onCreateAchievement }: AchievementManagementTabProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<"badge" | "milestone">("badge")
  const [icon, setIcon] = useState("🏆")
  const [criteria, setCriteria] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreateAchievement({
      title,
      description,
      type,
      icon,
      criteria,
    })
    // Reset form
    setTitle("")
    setDescription("")
    setType("badge")
    setIcon("🏆")
    setCriteria("")
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Achievement</CardTitle>
        <CardDescription>Define a new achievement that users can earn.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={(v: "badge" | "milestone") => setType(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="badge">Badge</SelectItem>
                  <SelectItem value="milestone">Milestone</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="icon">Icon (Emoji)</Label>
              <Input id="icon" value={icon} onChange={(e) => setIcon(e.target.value)} maxLength={2} />
            </div>
          </div>
          <div>
            <Label htmlFor="criteria">Criteria</Label>
            <Input
              id="criteria"
              value={criteria}
              onChange={(e) => setCriteria(e.target.value)}
              placeholder="e.g., revenue >= 10000"
              required
            />
          </div>
          <Button type="submit">Create Achievement</Button>
        </form>
      </CardContent>
    </Card>
  )
}
