"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import type { GoogleSheetsConfig } from "@/types/user"
import { RefreshCw } from "lucide-react"

interface IntegrationManagementTabProps {
  config: GoogleSheetsConfig
  onUpdateConfig: (config: GoogleSheetsConfig) => void
  onSyncData: () => void
}

export function IntegrationManagementTab({ config, onUpdateConfig, onSyncData }: IntegrationManagementTabProps) {
  const [localConfig, setLocalConfig] = useState(config)

  const handleSave = () => {
    onUpdateConfig(localConfig)
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Google Sheets Integration</CardTitle>
        <CardDescription>Sync leaderboard data directly from your Google Sheet.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="sheets-enabled">Enable Google Sheets Sync</Label>
          <Switch
            id="sheets-enabled"
            checked={localConfig.isEnabled}
            onCheckedChange={(checked) => setLocalConfig({ ...localConfig, isEnabled: checked })}
          />
        </div>
        <div>
          <Label htmlFor="spreadsheet-id">Spreadsheet ID</Label>
          <Input
            id="spreadsheet-id"
            value={localConfig.spreadsheetId}
            onChange={(e) => setLocalConfig({ ...localConfig, spreadsheetId: e.target.value })}
            placeholder="Enter your Google Spreadsheet ID"
            disabled={!localConfig.isEnabled}
          />
        </div>
        <div>
          <Label htmlFor="api-key">API Key</Label>
          <Input
            id="api-key"
            type="password"
            value={localConfig.apiKey ? "********" : ""}
            placeholder="Using environment variable"
            disabled
          />
          <p className="text-xs text-gray-500 mt-1">API key is securely managed via environment variables.</p>
        </div>
        <div className="flex items-center justify-between pt-4">
          <div>
            <p className="text-sm font-medium">Manual Sync</p>
            <p className="text-xs text-gray-500">
              Last synced: {config.lastSync ? new Date(config.lastSync).toLocaleString() : "Never"}
            </p>
          </div>
          <Button onClick={onSyncData} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync Now
          </Button>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave}>Save Changes</Button>
      </CardFooter>
    </Card>
  )
}
