"use client"

import { CardDescription } from "@/components/ui/card"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Plus,
  Trash2,
  Copy,
  Save,
  Play,
  Pause,
  Trophy,
  Star,
  Target,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Crown,
  PlusCircle,
} from "lucide-react"
import type {
  CustomAchievementRule,
  CustomAchievementCondition,
  AchievementTemplate,
  AchievementStats,
  Achievement,
} from "../types/achievement"
import { achievementTemplates } from "../data/achievement-templates"

interface CustomAchievementBuilderProps {
  rules: CustomAchievementRule[]
  onCreateRule: (rule: Omit<CustomAchievementRule, "id" | "createdDate" | "lastModified">) => void
  onUpdateRule: (ruleId: string, updates: Partial<CustomAchievementRule>) => void
  onDeleteRule: (ruleId: string) => void
  onDuplicateRule: (ruleId: string) => void
  currentUserId: string
  stats?: AchievementStats
  onCreateAchievement: (achievement: Omit<Achievement, "id">) => void
}

const iconOptions = [
  { value: "🏆", label: "Trophy" },
  { value: "⭐", label: "Star" },
  { value: "🥇", label: "Gold Medal" },
  { value: "🎯", label: "Target" },
  { value: "🚀", label: "Rocket" },
  { value: "💎", label: "Diamond" },
  { value: "👑", label: "Crown" },
  { value: "🔥", label: "Fire" },
  { value: "⚡", label: "Lightning" },
  { value: "🌟", label: "Glowing Star" },
  { value: "💰", label: "Money" },
  { value: "🎉", label: "Party" },
]

const fieldOptions = [
  { value: "signups", label: "Signups" },
  { value: "revenue", label: "Revenue" },
  { value: "streak", label: "Streak Days" },
  { value: "improvement_percentage", label: "Improvement %" },
  { value: "team_rank", label: "Team Rank" },
  { value: "custom", label: "Custom Metric" },
]

const operatorOptions = [
  { value: "greater_than", label: "Greater than (>)" },
  { value: "greater_than_equal", label: "Greater than or equal (≥)" },
  { value: "less_than", label: "Less than (<)" },
  { value: "less_than_equal", label: "Less than or equal (≤)" },
  { value: "equals", label: "Equals (=)" },
  { value: "between", label: "Between" },
]

const timeframeOptions = [
  { value: "current_month", label: "Current Month" },
  { value: "last_month", label: "Last Month" },
  { value: "current_year", label: "Current Year" },
  { value: "last_year", label: "Last Year" },
  { value: "all_time", label: "All Time" },
  { value: "custom", label: "Custom Period" },
]

const categoryOptions = [
  { value: "performance", label: "Performance", icon: Trophy },
  { value: "milestone", label: "Milestone", icon: Target },
  { value: "team", label: "Team", icon: Users },
  { value: "improvement", label: "Improvement", icon: TrendingUp },
  { value: "consistency", label: "Consistency", icon: Calendar },
  { value: "custom", label: "Custom", icon: Star },
]

