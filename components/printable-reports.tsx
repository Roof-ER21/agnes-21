"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FileText, Download, Printer, Users, TrendingUp, Settings, Eye, Mail } from "lucide-react"
import { useRealtimeData } from "@/contexts/realtime-context"
import { useFilters } from "@/contexts/filter-context"
import { getFilteredAndSortedData } from "@/utils/data-filters"

interface PrintableReportsProps {
  userRole: string
}

const reportTemplates = [
  {
    id: "executive-summary",
    name: "Executive Summary",
    description: "High-level overview for leadership",
    sections: ["overview", "top-performers", "key-metrics", "trends"],
    audience: "executives",
  },
  {
    id: "team-performance",
    name: "Team Performance Report",
    description: "Detailed team analysis and comparisons",
    sections: ["team-overview", "individual-performance", "goals-progress", "recommendations"],
    audience: "managers",
  },
  {
    id: "individual-report",
    name: "Individual Performance Report",
    description: "Personal performance breakdown",
    sections: ["personal-metrics", "goal-progress", "achievements", "action-items"],
    audience: "individual",
  },
  {
    id: "monthly-summary",
    name: "Monthly Summary",
    description: "Complete monthly performance overview",
    sections: ["monthly-overview", "leaderboard", "achievements", "contests", "goals"],
    audience: "all",
  },
  {
    id: "quarterly-review",
    name: "Quarterly Review",
    description: "Comprehensive quarterly analysis",
    sections: ["quarterly-overview", "trends", "team-comparison", "forecasting", "recommendations"],
    audience: "leadership",
  },
]

const reportSections = {
  overview: "Executive Overview",
  "top-performers": "Top Performers",
  "key-metrics": "Key Metrics",
  trends: "Performance Trends",
  "team-overview": "Team Overview",
  "individual-performance": "Individual Performance",
  "goals-progress": "Goals Progress",
  recommendations: "Recommendations",
  "personal-metrics": "Personal Metrics",
  "goal-progress": "Goal Progress",
  achievements: "Achievements",
  "action-items": "Action Items",
  "monthly-overview": "Monthly Overview",
  leaderboard: "Leaderboard",
  contests: "Contests",
  goals: "Goals",
  "quarterly-overview": "Quarterly Overview",
  "team-comparison": "Team Comparison",
  forecasting: "Forecasting",
}

const formatOptions = [
  { id: "pdf", name: "PDF Document", icon: FileText, description: "Professional formatted document" },
  { id: "print", name: "Print Preview", icon: Printer, description: "Optimized for printing" },
  { id: "email", name: "Email Report", icon: Mail, description: "Send via email" },
]

