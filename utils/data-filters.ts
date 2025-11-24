interface FilterState {
  timePeriod: string
  customDateRange: {
    from: Date | undefined
    to: Date | undefined
  }
  teams: string[]
  territories: string[]
  roles: string[]
  performanceLevel: string[]
  metrics: string[]
  goalStatus: string[]
  minRevenue: string
  maxRevenue: string
  minSignups: string
  maxSignups: string
  revenueRange: number[]
  signupsRange: number[]
  progressRange: number[]
  searchTerm: string
  sortBy: string
  showInactive: boolean
}

interface LeaderboardData {
  id: number | string
  name: string
  role: string
  team?: string
  territory?: string
  revenue: number
  signups: number
  estimates: number
  progress: number
  monthlyProgress: number
  yearlyProgress: number
  badge: string | null
  achievements: string[]
  status?: string
  isActive?: boolean
}

export function applyFilters(data: LeaderboardData[], filters: FilterState): LeaderboardData[] {
  return data.filter((person) => {
    // Search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      const matchesSearch =
        person.name.toLowerCase().includes(searchLower) ||
        person.role.toLowerCase().includes(searchLower) ||
        (person.team && person.team.toLowerCase().includes(searchLower)) ||
        (person.territory && person.territory.toLowerCase().includes(searchLower))

      if (!matchesSearch) return false
    }

    // Active/Inactive filter
    if (!filters.showInactive && person.isActive === false) {
      return false
    }

    // Team filter
    if (filters.teams.length > 0 && person.team && !filters.teams.includes(person.team)) {
      return false
    }

    // Territory filter
    if (filters.territories && filters.territories.length > 0 && person.territory) {
      const territoryId = person.territory.toLowerCase().replace(" region", "").replace(" ", "-")
      if (!filters.territories.includes(territoryId)) {
        return false
      }
    }

    // Role filter
    if (filters.roles.length > 0 && !filters.roles.includes(person.role.toLowerCase().replace(" ", "-"))) {
      return false
    }

    // Performance level filter
    if (filters.performanceLevel.length > 0) {
      const performanceLevel = getPerformanceLevel(person.progress)
      if (!filters.performanceLevel.includes(performanceLevel)) {
        return false
      }
    }

    // Revenue range filter (using slider values)
    if (filters.revenueRange && filters.revenueRange.length === 2) {
      if (person.revenue < filters.revenueRange[0] || person.revenue > filters.revenueRange[1]) {
        return false
      }
    }

    // Signups range filter (using slider values)
    if (filters.signupsRange && filters.signupsRange.length === 2) {
      if (person.signups < filters.signupsRange[0] || person.signups > filters.signupsRange[1]) {
        return false
      }
    }

    // Progress range filter (using slider values)
    if (filters.progressRange && filters.progressRange.length === 2) {
      if (person.progress < filters.progressRange[0] || person.progress > filters.progressRange[1]) {
        return false
      }
    }

    // Legacy revenue range filter (text inputs)
    if (filters.minRevenue && person.revenue < Number.parseInt(filters.minRevenue)) {
      return false
    }
    if (filters.maxRevenue && person.revenue > Number.parseInt(filters.maxRevenue)) {
      return false
    }

    // Legacy signups range filter (text inputs)
    if (filters.minSignups && person.signups < Number.parseInt(filters.minSignups)) {
      return false
    }
    if (filters.maxSignups && person.signups > Number.parseInt(filters.maxSignups)) {
      return false
    }

    return true
  })
}

function getPerformanceLevel(progress: number): string {
  if (progress >= 100) return "exceeding"
  if (progress >= 80) return "on-track"
  if (progress >= 60) return "at-risk"
  return "behind"
}

export function sortData(data: LeaderboardData[], sortBy: string): LeaderboardData[] {
  const [field, order] = sortBy.split("-")

  return [...data].sort((a, b) => {
    let aValue: any
    let bValue: any

    switch (field) {
      case "revenue":
        aValue = a.revenue
        bValue = b.revenue
        break
      case "signups":
        aValue = a.signups
        bValue = b.signups
        break
      case "estimates":
        aValue = a.estimates
        bValue = b.estimates
        break
      case "progress":
        aValue = a.progress
        bValue = b.progress
        break
      case "name":
        aValue = a.name
        bValue = b.name
        break
      default:
        aValue = a.revenue
        bValue = b.revenue
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      return order === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    }

    return order === "asc" ? aValue - bValue : bValue - aValue
  })
}

export function getTimePeriodData(
  data: any[],
  timePeriod: string,
  customRange?: { from: Date | undefined; to: Date | undefined },
) {
  // In a real application, this would filter data based on actual dates
  // For demo purposes, we'll return the same data with different multipliers

  const multipliers: { [key: string]: number } = {
    "current-month": 1,
    "last-month": 0.85,
    "current-quarter": 2.8,
    "last-quarter": 2.4,
    "current-year": 11.2,
    "last-year": 9.8,
  }

  const multiplier = multipliers[timePeriod] || 1

  return data.map((item) => ({
    ...item,
    revenue: Math.round(item.revenue * multiplier),
    signups: Math.round(item.signups * multiplier),
    estimates: Math.round(item.estimates * multiplier),
  }))
}

export function getFilteredAndSortedData(data: LeaderboardData[], filters: FilterState): LeaderboardData[] {
  // Apply time period adjustments
  const timePeriodData = getTimePeriodData(data, filters.timePeriod, filters.customDateRange)

  // Apply filters
  const filteredData = applyFilters(timePeriodData, filters)

  // Apply sorting
  const sortedData = sortData(filteredData, filters.sortBy)

  return sortedData
}
