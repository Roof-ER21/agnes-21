"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import {
  Filter,
  CalendarIcon,
  Users,
  TrendingUp,
  X,
  RotateCcw,
  Download,
  Search,
  MapPin,
  SortAsc,
  SortDesc,
  Bookmark,
} from "lucide-react"
import { format } from "date-fns"
import { useFilters } from "@/contexts/filter-context"

interface AdvancedFiltersProps {
  onFiltersChange: (filters: any) => void
  activeFiltersCount: number
  data?: any[]
}

const teams = [
  { id: "team-alpha", name: "Team Alpha", lead: "Sarah Johnson", territory: "North Region" },
  { id: "team-beta", name: "Team Beta", lead: "Mike Chen", territory: "South Region" },
  { id: "team-gamma", name: "Team Gamma", lead: "Emily Rodriguez", territory: "East Region" },
  { id: "team-delta", name: "Team Delta", lead: "David Thompson", territory: "West Region" },
]

const territories = [
  { id: "north", name: "North Region" },
  { id: "south", name: "South Region" },
  { id: "east", name: "East Region" },
  { id: "west", name: "West Region" },
]

const roles = [
  { id: "sales-rep", name: "Sales Rep" },
  { id: "senior-sales-rep", name: "Senior Sales Rep" },
  { id: "team-lead", name: "Team Lead" },
  { id: "sales-manager", name: "Sales Manager" },
]

const performanceLevels = [
  { id: "exceeding", name: "Exceeding Goals", color: "green" },
  { id: "on-track", name: "On Track", color: "blue" },
  { id: "at-risk", name: "At Risk", color: "yellow" },
  { id: "behind", name: "Behind Goals", color: "red" },
]

const sortOptions = [
  { id: "revenue-desc", name: "Revenue (High to Low)", field: "revenue", order: "desc" },
  { id: "revenue-asc", name: "Revenue (Low to High)", field: "revenue", order: "asc" },
  { id: "signups-desc", name: "Signups (High to Low)", field: "signups", order: "desc" },
  { id: "signups-asc", name: "Signups (Low to High)", field: "signups", order: "asc" },
  { id: "progress-desc", name: "Progress (High to Low)", field: "progress", order: "desc" },
  { id: "progress-asc", name: "Progress (Low to High)", field: "progress", order: "asc" },
  { id: "name-asc", name: "Name (A to Z)", field: "name", order: "asc" },
  { id: "name-desc", name: "Name (Z to A)", field: "name", order: "desc" },
]

const filterPresets = [
  { id: "top-performers", name: "Top Performers", description: "Revenue > $200K, Progress > 80%" },
  { id: "at-risk", name: "At Risk", description: "Progress < 60%, Time remaining < 50%" },
  { id: "new-hires", name: "New Hires", description: "Role: Sales Rep, Tenure < 6 months" },
  { id: "team-leads", name: "Team Leaders", description: "Role: Team Lead or Manager" },
]