export function CustomAchievementBuilder({
  rules,
  onCreateRule,
  onUpdateRule,
  onDeleteRule,
  onDuplicateRule,
  currentUserId,
  stats,
  onCreateAchievement,
}: CustomAchievementBuilderProps) {
  const [activeTab, setActiveTab] = useState("rules")
  const [editingRule, setEditingRule] = useState<CustomAchievementRule | null>(null)
  const [newRule, setNewRule] = useState<Partial<CustomAchievementRule>>({
    name: "",
    description: "",
    icon: "🏆",
    conditions: [],
    rewards: {},
    isActive: true,
    category: "performance",
    priority: "medium",
  })

  const [nameForAchievement, setNameForAchievement] = useState("")
  const [descriptionForAchievement, setDescriptionForAchievement] = useState("")
  const [metricForAchievement, setMetricForAchievement] = useState<"revenue" | "signups" | "streak">("revenue")
  const [valueForAchievement, setValueForAchievement] = useState(0)
  const [isRepeatableForAchievement, setIsRepeatableForAchievement] = useState(false)

  const createCondition = (): CustomAchievementCondition => ({
    id: `condition_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    field: "signups",
    operator: "greater_than_equal",
    value: 10,
    timeframe: "current_month",
  })

  const addCondition = () => {
    if (editingRule) {
      setEditingRule({
        ...editingRule,
        conditions: [...editingRule.conditions, createCondition()],
      })
    } else {
      setNewRule({
        ...newRule,
        conditions: [...(newRule.conditions || []), createCondition()],
      })
    }
  }

  const updateCondition = (conditionId: string, updates: Partial<CustomAchievementCondition>) => {
    const updateConditions = (conditions: CustomAchievementCondition[]) =>
      conditions.map((c) => (c.id === conditionId ? { ...c, ...updates } : c))

    if (editingRule) {
      setEditingRule({
        ...editingRule,
        conditions: updateConditions(editingRule.conditions),
      })
    } else {
      setNewRule({
        ...newRule,
        conditions: updateConditions(newRule.conditions || []),
      })
    }
  }

  const removeCondition = (conditionId: string) => {
    const filterConditions = (conditions: CustomAchievementCondition[]) =>
      conditions.filter((c) => c.id !== conditionId)

    if (editingRule) {
      setEditingRule({
        ...editingRule,
        conditions: filterConditions(editingRule.conditions),
      })
    } else {
      setNewRule({
        ...newRule,
        conditions: filterConditions(newRule.conditions || []),
      })
    }
  }

  const saveRule = () => {
    const ruleToSave = editingRule || newRule

    if (!ruleToSave.name || !ruleToSave.description || !ruleToSave.conditions?.length) {
      alert("Please fill in all required fields and add at least one condition.")
      return
    }

    if (editingRule) {
      onUpdateRule(editingRule.id, {
        ...ruleToSave,
        lastModified: new Date().toISOString(),
      })
      setEditingRule(null)
    } else {
      onCreateRule({
        ...(ruleToSave as Omit<CustomAchievementRule, "id" | "createdDate" | "lastModified">),
        createdBy: currentUserId,
      })
      setNewRule({
        name: "",
        description: "",
        icon: "🏆",
        conditions: [],
        rewards: {},
        isActive: true,
        category: "performance",
        priority: "medium",
      })
    }
  }

  const loadTemplate = (template: AchievementTemplate) => {
    const templateRule = {
      name: template.name,
      description: template.description,
      icon: template.icon,
      conditions: template.conditions.map((c) => ({
        ...c,
        id: `condition_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      })),
      rewards: template.rewards,
      isActive: true,
      category: template.category as any,
      priority: "medium" as const,
    }
    setNewRule(templateRule)
    setActiveTab("builder")
  }

  const handleSubmitForAchievement = () => {
    if (!nameForAchievement || !descriptionForAchievement || valueForAchievement <= 0) {
      // Add some validation feedback
      return
    }
    onCreateAchievement({
      name: nameForAchievement,
      description: descriptionForAchievement,
      icon: "custom-award", // Default icon for custom achievements
      criteria: { metric: metricForAchievement, value: valueForAchievement },
      isRepeatable: isRepeatableForAchievement,
    })
    // Reset form
    setNameForAchievement("")
    setDescriptionForAchievement("")
    setValueForAchievement(0)
    setIsRepeatableForAchievement(false)
  }

  const currentRule = editingRule || newRule

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Custom Achievement Builder</h2>
          <p className="text-gray-600">Create and manage custom achievement rules for your team</p>
        </div>
        {stats && (
          <div className="flex space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.activeRules}</div>
              <div className="text-sm text-gray-600">Active Rules</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">${stats.totalEarnings.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Rewards</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.totalAchievements}</div>
              <div className="text-sm text-gray-600">Achievements</div>
            </div>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="rules">Active Rules</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="builder">Rule Builder</TabsTrigger>
          <TabsTrigger value="createAchievement">Create Achievement</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          <div className="grid gap-4">
            {rules.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Trophy className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Custom Rules Yet</h3>
                  <p className="text-gray-600 text-center mb-4">
                    Create your first custom achievement rule to start recognizing specific accomplishments.
                  </p>
                  <Button onClick={() => setActiveTab("builder")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Rule
                  </Button>
                </CardContent>
              </Card>
            ) : (
              rules.map((rule) => (
                <Card key={rule.id} className={`${rule.isActive ? "border-green-200" : "border-gray-200"}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{rule.icon}</div>
                        <div>
                          <CardTitle className="flex items-center space-x-2">
                            <span>{rule.name}</span>
                            <Badge variant={rule.isActive ? "default" : "secondary"}>
                              {rule.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Badge variant="outline">{rule.category}</Badge>
                          </CardTitle>
                          <CardDescription>{rule.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onUpdateRule(rule.id, { isActive: !rule.isActive })}
                        >
                          {rule.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => onDuplicateRule(rule.id)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditingRule(rule)}>
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteRule(rule.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Conditions:</h4>
                        <div className="space-y-2">
                          {rule.conditions.map((condition, index) => (
                            <div
                              key={condition.id}
                              className="flex items-center space-x-2 text-sm bg-gray-50 p-2 rounded"
                            >
                              <Badge variant="outline">{condition.field}</Badge>
                              <span>{condition.operator.replace(/_/g, " ")}</span>
                              <span className="font-semibold">{condition.value}</span>
                              {condition.secondValue && <span>and {condition.secondValue}</span>}
                              <span>in</span>
                              <Badge variant="outline">{condition.timeframe.replace(/_/g, " ")}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      {(rule.rewards.bonusAmount || rule.rewards.points || rule.rewards.title) && (
                        <div>
                          <h4 className="font-semibold mb-2">Rewards:</h4>
                          <div className="flex flex-wrap gap-2">
                            {rule.rewards.bonusAmount && (
                              <Badge className="bg-green-100 text-green-800">
                                <DollarSign className="h-3 w-3 mr-1" />${rule.rewards.bonusAmount}
                              </Badge>
                            )}
                            {rule.rewards.points && (
                              <Badge className="bg-blue-100 text-blue-800">
                                <Star className="h-3 w-3 mr-1" />
                                {rule.rewards.points} points
                              </Badge>
                            )}
                            {rule.rewards.title && (
                              <Badge className="bg-purple-100 text-purple-800">
                                <Crown className="h-3 w-3 mr-1" />
                                {rule.rewards.title}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Created: {new Date(rule.createdDate).toLocaleDateString()}</span>
                        <span>Usage: {rule.usageCount || 0} times</span>
                        {rule.maxEarningsPerUser && <span>Max per user: ${rule.maxEarningsPerUser}</span>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {achievementTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{template.icon}</div>
                    <div>
                      <CardTitle>{template.name}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-1">
                      {template.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="text-sm text-gray-600">
                      <strong>Conditions:</strong> {template.conditions.length} rule
                      {template.conditions.length !== 1 ? "s" : ""}
                    </div>

                    {template.rewards.bonusAmount && (
                      <div className="text-sm text-green-600 font-semibold">
                        💰 ${template.rewards.bonusAmount} bonus
                      </div>
                    )}

                    <Button onClick={() => loadTemplate(template)} className="w-full" variant="outline">
                      Use Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="builder" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{editingRule ? `Edit Rule: ${editingRule.name}` : "Create New Achievement Rule"}</CardTitle>
              <CardDescription>Define custom conditions and rewards for team achievements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Rule Name *</Label>
                  <Input
                    id="name"
                    value={currentRule.name || ""}
                    onChange={(e) => {
                      if (editingRule) {
                        setEditingRule({ ...editingRule, name: e.target.value })
                      } else {
                        setNewRule({ ...newRule, name: e.target.value })
                      }
                    }}
                    placeholder="e.g., Monthly Top Performer"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="icon">Icon</Label>
                  <Select
                    value={currentRule.icon || "🏆"}
                    onValueChange={(value) => {
                      if (editingRule) {
                        setEditingRule({ ...editingRule, icon: value })
                      } else {
                        setNewRule({ ...newRule, icon: value })
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <span className="flex items-center space-x-2">
                            <span>{option.value}</span>
                            <span>{option.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={currentRule.description || ""}
                  onChange={(e) => {
                    if (editingRule) {
                      setEditingRule({ ...editingRule, description: e.target.value })
                    } else {
                      setNewRule({ ...newRule, description: e.target.value })
                    }
                  }}
                  placeholder="Describe what this achievement recognizes..."
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={currentRule.category || "performance"}
                    onValueChange={(value: any) => {
                      if (editingRule) {
                        setEditingRule({ ...editingRule, category: value })
                      } else {
                        setNewRule({ ...newRule, category: value })
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <span className="flex items-center space-x-2">
                            <option.icon className="h-4 w-4" />
                            <span>{option.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={currentRule.priority || "medium"}
                    onValueChange={(value: any) => {
                      if (editingRule) {
                        setEditingRule({ ...editingRule, priority: value })
                      } else {
                        setNewRule({ ...newRule, priority: value })
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={currentRule.isActive || false}
                    onCheckedChange={(checked) => {
                      if (editingRule) {
                        setEditingRule({ ...editingRule, isActive: checked })
                      } else {
                        setNewRule({ ...newRule, isActive: checked })
                      }
                    }}
                  />
                  <Label htmlFor="active">Active</Label>
                </div>
              </div>

              <Separator />

              {/* Conditions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Conditions *</h3>
                  <Button onClick={addCondition} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Condition
                  </Button>
                </div>

                {currentRule.conditions?.length === 0 && (
                  <Alert>
                    <AlertDescription>
                      Add at least one condition to define when this achievement should be earned.
                    </AlertDescription>
                  </Alert>
                )}

                {currentRule.conditions?.map((condition, index) => (
                  <Card key={condition.id} className="p-4">
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="space-y-2">
                        <Label>Field</Label>
                        <Select
                          value={condition.field}
                          onValueChange={(value: any) => updateCondition(condition.id, { field: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {fieldOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Operator</Label>
                        <Select
                          value={condition.operator}
                          onValueChange={(value: any) => updateCondition(condition.id, { operator: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {operatorOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Value</Label>
                        <div className="flex space-x-2">
                          <Input
                            type="number"
                            value={condition.value}
                            onChange={(e) => updateCondition(condition.id, { value: Number(e.target.value) })}
                          />
                          {condition.operator === "between" && (
                            <Input
                              type="number"
                              value={condition.secondValue || 0}
                              onChange={(e) => updateCondition(condition.id, { secondValue: Number(e.target.value) })}
                              placeholder="Max"
                            />
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Timeframe</Label>
                        <div className="flex space-x-2">
                          <Select
                            value={condition.timeframe}
                            onValueChange={(value: any) => updateCondition(condition.id, { timeframe: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {timeframeOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCondition(condition.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <Separator />

              {/* Rewards */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Rewards</h3>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="bonusAmount">Bonus Amount ($)</Label>
                    <Input
                      id="bonusAmount"
                      type="number"
                      value={currentRule.rewards?.bonusAmount || ""}
                      onChange={(e) => {
                        const rewards = { ...currentRule.rewards, bonusAmount: Number(e.target.value) || undefined }
                        if (editingRule) {
                          setEditingRule({ ...editingRule, rewards })
                        } else {
                          setNewRule({ ...newRule, rewards })
                        }
                      }}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="points">Points</Label>
                    <Input
                      id="points"
                      type="number"
                      value={currentRule.rewards?.points || ""}
                      onChange={(e) => {
                        const rewards = { ...currentRule.rewards, points: Number(e.target.value) || undefined }
                        if (editingRule) {
                          setEditingRule({ ...editingRule, rewards })
                        } else {
                          setNewRule({ ...newRule, rewards })
                        }
                      }}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Special Title</Label>
                    <Input
                      id="title"
                      value={currentRule.rewards?.title || ""}
                      onChange={(e) => {
                        const rewards = { ...currentRule.rewards, title: e.target.value || undefined }
                        if (editingRule) {
                          setEditingRule({ ...editingRule, rewards })
                        } else {
                          setNewRule({ ...newRule, rewards })
                        }
                      }}
                      placeholder="e.g., Top Performer"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="maxPerUser">Max Earnings Per User ($)</Label>
                    <Input
                      id="maxPerUser"
                      type="number"
                      value={currentRule.maxEarningsPerUser || ""}
                      onChange={(e) => {
                        if (editingRule) {
                          setEditingRule({ ...editingRule, maxEarningsPerUser: Number(e.target.value) || undefined })
                        } else {
                          setNewRule({ ...newRule, maxEarningsPerUser: Number(e.target.value) || undefined })
                        }
                      }}
                      placeholder="No limit"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxTotal">Max Total Earnings ($)</Label>
                    <Input
                      id="maxTotal"
                      type="number"
                      value={currentRule.maxTotalEarnings || ""}
                      onChange={(e) => {
                        if (editingRule) {
                          setEditingRule({ ...editingRule, maxTotalEarnings: Number(e.target.value) || undefined })
                        } else {
                          setNewRule({ ...newRule, maxTotalEarnings: Number(e.target.value) || undefined })
                        }
                      }}
                      placeholder="No limit"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex justify-between">
                <div className="flex space-x-2">
                  {editingRule && (
                    <Button variant="outline" onClick={() => setEditingRule(null)}>
                      Cancel
                    </Button>
                  )}
                </div>

                <Button onClick={saveRule} className="flex items-center space-x-2">
                  <Save className="h-4 w-4" />
                  <span>{editingRule ? "Update Rule" : "Create Rule"}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="createAchievement" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PlusCircle className="h-6 w-6 mr-2" />
                Create Custom Achievement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="ach-name">Achievement Name</Label>
                <Input
                  id="ach-name"
                  value={nameForAchievement}
                  onChange={(e) => setNameForAchievement(e.target.value)}
                  placeholder="e.g., Revenue Rockstar"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ach-desc">Description</Label>
                <Input
                  id="ach-desc"
                  value={descriptionForAchievement}
                  onChange={(e) => setDescriptionForAchievement(e.target.value)}
                  placeholder="e.g., Reach $500,000 in total revenue"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="ach-metric">Metric</Label>
                  <Select value={metricForAchievement} onValueChange={(v) => setMetricForAchievement(v as any)}>
                    <SelectTrigger id="ach-metric">
                      <SelectValue placeholder="Select metric" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="revenue">Revenue</SelectItem>
                      <SelectItem value="signups">Signups</SelectItem>
                      <SelectItem value="streak">Sales Streak</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ach-value">Target Value</Label>
                  <Input
                    id="ach-value"
                    type="number"
                    value={valueForAchievement}
                    onChange={(e) => setValueForAchievement(Number(e.target.value))}
                    placeholder="e.g., 500000"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ach-repeatable"
                  checked={isRepeatableForAchievement}
                  onCheckedChange={(c) => setIsRepeatableForAchievement(!!c)}
                />
                <Label htmlFor="ach-repeatable">Repeatable Achievement</Label>
              </div>
              <Button onClick={handleSubmitForAchievement} className="w-full">
                Create Achievement
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
