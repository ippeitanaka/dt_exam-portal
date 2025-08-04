"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Badge } from "@/components/ui/badge"

interface TestResult {
  student_id: string
  name: string
  total_score: number
  section_a: number
  section_b: number
  section_c: number
  section_d: number
  section_ad: number
}

interface TestResultsViewProps {
  testName: string
  testDate: string
}

export default function TestResultsView({ testName, testDate }: TestResultsViewProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<TestResult[]>([])
  const [averages, setAverages] = useState<any>(null)

  const fetchResults = async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClientComponentClient()
      
      console.log("テスト結果取得開始:", { testName, testDate })
      
      // テスト結果を取得
      const { data: testResults, error: testError } = await supabase
        .from("test_scores")
        .select("*")
        .eq("test_name", testName)
        .eq("test_date", testDate)
        .order("total_score", { ascending: false })

      console.log("テスト結果:", testResults, testError)

      if (testError) {
        throw testError
      }

      if (testResults) {
        setResults(testResults)

        // 平均点を計算
        if (testResults.length > 0) {
          const totals = testResults.reduce((acc, result) => ({
            total_score: acc.total_score + (result.total_score || 0),
            section_a: acc.section_a + (result.section_a || 0),
            section_b: acc.section_b + (result.section_b || 0),
            section_c: acc.section_c + (result.section_c || 0),
            section_d: acc.section_d + (result.section_d || 0),
            section_ad: acc.section_ad + (result.section_ad || 0),
          }), {
            total_score: 0,
            section_a: 0,
            section_b: 0,
            section_c: 0,
            section_d: 0,
            section_ad: 0,
          })

          const count = testResults.length
          setAverages({
            total_score: (totals.total_score / count).toFixed(1),
            section_a: (totals.section_a / count).toFixed(1),
            section_b: (totals.section_b / count).toFixed(1),
            section_c: (totals.section_c / count).toFixed(1),
            section_d: (totals.section_d / count).toFixed(1),
            section_ad: (totals.section_ad / count).toFixed(1),
          })
        }
      } else {
        setResults([])
      }
    } catch (err) {
      console.error("テスト結果取得エラー:", err)
      setError("テスト結果の取得に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (testName && testDate) {
      fetchResults()
    }
  }, [testName, testDate])

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* 概要 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{testName}</span>
            <Badge variant="outline">{new Date(testDate).toLocaleDateString("ja-JP")}</Badge>
          </CardTitle>
          <CardDescription>
            受験者数: {results.length}名
          </CardDescription>
        </CardHeader>
        {averages && (
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-lg">{averages.total_score}</div>
                <div className="text-muted-foreground">総合平均</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">{averages.section_a}</div>
                <div className="text-muted-foreground">科目1平均</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">{averages.section_b}</div>
                <div className="text-muted-foreground">科目2平均</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">{averages.section_c}</div>
                <div className="text-muted-foreground">科目3平均</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">{averages.section_d}</div>
                <div className="text-muted-foreground">科目4平均</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">{averages.section_ad}</div>
                <div className="text-muted-foreground">科目5平均</div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* 結果一覧 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>テスト結果一覧</CardTitle>
            <CardDescription>得点順に表示</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchResults} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            更新
          </Button>
        </CardHeader>
        <CardContent>
          {results.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">順位</TableHead>
                    <TableHead>学生ID</TableHead>
                    <TableHead>氏名</TableHead>
                    <TableHead className="text-right">総得点</TableHead>
                    <TableHead className="text-right">科目1</TableHead>
                    <TableHead className="text-right">科目2</TableHead>
                    <TableHead className="text-right">科目3</TableHead>
                    <TableHead className="text-right">科目4</TableHead>
                    <TableHead className="text-right">科目5</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result, index) => (
                    <TableRow key={result.student_id}>
                      <TableCell className="text-center font-medium">
                        {index + 1}
                      </TableCell>
                      <TableCell>{result.student_id}</TableCell>
                      <TableCell>{result.name}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {result.total_score}
                      </TableCell>
                      <TableCell className="text-right">
                        {result.section_a || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        {result.section_b || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        {result.section_c || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        {result.section_d || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        {result.section_ad || 0}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>このテストの結果がありません</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
