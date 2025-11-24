"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Edit } from "lucide-react"
import type { User, Team } from "../types/user"

interface TeamGoalsPageProps {
  currentUser: User
  teams: Team[]
  allUsers: User[]
  onUpdateGoal: (userId: string, goalType: "revenue" | "signup", value: number) => void
  onCreateTeam: (teamData: { name: string; leadId: string; memberIds: string[] }) => void
}

export function TeamGoalsPage({ currentUser, teams, allUsers, onUpdateGoal, onCreateTeam }: TeamGoalsPageProps) {
  const [selectedTeamId, setSelectedTeamId] = useState(currentUser.teamId)
  const selectedTeam = teams.find((t) => t.id === selectedTeamId)
  const teamMembers = allUsers.filter((u) => u.teamId === selectedTeamId)

  const teamRevenue = teamMembers.reduce((sum, member) => sum + member.currentRevenue, 0)
  const teamRevenueGoal = teamMembers.reduce((sum, member) => sum + member.revenueGoal, 0)
  const teamRevenueProgress = teamRevenueGoal > 0 ? (teamRevenue / teamRevenueGoal) * 100 : 0

  const teamSignups = teamMembers.reduce((sum, member) => sum + member.currentSignups, 0)
  const teamSignupGoal = teamMembers.reduce((sum, member) => sum + member.monthlySignupGoal, 0)
  const teamSignupProgress = teamSignupGoal > 0 ? (teamSignups / teamSignupGoal) * 100 : 0

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold">Team Goals</h1>
        <p className="text-lg text-gray-600">Monitor and manage your team's performance.</p>
      </header>

      {currentUser.role === "admin" && (
        <div className="flex space-x-2">
          {teams.map((team) => (
            <Button
              key={team.id}
              variant={selectedTeamId === team.id ? "default" : "outline"}
              onClick={() => setSelectedTeamId(team.id)}
            >
              {team.name}
            </Button>
          ))}
        </div>
      )}

      {selectedTeam && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-6 w-6 mr-2" />
              {selectedTeam.name} Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-medium">Team Revenue</span>
                <span>
                  ${teamRevenue.toLocaleString()} / ${teamRevenueGoal.toLocaleString()}
                </span>
              </div>
              <Progress value={teamRevenueProgress} />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-medium">Team Signups</span>
                <span>
                  {teamSignups.toLocaleString()} / {teamSignupGoal.toLocaleString()}
                </span>
              </div>
              <Progress value={teamSignupProgress} />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                <div className="flex items-center">
                  <Avatar className="h-10 w-10 mr-4">
                    <AvatarImage src={member.profilePicture || "/placeholder.svg"} alt={member.name} />
                    <AvatarFallback>
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{member.name}</p>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Revenue</p>
                    <p className="font-semibold">${member.currentRevenue.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Signups</p>
                    <p className="font-semibold">{member.currentSignups}</p>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