export default function AdvancedFilters({ onFiltersChange, activeFiltersCount, data = [] }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [isMounted, setIsMounted] = useState(false)
  const { filters, setFilters } = useFilters()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Debounce search input
  useEffect(() => {
    if (!isMounted) return

    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm, isMounted])

  // Update filters when search changes
  useEffect(() => {
    if (!isMounted) return

    updateFilters({ searchTerm: debouncedSearch })
  }, [debouncedSearch, isMounted])

  const updateFilters = (newFilters: any) => {
    if (!isMounted) return

    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    onFiltersChange(updatedFilters)
  }

  const resetFilters = () => {
    if (!isMounted) return

    const defaultFilters = {
      timePeriod: "current-month",
      customDateRange: { from: undefined, to: undefined },
      teams: [],
      territories: [],
      roles: [],
      performanceLevel: [],
      metrics: ["revenue", "signups", "estimates"],
      goalStatus: [],
      minRevenue: "",
      maxRevenue: "",
      minSignups: "",
      maxSignups: "",
      revenueRange: [0, 500000],
      signupsRange: [0, 100],
      progressRange: [0, 150],
      searchTerm: "",
      sortBy: "revenue-desc",
      showInactive: false,
    }
    setFilters(defaultFilters)
    setSearchTerm("")
    onFiltersChange(defaultFilters)
  }

  const applyPreset = (presetId: string) => {
    if (!isMounted) return

    let presetFilters = { ...filters }

    switch (presetId) {
      case "top-performers":
        presetFilters = {
          ...presetFilters,
          revenueRange: [200000, 500000],
          progressRange: [80, 150],
          performanceLevel: ["exceeding", "on-track"],
        }
        break
      case "at-risk":
        presetFilters = {
          ...presetFilters,
          progressRange: [0, 60],
          performanceLevel: ["at-risk", "behind"],
        }
        break
      case "new-hires":
        presetFilters = {
          ...presetFilters,
          roles: ["sales-rep"],
        }
        break
      case "team-leads":
        presetFilters = {
          ...presetFilters,
          roles: ["team-lead", "sales-manager"],
        }
        break
    }

    setFilters(presetFilters)
    onFiltersChange(presetFilters)
  }

  const handleArrayToggle = (array: string[], value: string, key: string) => {
    if (!isMounted) return

    const newArray = array.includes(value) ? array.filter((item) => item !== value) : [...array, value]
    updateFilters({ [key]: newArray })
  }

  const exportData = () => {
    if (!isMounted) return

    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Name,Role,Revenue,Signups,Progress\n" +
      data.map((item) => `${item.name},${item.role},${item.revenue},${item.signups},${item.progress}`).join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "leaderboard_data.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
      {/* Search Bar */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by name, role, or team..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-white"
          disabled={!isMounted}
        />
      </div>

      {/* Quick Time Period Filter */}
      <Select
        value={filters.timePeriod}
        onValueChange={(value) => updateFilters({ timePeriod: value })}
        disabled={!isMounted}
      >
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="current-month">This Month</SelectItem>
          <SelectItem value="last-month">Last Month</SelectItem>
          <SelectItem value="current-quarter">This Quarter</SelectItem>
          <SelectItem value="last-quarter">Last Quarter</SelectItem>
          <SelectItem value="current-year">This Year</SelectItem>
          <SelectItem value="last-year">Last Year</SelectItem>
          <SelectItem value="custom">Custom Range</SelectItem>
        </SelectContent>
      </Select>

      {/* Sort Options */}
      <Select value={filters.sortBy} onValueChange={(value) => updateFilters({ sortBy: value })} disabled={!isMounted}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Sort by..." />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              <div className="flex items-center gap-2">
                {option.order === "desc" ? <SortDesc className="h-3 w-3" /> : <SortAsc className="h-3 w-3" />}
                {option.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Advanced Filters Popover */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="relative bg-white" disabled={!isMounted}>
            <Filter className="h-4 w-4 mr-2" />
            Advanced
            {isMounted && activeFiltersCount > 0 && (
              <Badge className="ml-2 bg-red-600 text-white text-xs px-1.5 py-0.5">{activeFiltersCount}</Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0" align="end">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Advanced Filters</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={resetFilters}>
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Reset
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 max-h-96 overflow-y-auto">
              {/* Filter Presets */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Bookmark className="h-4 w-4" />
                  Quick Presets
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {filterPresets.map((preset) => (
                    <Button
                      key={preset.id}
                      variant="outline"
                      size="sm"
                      onClick={() => applyPreset(preset.id)}
                      className="text-xs h-auto p-2 flex flex-col items-start bg-transparent"
                    >
                      <span className="font-medium">{preset.name}</span>
                      <span className="text-gray-500 text-xs">{preset.description}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Custom Date Range */}
              {filters.timePeriod === "custom" && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Custom Date Range</Label>
                  <div className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="justify-start text-left font-normal bg-transparent"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.customDateRange.from ? format(filters.customDateRange.from, "PPP") : "From date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.customDateRange.from}
                          onSelect={(date) =>
                            updateFilters({
                              customDateRange: { ...filters.customDateRange, from: date },
                            })
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <span className="text-sm text-gray-500">to</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="justify-start text-left font-normal bg-transparent"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.customDateRange.to ? format(filters.customDateRange.to, "PPP") : "To date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.customDateRange.to}
                          onSelect={(date) =>
                            updateFilters({
                              customDateRange: { ...filters.customDateRange, to: date },
                            })
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}

              {/* Teams Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Teams
                </Label>
                <div className="space-y-2">
                  {teams.map((team) => (
                    <div key={team.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={team.id}
                        checked={filters.teams.includes(team.id)}
                        onCheckedChange={() => handleArrayToggle(filters.teams, team.id, "teams")}
                      />
                      <Label htmlFor={team.id} className="text-sm font-normal">
                        {team.name} <span className="text-gray-500">({team.lead})</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Territories Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Territories
                </Label>
                <div className="space-y-2">
                  {territories.map((territory) => (
                    <div key={territory.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={territory.id}
                        checked={filters.territories?.includes(territory.id) || false}
                        onCheckedChange={() =>
                          handleArrayToggle(filters.territories || [], territory.id, "territories")
                        }
                      />
                      <Label htmlFor={territory.id} className="text-sm font-normal">
                        {territory.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Roles Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Roles</Label>
                <div className="space-y-2">
                  {roles.map((role) => (
                    <div key={role.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={role.id}
                        checked={filters.roles.includes(role.id)}
                        onCheckedChange={() => handleArrayToggle(filters.roles, role.id, "roles")}
                      />
                      <Label htmlFor={role.id} className="text-sm font-normal">
                        {role.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Performance Level Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Performance Level
                </Label>
                <div className="space-y-2">
                  {performanceLevels.map((level) => (
                    <div key={level.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={level.id}
                        checked={filters.performanceLevel.includes(level.id)}
                        onCheckedChange={() =>
                          handleArrayToggle(filters.performanceLevel, level.id, "performanceLevel")
                        }
                      />
                      <Label htmlFor={level.id} className="text-sm font-normal flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full bg-${level.color}-500`}></div>
                        {level.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Revenue Range Slider */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Revenue Range</Label>
                <div className="px-2">
                  <Slider
                    value={filters.revenueRange || [0, 500000]}
                    onValueChange={(value) => updateFilters({ revenueRange: value })}
                    max={500000}
                    min={0}
                    step={10000}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>${((filters.revenueRange?.[0] || 0) / 1000).toFixed(0)}K</span>
                    <span>${((filters.revenueRange?.[1] || 500000) / 1000).toFixed(0)}K</span>
                  </div>
                </div>
              </div>

              {/* Signups Range Slider */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Signups Range</Label>
                <div className="px-2">
                  <Slider
                    value={filters.signupsRange || [0, 100]}
                    onValueChange={(value) => updateFilters({ signupsRange: value })}
                    max={100}
                    min={0}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{filters.signupsRange?.[0] || 0}</span>
                    <span>{filters.signupsRange?.[1] || 100}</span>
                  </div>
                </div>
              </div>

              {/* Progress Range Slider */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Progress Range (%)</Label>
                <div className="px-2">
                  <Slider
                    value={filters.progressRange || [0, 150]}
                    onValueChange={(value) => updateFilters({ progressRange: value })}
                    max={150}
                    min={0}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{filters.progressRange?.[0] || 0}%</span>
                    <span>{filters.progressRange?.[1] || 150}%</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Additional Options */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Additional Options</Label>
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-inactive" className="text-sm font-normal">
                    Show Inactive Users
                  </Label>
                  <Switch
                    id="show-inactive"
                    checked={filters.showInactive || false}
                    onCheckedChange={(checked) => updateFilters({ showInactive: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>

      {/* Export Button */}
      <Button variant="outline" onClick={exportData} className="bg-white" disabled={!isMounted}>
        <Download className="h-4 w-4 mr-2" />
        Export
      </Button>

      {isMounted && activeFiltersCount > 0 && (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          {activeFiltersCount} filter{activeFiltersCount !== 1 ? "s" : ""} active
        </Badge>
      )}
    </div>
  )
}