export default function PrintableReports({ userRole }: PrintableReportsProps) {
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [selectedSections, setSelectedSections] = useState<string[]>([])
  const [reportTitle, setReportTitle] = useState("")
  const [reportDescription, setReportDescription] = useState("")
  const [selectedFormat, setSelectedFormat] = useState("pdf")
  const [includeCharts, setIncludeCharts] = useState(true)
  const [includeFilters, setIncludeFilters] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const { data } = useRealtimeData()
  const { filters } = useFilters()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (selectedTemplate) {
      const template = reportTemplates.find((t) => t.id === selectedTemplate)
      if (template) {
        setSelectedSections(template.sections)
        setReportTitle(template.name)
        setReportDescription(template.description)
      }
    }
  }, [selectedTemplate])

  const filteredData = getFilteredAndSortedData(data, filters)

  const handleSectionToggle = (sectionId: string) => {
    setSelectedSections((prev) =>
      prev.includes(sectionId) ? prev.filter((s) => s !== sectionId) : [...prev, sectionId],
    )
  }

  const generateReport = async () => {
    if (!isMounted) return

    setIsGenerating(true)

    await new Promise((resolve) => setTimeout(resolve, 2000))

    const reportData = {
      title: reportTitle,
      description: reportDescription,
      sections: selectedSections,
      data: filteredData,
      filters: includeFilters ? filters : null,
      includeCharts,
      format: selectedFormat,
      generatedAt: new Date().toISOString(),
      generatedBy: localStorage.getItem("userName") || "User",
    }

    console.log("Generated Report:", reportData)

    if (selectedFormat === "pdf") {
      const blob = new Blob([`Mock PDF for ${reportTitle}`], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${reportTitle.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } else if (selectedFormat === "print") {
      window.print()
    } else if (selectedFormat === "email") {
      alert("Report has been sent via email!")
    }

    setIsGenerating(false)
  }

  const canGenerateReports = ["team-lead", "sales-manager", "admin"].includes(userRole)

  if (!canGenerateReports) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
          <p className="text-gray-600">You need Team Lead, Sales Manager, or Admin privileges to generate reports.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Printable Reports</h2>
          <p className="text-gray-600">Generate professional reports for stakeholders</p>
        </div>
        {isMounted && (
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            {filteredData.length} records available
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTemplates.map((template) => (
          <Card
            key={template.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedTemplate === template.id ? "ring-2 ring-red-600 bg-red-50" : ""
            }`}
            onClick={() => isMounted && setSelectedTemplate(template.id)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {template.name}
              </CardTitle>
              <p className="text-sm text-gray-600">{template.description}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600 capitalize">{template.audience}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {template.sections.slice(0, 3).map((section) => (
                    <Badge key={section} variant="outline" className="text-xs">
                      {reportSections[section as keyof typeof reportSections]}
                    </Badge>
                  ))}
                  {template.sections.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{template.sections.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedTemplate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Report Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="report-title">Report Title</Label>
                <Input
                  id="report-title"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="Enter report title"
                  disabled={!isMounted}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="report-format">Output Format</Label>
                <Select value={selectedFormat} onValueChange={setSelectedFormat} disabled={!isMounted}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {formatOptions.map((format) => (
                      <SelectItem key={format.id} value={format.id}>
                        <div className="flex items-center gap-2">
                          <format.icon className="h-4 w-4" />
                          {format.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="report-description">Description</Label>
              <Textarea
                id="report-description"
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Brief description of the report purpose"
                rows={3}
                disabled={!isMounted}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-base font-medium">Report Sections</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(reportSections).map(([sectionId, sectionName]) => (
                  <div key={sectionId} className="flex items-center space-x-2">
                    <Checkbox
                      id={sectionId}
                      checked={selectedSections.includes(sectionId)}
                      onCheckedChange={() => handleSectionToggle(sectionId)}
                      disabled={!isMounted}
                    />
                    <Label htmlFor={sectionId} className="text-sm font-normal">
                      {sectionName}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <Label className="text-base font-medium">Additional Options</Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="include-charts" className="text-sm font-normal">
                      Include Charts and Graphs
                    </Label>
                    <p className="text-xs text-gray-600">Add visual representations of data</p>
                  </div>
                  <Checkbox
                    id="include-charts"
                    checked={includeCharts}
                    onCheckedChange={(checked) => setIncludeCharts(Boolean(checked))}
                    disabled={!isMounted}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="include-filters" className="text-sm font-normal">
                      Include Applied Filters
                    </Label>
                    <p className="text-xs text-gray-600">Show current filter settings in report</p>
                  </div>
                  <Checkbox
                    id="include-filters"
                    checked={includeFilters}
                    onCheckedChange={(checked) => setIncludeFilters(Boolean(checked))}
                    disabled={!isMounted}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-4">
              <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="bg-transparent" disabled={!isMounted}>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Report
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Report Preview</DialogTitle>
                    <DialogDescription>Preview of your generated report</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6">
                    <ReportPreview
                      title={reportTitle}
                      description={reportDescription}
                      sections={selectedSections}
                      data={filteredData}
                      includeCharts={includeCharts}
                      includeFilters={includeFilters}
                      filters={filters}
                    />
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                onClick={generateReport}
                disabled={!isMounted || !reportTitle || selectedSections.length === 0 || isGenerating}
                className="bg-red-600 hover:bg-red-700"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ReportPreview({
  title,
  description,
  sections,
  data,
  includeCharts,
  includeFilters,
  filters,
}: {
  title: string
  description: string
  sections: string[]
  data: any[]
  includeCharts: boolean
  includeFilters: boolean
  filters: any
}) {
  const [currentDate, setCurrentDate] = useState("")
  const topPerformers = data.slice(0, 5)

  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString())
  }, [])

  return (
    <div className="space-y-6 p-6 bg-white">
      <div className="text-center border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-600 mt-2">{description}</p>
        <div className="flex justify-center items-center gap-4 mt-4 text-sm text-gray-500">
          <span>Generated on {currentDate}</span>
          <span>•</span>
          <span>{data.length} records</span>
        </div>
      </div>

      {includeFilters && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Applied Filters</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Time Period: {filters.timePeriod.replace("-", " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}</p>
            <p>Sort By: {filters.sortBy.replace("-", " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}</p>
            {filters.searchTerm && <p>Search: "{filters.searchTerm}"</p>}
          </div>
        </div>
      )}

      {sections.includes("overview") && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Executive Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                ${data.reduce((sum, person) => sum + person.revenue, 0).toLocaleString()}
              </div>
              <div className="text-sm text-blue-700">Total Revenue</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {data.reduce((sum, person) => sum + person.signups, 0)}
              </div>
              <div className="text-sm text-green-700">Total Signups</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {data.length > 0 ? Math.round(data.reduce((sum, person) => sum + person.progress, 0) / data.length) : 0}
                %
              </div>
              <div className="text-sm text-purple-700">Average Progress</div>
            </div>
          </div>
        </div>
      )}

      {sections.includes("top-performers") && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Performers</h2>
          <div className="space-y-3">
            {topPerformers.map((person, index) => (
              <div key={person.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-sm">
                    <span className="text-sm font-bold">#{index + 1}</span>
                  </div>
                  <div>
                    <div className="font-medium">{person.name}</div>
                    <div className="text-sm text-gray-600">{person.role}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">${person.revenue.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">{person.progress.toFixed(0)}% of goal</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sections.includes("key-metrics") && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold">{data.length}</div>
              <div className="text-sm text-gray-600">Active Members</div>
            </div>
            <div>
              <div className="text-lg font-bold">
                $
                {data.length > 0
                  ? Math.round(data.reduce((sum, person) => sum + person.revenue, 0) / data.length).toLocaleString()
                  : 0}
              </div>
              <div className="text-sm text-gray-600">Avg Revenue</div>
            </div>
            <div>
              <div className="text-lg font-bold">
                {data.length > 0 ? Math.round(data.reduce((sum, person) => sum + person.signups, 0) / data.length) : 0}
              </div>
              <div className="text-sm text-gray-600">Avg Signups</div>
            </div>
            <div>
              <div className="text-lg font-bold">{data.filter((person) => person.progress >= 100).length}</div>
              <div className="text-sm text-gray-600">Goals Achieved</div>
            </div>
          </div>
        </div>
      )}

      {includeCharts && sections.includes("trends") && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Trends</h2>
          <div className="bg-gray-100 h-64 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <TrendingUp className="h-12 w-12 mx-auto mb-2" />
              <p>Chart would be rendered here</p>
            </div>
          </div>
        </div>
      )}

      <div className="border-t pt-4 text-center text-sm text-gray-500">
        <p>Generated by Roof ER Sales Leaderboard System</p>
        <p>Report contains confidential business information</p>
      </div>
    </div>
  )
}
