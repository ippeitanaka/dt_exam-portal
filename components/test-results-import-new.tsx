"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, FileText, CheckCircle, Download, Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function TestResultsImportNew() {
  const [isImporting, setIsImporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [importResults, setImportResults] = useState<any>(null)
  const [csvPreview, setCsvPreview] = useState<string[][]>([])
  const [fileName, setFileName] = useState("")
  const [testType, setTestType] = useState<'100q' | '80q'>('100q') // テストタイプ選択
  const { toast } = useToast()

  // CSVテンプレートをダウンロードする関数
  const handleDownloadTemplate = async (templateType: 'new' | 'legacy' = 'legacy') => {
    setIsExporting(true)
    try {
      const response = await fetch(`/api/download-csv-template?type=${templateType === 'new' ? 'testResults' : 'testResultsLegacy'}`)
      if (!response.ok) {
        throw new Error("テンプレートのダウンロードに失敗しました")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = templateType === 'new' ? "test_results_template_new.csv" : "test_results_template_legacy.csv"
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "成功",
        description: `CSVテンプレート（${templateType === 'new' ? '新構造' : '従来構造'}）をダウンロードしました`,
      })
    } catch (error) {
      console.error("テンプレートダウンロードエラー:", error)
      toast({
        title: "エラー",
        description: "CSVテンプレートのダウンロードに失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  // CSVファイルをプレビュー表示する関数
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)

    try {
      const text = await file.text()
      const rows = text
        .split("\n")
        .filter((row) => row.trim() !== "")
        .map((row) => {
          // 簡易的なCSV解析
          const result = []
          let current = ""
          let inQuotes = false

          for (let i = 0; i < row.length; i++) {
            const char = row[i]

            if (char === '"') {
              inQuotes = !inQuotes
            } else if (char === "," && !inQuotes) {
              result.push(current.trim())
              current = ""
            } else {
              current += char
            }
          }

          result.push(current.trim())
          return result
        })

      setCsvPreview(rows.slice(0, 6)) // ヘッダー＋5行を表示
    } catch (error) {
      console.error("CSVプレビューエラー:", error)
      setCsvPreview([])
    }
  }

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault()

    const fileInput = document.getElementById("csvFile") as HTMLInputElement
    const file = fileInput.files?.[0]
    const testNameInput = document.getElementById("testName") as HTMLInputElement
    const testDateInput = document.getElementById("testDate") as HTMLInputElement

    if (!file || !testNameInput.value || !testDateInput.value) {
      toast({
        title: "エラー",
        description: "ファイル、テスト名、日付をすべて指定してください",
        variant: "destructive",
      })
      return
    }

    setIsImporting(true)
    setSuccess(false)
    setImportResults(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("testName", testNameInput.value)
      formData.append("testDate", testDateInput.value)
      formData.append("testType", testType) // テストタイプを追加

      const response = await fetch("/api/import-csv-new", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()
      console.log("インポート結果:", result)

      if (response.ok) {
        setSuccess(true)
        setImportResults(result)
        toast({
          title: "成功",
          description: result.message,
        })
        
        // フォームをリセット
        ;(document.getElementById("csvFile") as HTMLInputElement).value = ""
        ;(document.getElementById("testName") as HTMLInputElement).value = ""
        ;(document.getElementById("testDate") as HTMLInputElement).value = ""
        setCsvPreview([])
        setFileName("")
      } else {
        throw new Error(result.error || "不明なエラー")
      }
    } catch (error) {
      console.error("インポートエラー:", error)
      setImportResults(null)
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "インポートに失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* CSVテンプレートダウンロード */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            CSVテンプレートダウンロード
          </CardTitle>
          <CardDescription>
            試験結果をインポートするためのCSVテンプレートをダウンロードできます
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 新しい分野構造テンプレート */}
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">📊 新しい分野構造（推奨）</h4>
              <p className="text-sm text-muted-foreground mb-2">
                以下の順序で列を配置してください：
              </p>
              <div className="grid grid-cols-2 md:grid-cols-7 gap-2 text-xs mb-2">
                <Badge variant="default">学生ID</Badge>
                <Badge variant="default">氏名</Badge>
                <Badge variant="default">テスト名</Badge>
                <Badge variant="default">テスト日付</Badge>
                <Badge variant="default">総得点</Badge>
                <Badge variant="outline">管理</Badge>
                <Badge variant="outline">解剖</Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-7 gap-2 text-xs">
                <Badge variant="outline">顎口</Badge>
                <Badge variant="outline">理工</Badge>
                <Badge variant="outline">有床</Badge>
                <Badge variant="outline">歯冠</Badge>
                <Badge variant="outline">矯正</Badge>
                <Badge variant="outline">小児</Badge>
                <Badge variant="outline">満点</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                ※ 分野別得点を正確に記録できます
              </p>
              <Button 
                onClick={() => handleDownloadTemplate('new')} 
                disabled={isExporting}
                className="w-full sm:w-auto mt-2"
                variant="default"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                新分野構造テンプレートをダウンロード
              </Button>
            </div>

            {/* 旧構造テンプレート */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">📚 従来のA/B/C/D構造（互換用）</h4>
              <p className="text-sm text-muted-foreground mb-2">
                以下の順序で列を配置してください：
              </p>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-xs">
                <Badge variant="secondary">学生ID</Badge>
                <Badge variant="secondary">氏名</Badge>
                <Badge variant="secondary">総得点</Badge>
                <Badge variant="outline">A問題</Badge>
                <Badge variant="outline">B問題</Badge>
                <Badge variant="outline">C問題</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                ※ 最低「学生ID、氏名、総得点」の3列があれば動作します
              </p>
              <Button 
                onClick={() => handleDownloadTemplate('legacy')} 
                disabled={isExporting}
                className="w-full sm:w-auto mt-2"
                variant="outline"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                従来構造テンプレートをダウンロード
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* テスト結果インポート */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            テスト結果インポート
          </CardTitle>
          <CardDescription>
            CSVファイルから試験結果をインポートします
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleImport}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="testName">テスト名</Label>
                <Input
                  id="testName"
                  placeholder="第1回模擬試験"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="testDate">実施日</Label>
                <Input
                  id="testDate"
                  type="date"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="testType">テストタイプ</Label>
                <Select value={testType} onValueChange={(value: '100q' | '80q') => setTestType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="テストタイプを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100q">100問テスト（100点満点）</SelectItem>
                    <SelectItem value="80q">80問テスト（80点満点）</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {testType === '100q' 
                    ? '合格点: 60点（60%）' 
                    : '合格点: 48点（60%）'
                  }
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="csvFile">CSVファイル</Label>
              <Input
                id="csvFile"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                required
              />
              {fileName && (
                <p className="text-sm text-muted-foreground">
                  選択されたファイル: {fileName}
                </p>
              )}
            </div>

            {/* CSVプレビュー */}
            {csvPreview.length > 0 && (
              <div className="space-y-2">
                <Label>CSVプレビュー (最初の5行)</Label>
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto max-h-64">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted">
                          {csvPreview[0]?.map((header, index) => (
                            <TableHead key={index} className="whitespace-nowrap">
                              {header}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {csvPreview.slice(1, 6).map((row, rowIndex) => (
                          <TableRow key={rowIndex}>
                            {row.map((cell, cellIndex) => (
                              <TableCell key={cellIndex} className="whitespace-nowrap">
                                {cell}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isImporting} className="w-full sm:w-auto">
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  インポート中...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  インポート実行
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* インポート結果表示 */}
      {success && importResults && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              インポート完了
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-white p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {importResults.summary?.total || 0}
                </div>
                <div className="text-sm text-muted-foreground">総データ数</div>
              </div>
              <div className="bg-white p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">
                  {importResults.summary?.imported || 0}
                </div>
                <div className="text-sm text-muted-foreground">インポート成功</div>
              </div>
              <div className="bg-white p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {importResults.summary?.skipped || 0}
                </div>
                <div className="text-sm text-muted-foreground">スキップ</div>
              </div>
              <div className="bg-white p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">
                  {importResults.summary?.errors || 0}
                </div>
                <div className="text-sm text-muted-foreground">エラー</div>
              </div>
            </div>

            {importResults.errors && importResults.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>エラーが発生しました</AlertTitle>
                <AlertDescription>
                  <div className="mt-2 max-h-32 overflow-y-auto">
                    {importResults.errors.map((error: string, index: number) => (
                      <div key={index} className="text-sm">
                        • {error}
                      </div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
