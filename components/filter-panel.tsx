"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, X } from "lucide-react"

interface FilterPanelProps {
  onFilterChange: (filters: FilterOptions) => void
  totalPlayers: number
  filteredCount: number
  searchTerm: string
  onSearchTermChange: (term: string) => void
  sortBy: string
  onSortByChange: (value: string) => void
  filterByTeam: string
  onFilterByTeamChange: (value: string) => void
  teams: string[]
}

export interface FilterOptions {
  search: string
  country: string
  level: string
  winRate: string
  streak: string
  lastActive: string
}

const countries = ["All", "US", "UK", "CA", "DE", "JP"]
const levels = ["All", "1-10", "11-20", "21-30", "31-40", "41-50", "50+"]
const winRates = ["All", "90%+", "80-89%", "70-79%", "60-69%", "50-59%", "<50%"]
const streaks = ["All", "20+", "15-19", "10-14", "5-9", "1-4", "0"]
const lastActiveOptions = ["All", "Today", "This Week", "This Month", "3+ Months"]

export function FilterPanel({
  onFilterChange,
  totalPlayers,
  filteredCount,
  searchTerm,
  onSearchTermChange,
  sortBy,
  onSortByChange,
  filterByTeam,
  onFilterByTeamChange,
  teams,
}: FilterPanelProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    search: "",
    country: "All",
    level: "All",
    winRate: "All",
    streak: "All",
    lastActive: "All",
  })

  const [isExpanded, setIsExpanded] = useState(false)

  const updateFilter = (key: keyof FilterOptions, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const clearFilters = () => {
    const clearedFilters: FilterOptions = {
      search: "",
      country: "All",
      level: "All",
      winRate: "All",
      streak: "All",
      lastActive: "All",
    }
    setFilters(clearedFilters)
    onFilterChange(clearedFilters)
  }

  const hasActiveFilters = Object.values(filters).some((value, index) => {
    if (index === 0) return value !== "" // search
    return value !== "All"
  })

  return (
    <Card className="border-red-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Filter className="h-5 w-5 text-red-600" />
            <span>Filters</span>
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                Active
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-sm">
              {filteredCount} of {totalPlayers}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-red-600 hover:text-red-700"
            >
              {isExpanded ? "Collapse" : "Expand"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search - Always visible */}
        <div className="relative flex-grow">
          <Label htmlFor="search" className="text-sm font-medium text-gray-700">
            Search Players
          </Label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              type="text"
              placeholder="Search by name..."
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
              className="pl-10 border-gray-300 focus:border-red-500 focus:ring-red-500"
            />
            {filters.search && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateFilter("search", "")}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Search Term Input */}
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search players..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
          />
        </div>

        {/* Sort By Select */}
        <Select value={sortBy} onValueChange={onSortByChange}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="revenue">Sort by Revenue</SelectItem>
            <SelectItem value="signups">Sort by Signups</SelectItem>
          </SelectContent>
        </Select>

        {/* Filter By Team Select */}
        <Select value={filterByTeam} onValueChange={onFilterByTeamChange}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by team" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Teams</SelectItem>
            {teams.map((team) => (
              <SelectItem key={team} value={team}>
                {team}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Expandable Filters */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 border-t border-gray-200">
            <div>
              <Label className="text-sm font-medium text-gray-700">Country</Label>
              <Select value={filters.country} onValueChange={(value) => updateFilter("country", value)}>
                <SelectTrigger className="mt-1 border-gray-300 focus:border-red-500 focus:ring-red-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">Level</Label>
              <Select value={filters.level} onValueChange={(value) => updateFilter("level", value)}>
                <SelectTrigger className="mt-1 border-gray-300 focus:border-red-500 focus:ring-red-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {levels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">Win Rate</Label>
              <Select value={filters.winRate} onValueChange={(value) => updateFilter("winRate", value)}>
                <SelectTrigger className="mt-1 border-gray-300 focus:border-red-500 focus:ring-red-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {winRates.map((rate) => (
                    <SelectItem key={rate} value={rate}>
                      {rate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">Streak</Label>
              <Select value={filters.streak} onValueChange={(value) => updateFilter("streak", value)}>
                <SelectTrigger className="mt-1 border-gray-300 focus:border-red-500 focus:ring-red-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {streaks.map((streak) => (
                    <SelectItem key={streak} value={streak}>
                      {streak}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">Last Active</Label>
              <Select value={filters.lastActive} onValueChange={(value) => updateFilter("lastActive", value)}>
                <SelectTrigger className="mt-1 border-gray-300 focus:border-red-500 focus:ring-red-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {lastActiveOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 bg-transparent"
              >
                <X className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
