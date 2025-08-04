"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function TestImportPage() {
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/test-import")
      const result = await response.json()
      setTestResult(result)
    } catch (error) {
      setTestResult({ error: "接続テストに失敗しました" })
    }
    setLoading(false)
  }

  const testImport = async () => {
    setLoading(true)
    try {
      const formData = new FormData()
      
      // テスト用のCSVファイルを作成
      const csvContent = `番号,氏名,得点,科目1,科目2,科目3,科目4,科目5
001,テスト太郎,300,80,70,75,75,0`
      
      const blob = new Blob([csvContent], { type: "text/csv" })
      const file = new File([blob], "test.csv", { type: "text/csv" })
      
      formData.append("file", file)
      formData.append("testName", "テストインポート")
      formData.append("testDate", "2024-01-01")

      const response = await fetch("/api/test-import", {
        method: "POST",
        body: formData,
      })
      
      const result = await response.json()
      setTestResult(result)
    } catch (error) {
      setTestResult({ error: "インポートテストに失敗しました" })
    }
    setLoading(false)
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>インポートテスト</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={testConnection} disabled={loading}>
              接続テスト
            </Button>
            <Button onClick={testImport} disabled={loading}>
              インポートテスト
            </Button>
          </div>
          
          {testResult && (
            <Alert>
              <AlertDescription>
                <pre className="whitespace-pre-wrap text-sm">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
