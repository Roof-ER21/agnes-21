import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Target, DollarSign, Users, TrendingUp } from "lucide-react"
import { BonusTracker } from "./bonus-tracker"
import type { User, Team } from "../types/user"

interface MyGoalsPageProps {
  currentUser: User
  team: Team | undefined
  teamMembers: User[]
}

export function MyGoalsPage({ currentUser, team, teamMembers }: MyGoalsPageProps) {
  const revenueProgress = (currentUser.currentRevenue / currentUser.revenueGoal) * 100
  const signupProgress = (currentUser.currentSignups / currentUser.monthlySignupGoal) * 100

  const teamRevenue = teamMembers.reduce((sum, member) => sum + member.currentRevenue, 0)
  const teamSignups = teamMembers.reduce((sum, member) => sum + member.currentSignups, 0)

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold">My Goals</h1>
        <p className="text-lg text-gray-600">Track your progress and stay motivated.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Personal Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-6 w-6 mr-2 text-red-500" />
              Your Personal Goals
            </CardTitle>
            <CardDescription>Your monthly sales and signup targets.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-medium">Monthly Revenue</span>
                <span>
                  ${currentUser.currentRevenue.toLocaleString()} / ${currentUser.revenueGoal.toLocaleString()}
                </span>
              </div>
              <Progress value={revenueProgress} />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-medium">Monthly Signups</span>
                <span>
                  {currentUser.currentSignups} / {currentUser.monthlySignupGoal}
                </span>
              </div>
              <Progress value={signupProgress} />
            </div>
          </CardContent>
        </Card>

        {/* Bonus Tracker */}
        <BonusTracker currentUser={currentUser} />
      </div>

      {/* Team Section */}
      {team && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-6 w-6 mr-2 text-blue-500" />
              Team Performance: {team.name}
            </CardTitle>
            <CardDescription>Your team's collective achievements.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <DollarSign className="h-8 w-8 text-green-500 mr-4" />
              <div>
                <p className="text-sm text-gray-500">Total Team Revenue</p>
                <p className="text-2xl font-bold">${teamRevenue.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <TrendingUp className="h-8 w-8 text-indigo-500 mr-4" />
              <div>
                <p className="text-sm text-gray-500">Total Team Signups</p>
                <p className="text-2xl font-bold">{teamSignups.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
