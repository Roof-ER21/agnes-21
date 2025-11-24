"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Trophy, Medal, Award, TrendingUp, DollarSign, Users, Target, Filter } from "lucide-react"
import { useRealtimeData } from "@/contexts/realtime-context"
import { useFilters } from "@/contexts/filter-context"
import { getFilteredAndSortedData } from "@/utils/data-filters"
import { cn } from "@/lib/utils"

interface LeaderboardSectionProps {
  preview?: boolean
}

const getBadgeIcon = (badge: string | null, rank: number) => {
  switch (badge) {
    case "gold":
      return <Trophy className="h-5 w-5 text-yellow-500" />
    case "silver":
      return <Medal className="h-5 w-5 text-gray-400" />
    case "bronze":
      return <Award className="h-5 w-5 text-amber-600" />
    default:
      return <span className="text-lg font-bold text-gray-500">#{rank + 1}</span>
  }
}

const getBadgeColor = (badge: string | null) => {
  switch (badge) {
    case "gold":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "silver":
      return "bg-gray-100 text-gray-800 border-gray-200"
    case "bronze":
      return "bg-amber-100 text-amber-800 border-amber-200"
    default:
      return "bg-blue-100 text-blue-800 border-blue-200"
  }
}

export default function LeaderboardSection({ preview = false }: LeaderboardSectionProps) {
  const { data, recentlyUpdated } = useRealtimeData()
  const { filters } = useFilters()
  const [filteredData, setFilteredData] = useState(data)

  // Apply filters and sorting whenever data or filters change
  useEffect(() => {
    const processedData = getFilteredAndSortedData(data, filters)
    setFilteredData(processedData)
  }, [data, filters])

  const displayData = preview ? filteredData.slice(0, 3) : filteredData

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-red-600" />
              {preview ? "Top Performers" : "Sales Leaderboard"}
            </CardTitle>
            {preview && <p className="text-sm text-gray-600">Current month rankings (Live)</p>}
          </div>
          {!preview && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Filter className="h-4 w-4" />
              {filteredData.length} of {data.length} results
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {displayData.length === 0 ? (
          <div className="text-center py-8">
            <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
            <p className="text-gray-600">Try adjusting your filters to see more results.</p>
          </div>
        ) : (
          displayData.map((person, index) => (
            <div
              key={person.id}
              className={cn(
                "p-4 rounded-lg border transition-all hover:shadow-md",
                index === 0
                  ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200"
                  : index === 1
                    ? "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200"
                    : index === 2
                      ? "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200"
                      : "bg-white border-gray-200",
                recentlyUpdated.includes(person.id) && "flash-update",
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-sm">
                    {getBadgeIcon(person.badge, index)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{person.name}</h3>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-600">{person.role}</p>
                      {person.team && (
                        <Badge variant="outline" className="text-xs">
                          {person.team}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">${person.revenue.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">{person.progress.toFixed(0)}% of goal</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-3">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-sm text-gray-600 mb-1">
                    <DollarSign className="h-3 w-3" />
                    Revenue
                  </div>
                  <div className="font-semibold">${(person.revenue / 1000).toFixed(0)}K</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-sm text-gray-600 mb-1">
                    <Users className="h-3 w-3" />
                    Signups
                  </div>
                  <div className="font-semibold">{person.signups}</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-sm text-gray-600 mb-1">
                    <Target className="h-3 w-3" />
                    Estimates
                  </div>
                  <div className="font-semibold">${(person.estimates / 1000).toFixed(0)}K</div>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Monthly Goal</span>
                  <span className="font-medium">{person.monthlyProgress.toFixed(0)}%</span>
                </div>
                <Progress value={person.monthlyProgress} className="h-2 bg-gray-100" />

                <div className="flex justify-between text-sm mt-2 mb-1">
                  <span className="text-gray-600">Yearly Goal</span>
                  <span className="font-medium">{person.yearlyProgress.toFixed(0)}%</span>
                </div>
                <Progress value={person.yearlyProgress} className="h-2 bg-gray-100" indicatorColor="bg-blue-600" />
              </div>

              <div className="flex flex-wrap gap-2">
                {person.achievements.map((achievement, idx) => (
                  <Badge key={idx} variant="outline" className={`text-xs ${getBadgeColor(person.badge)}`}>
                    {achievement}
                  </Badge>
                ))}
              </div>
            </div>
          ))
        )}

        {preview && filteredData.length > 3 && (
          <div className="text-center pt-4 border-t">
            <a
              href="/leaderboard"
              className="text-red-600 hover:text-red-700 font-medium text-sm flex items-center justify-center gap-2"
            >
              View Full Leaderboard ({filteredData.length} total)
              <TrendingUp className="h-4 w-4" />
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
