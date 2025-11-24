"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertCircle, RefreshCw, ExternalLink, AlertTriangle } from "lucide-react"
import { DataSyncService } from "../services/data-sync-service"

interface GoogleSheetsStatusProps {
  onSyncData: () => Promise<void>
  sheetsData: any[]
}

export function GoogleSheetsStatus({ onSyncData, sheetsData }: GoogleSheetsStatusProps) {
  const [connectionStatus, setConnectionStatus] = useState<{
    success: boolean
    message: string
    details?: any
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)

  const testConnection = async () => {
    setIsLoading(true)
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY
      const spreadsheetId = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_ID

      if (!apiKey || !spreadsheetId) {
        setConnectionStatus({
          success: false,
          message: "❌ Google Sheets not configured. Please check your environment variables.",
          details: {
            apiKey: apiKey ? "configured" : "missing",
            spreadsheetId: spreadsheetId ? "configured" : "missing",
          },
        })
        return
      }

      const syncService = new DataSyncService(apiKey, spreadsheetId)
      const result = await syncService.testConnection()
      setConnectionStatus(result)
    } catch (error) {
      setConnectionStatus({
        success: false,
        message: `❌ Connection test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        details: { error: error instanceof Error ? error.message : "Unknown error" },
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSyncData = async () => {
    setIsLoading(true)
    try {
      await onSyncData()
      setLastSync(new Date().toLocaleString())
    } catch (error) {
      console.error("Sync failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Test connection on component mount
    testConnection()
  }, [])

  const getStatusIcon = () => {
    if (isLoading) return <RefreshCw className="h-5 w-5 animate-spin" />
    if (connectionStatus?.success) return <CheckCircle className="h-5 w-5 text-green-600" />
    if (connectionStatus?.success === false) return <XCircle className="h-5 w-5 text-red-600" />
    return <AlertCircle className="h-5 w-5 text-yellow-600" />
  }

  const getStatusColor = () => {
    if (connectionStatus?.success) return "bg-green-50 border-green-200"
    if (connectionStatus?.success === false) return "bg-red-50 border-red-200"
    return "bg-yellow-50 border-yellow-200"
  }

  const lastSyncTime = new Date().toLocaleTimeString()
  const status = sheetsData.length > 0 ? "success" : "pending"

  return (
    <Card className={`${getStatusColor()} transition-colors`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <CardTitle className="text-lg">Google Sheets Integration</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={connectionStatus?.success ? "default" : "destructive"}>
              {connectionStatus?.success ? "Connected" : "Disconnected"}
            </Badge>
            {sheetsData.length > 0 && <Badge variant="outline">{sheetsData.length} records</Badge>}
          </div>
        </div>
        <CardDescription>Real-time data sync with Google Sheets for signups and revenue tracking</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <Alert className={connectionStatus?.success ? "border-green-200" : "border-red-200"}>
          <AlertDescription className="text-sm">
            {connectionStatus?.message || "Testing connection..."}
          </AlertDescription>
        </Alert>

        {/* Configuration Details */}
        {connectionStatus?.details && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">API Key:</span>
                <Badge variant={connectionStatus.details.apiKey === "configured" ? "default" : "destructive"}>
                  {connectionStatus.details.apiKey}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Spreadsheet ID:</span>
                <Badge variant={connectionStatus.details.spreadsheetId === "configured" ? "default" : "destructive"}>
                  {connectionStatus.details.spreadsheetId}
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              {connectionStatus.details.dataRows !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Data Rows:</span>
                  <Badge variant="outline">{connectionStatus.details.dataRows}</Badge>
                </div>
              )}
              {lastSync && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Last Sync:</span>
                  <Badge variant="outline" className="text-xs">
                    {lastSync}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Setup Instructions */}
        {!connectionStatus?.success && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">🔧 Setup Instructions:</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>
                Go to{" "}
                <a
                  href="https://console.cloud.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Google Cloud Console
                </a>
              </li>
              <li>Enable the Google Sheets API</li>
              <li>Create an API Key in Credentials</li>
              <li>
                Add to .env.local:{" "}
                <code className="bg-blue-100 px-1 rounded">NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY=your_key</code>
              </li>
              <li>Make your Google Sheet public (Share → Anyone with link can VIEW)</li>
              <li>
                Add Sheet ID to .env.local:{" "}
                <code className="bg-blue-100 px-1 rounded">NEXT_PUBLIC_GOOGLE_SHEETS_ID=your_id</code>
              </li>
            </ol>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button onClick={testConnection} disabled={isLoading} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Test Connection
          </Button>

          {connectionStatus?.success && (
            <Button onClick={handleSyncData} disabled={isLoading} size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Sync Data Now
            </Button>
          )}

          <Button variant="ghost" size="sm" asChild>
            <a
              href="https://console.cloud.google.com/apis/library/sheets.googleapis.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Google Cloud Console
            </a>
          </Button>
        </div>

        {/* Sync Status */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            {status === "success" ? (
              <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
            )}
            <div>
              <p className="font-medium">
                {status === "success" ? `${sheetsData.length} records synced` : "Awaiting first sync"}
              </p>
              <p className="text-sm text-gray-500">Last sync: {lastSyncTime}</p>
            </div>
          </div>
          <Button onClick={handleSyncData} disabled={isLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync Now
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
