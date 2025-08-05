"use client"

import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowUpDown, Calendar, Users, CheckCircle, Sun, Moon } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// 成績データの型定義
type TestScore = {
  id: string
  student_id: string
  name?: string
  test_name: string
  test_date: string
  section_a?: number
  section_b?: number
  section_c?: number
  section_d?: number
  section_ad?: number
  section_bc?: number
  // 新しい分野構造
  section_kanri?: number      // 管理
  section_kaibou?: number     // 解剖
  section_gakkou?: number     // 顎口
  section_rikou?: number      // 理工
  section_yushou?: number     // 有床
  section_shikan?: number     // 歯冠
  section_kyousei?: number    // 矯正
  section_shouni?: number     // 小児
  total_score?: number
}

// テスト情報の型定義
type TestInfo = {
  test_name: string
  test_date: string
  displayName: string
}

// 学生グループの型定義
type StudentGroup = "day" | "evening" | "all"

// 新構造かどうかを判定する関数
const hasNewStructure = (score: TestScore): boolean => {
  return !!(score.section_kanri !== undefined || 
           score.section_kaibou !== undefined || 
           score.section_gakkou !== undefined ||
           score.section_rikou !== undefined ||
           score.section_yushou !== undefined ||
           score.section_shikan !== undefined ||
           score.section_kyousei !== undefined ||
           score.section_shouni !== undefined)
}

// データ構造を自動判定して統一フォーマットに変換
const normalizeScore = (score: TestScore) => {
  if (hasNewStructure(score)) {
    // 新構造の場合、そのまま返す
    return {
      ...score,
      structureType: 'new' as const
    }
  } else {
    // 旧構造の場合、可能な限り新構造に変換
    return {
      ...score,
      structureType: 'legacy' as const,
      // 旧構造のフィールドも保持
    }
  }
}

interface TestResultsListProps {
  scores: TestScore[]
}

export default function TestResultsList({ scores }: TestResultsListProps) {
  // 並べ替えオプション
  const [sortOption, setSortOption] = useState<string>("student_id")

  // 表示するグループ（全体、昼間部、夜間部）
  const [viewGroup, setViewGroup] = useState<StudentGroup>("all")

  // データ構造を判定（新構造のデータが1つでもあれば新構造として扱う）
  const isNewStructure = useMemo(() => {
    return scores.some(score => hasNewStructure(score))
  }, [scores])

  console.log(`TestResultsList: ${scores.length}件のデータ, 新構造: ${isNewStructure}`)

  // 合格基準（合計点の60%）
  const PASSING_TOTAL_PERCENTAGE = 0.6 // 合計点の60%

  // 学生が昼間部か夜間部かを判定する関数
  const getStudentGroup = (studentId: string): StudentGroup => {
    if (studentId.length >= 3) {
      const thirdDigit = studentId.charAt(2)
      if (thirdDigit === "2") return "day"
      if (thirdDigit === "3") return "evening"
    }
    return "all" // デフォルト値
  }

  // 合格判定関数（新構造用）
  const isPassingScore = (score: TestScore) => {
    const totalScore = score.total_score || 0
    const passingThreshold = isNewStructure ? 
      (8 * 20 * PASSING_TOTAL_PERCENTAGE) : // 新構造: 8分野×20点×60% = 96点
      (220 * PASSING_TOTAL_PERCENTAGE) // 旧構造: 220点×60% = 132点
    
    const isPassing = totalScore >= passingThreshold
    return { 
      isPassing, 
      passingThreshold,
      totalScore 
    }
  }

  // テスト情報を抽出
  const testInfos = useMemo(() => {
    const uniqueTests = new Map<string, TestInfo>()

    scores.forEach((score) => {
      const key = `${score.test_name}_${score.test_date}`
      if (!uniqueTests.has(key)) {
        uniqueTests.set(key, {
          test_name: score.test_name,
          test_date: score.test_date,
          displayName: `${score.test_name} (${new Date(score.test_date).toLocaleDateString("ja-JP")})`,
        })
      }
    })

    // 日付の新しい順に並べ替え
    return Array.from(uniqueTests.values()).sort(
      (a, b) => new Date(b.test_date).getTime() - new Date(a.test_date).getTime(),
    )
  }, [scores])

  // テストごとにスコアをグループ化
  const groupedScores = useMemo(() => {
    const grouped = new Map<string, TestScore[]>()

    testInfos.forEach((testInfo) => {
      const key = `${testInfo.test_name}_${testInfo.test_date}`
      const testScores = scores.filter(
        (score) => score.test_name === testInfo.test_name && score.test_date === testInfo.test_date,
      )
      grouped.set(key, testScores)
    })

    return grouped
  }, [scores, testInfos])

  // 順位を計算する関数
  const addRankings = (scores: TestScore[]) => {
    // 合計点数で降順ソート
    const sortedScores = [...scores].sort((a, b) => (b.total_score || 0) - (a.total_score || 0))
    
    // 順位を付与
    return sortedScores.map((score, index) => ({
      ...score,
      rank: index + 1
    }))
  }

  // 並べ替え関数（拡張版）
  const sortScores = (scores: TestScore[], option: string) => {
    return [...scores].sort((a, b) => {
      switch (option) {
        case "student_id":
          return a.student_id.localeCompare(b.student_id)
        case "name":
          return (a.name || "").localeCompare(b.name || "")
        case "section_kanri":
          return (b.section_kanri || 0) - (a.section_kanri || 0)
        case "section_kaibou":
          return (b.section_kaibou || 0) - (a.section_kaibou || 0)
        case "section_gakkou":
          return (b.section_gakkou || 0) - (a.section_gakkou || 0)
        case "section_rikou":
          return (b.section_rikou || 0) - (a.section_rikou || 0)
        case "section_yushou":
          return (b.section_yushou || 0) - (a.section_yushou || 0)
        case "section_shikan":
          return (b.section_shikan || 0) - (a.section_shikan || 0)
        case "section_kyousei":
          return (b.section_kyousei || 0) - (a.section_kyousei || 0)
        case "section_shouni":
          return (b.section_shouni || 0) - (a.section_shouni || 0)
        case "total_score":
          return (b.total_score || 0) - (a.total_score || 0)
        case "rank":
          return (a as any).rank - (b as any).rank
        case "judgment":
          const aPass = isPassingScore(a).isPassing
          const bPass = isPassingScore(b).isPassing
          if (aPass && !bPass) return -1
          if (!aPass && bPass) return 1
          return 0
        default:
          return 0
      }
    })
  }

  // 合格者数を計算
  const calculatePassingStats = (scores: TestScore[], group: StudentGroup = "all") => {
    // グループでフィルタリング
    const filteredScores =
      group === "all" ? scores : scores.filter((score) => getStudentGroup(score.student_id) === group)

    const count = filteredScores.length
    if (count === 0)
      return {
        passCount: 0,
        passRate: "0.0",
        count: 0,
        passingThreshold: 0,
      }

    const passingThreshold = isNewStructure ? 
      (8 * 20 * PASSING_TOTAL_PERCENTAGE) : // 新構造: 8分野×20点×60% = 96点
      (220 * PASSING_TOTAL_PERCENTAGE) // 旧構造: 220点×60% = 132点

    const passCount = filteredScores.filter(score => isPassingScore(score).isPassing).length

    return {
      passCount,
      passRate: ((passCount / count) * 100).toFixed(1),
      count,
      passingThreshold: Math.round(passingThreshold),
    }
  }

  // 新構造用の平均点を計算
  const calculateNewStructureAverages = (scores: TestScore[], group: StudentGroup = "all") => {
    // グループでフィルタリング
    const filteredScores =
      group === "all" ? scores : scores.filter((score) => getStudentGroup(score.student_id) === group)

    const count = filteredScores.length
    if (count === 0)
      return {
        section_kanri: 0,
        section_kaibou: 0,
        section_gakkou: 0,
        section_rikou: 0,
        section_yushou: 0,
        section_shikan: 0,
        section_kyousei: 0,
        section_shouni: 0,
        total_score: 0,
        count: 0,
      }

    return {
      section_kanri: filteredScores.reduce((sum, score) => sum + (score.section_kanri || 0), 0) / count,
      section_kaibou: filteredScores.reduce((sum, score) => sum + (score.section_kaibou || 0), 0) / count,
      section_gakkou: filteredScores.reduce((sum, score) => sum + (score.section_gakkou || 0), 0) / count,
      section_rikou: filteredScores.reduce((sum, score) => sum + (score.section_rikou || 0), 0) / count,
      section_yushou: filteredScores.reduce((sum, score) => sum + (score.section_yushou || 0), 0) / count,
      section_shikan: filteredScores.reduce((sum, score) => sum + (score.section_shikan || 0), 0) / count,
      section_kyousei: filteredScores.reduce((sum, score) => sum + (score.section_kyousei || 0), 0) / count,
      section_shouni: filteredScores.reduce((sum, score) => sum + (score.section_shouni || 0), 0) / count,
      total_score: filteredScores.reduce((sum, score) => sum + (score.total_score || 0), 0) / count,
      count,
    }
  }

  // 平均点を計算
  const calculateAverages = (scores: TestScore[], group: StudentGroup = "all") => {
    // グループでフィルタリング
    const filteredScores =
      group === "all" ? scores : scores.filter((score) => getStudentGroup(score.student_id) === group)

    const count = filteredScores.length
    if (count === 0)
      return {
        section_a: 0,
        section_b: 0,
        section_c: 0,
        section_d: 0,
        section_ad: 0,
        section_bc: 0,
        total_score: 0,
        count: 0,
      }

    return {
      section_a: filteredScores.reduce((sum, score) => sum + (score.section_a || 0), 0) / count,
      section_b: filteredScores.reduce((sum, score) => sum + (score.section_b || 0), 0) / count,
      section_c: filteredScores.reduce((sum, score) => sum + (score.section_c || 0), 0) / count,
      section_d: filteredScores.reduce((sum, score) => sum + (score.section_d || 0), 0) / count,
      section_ad: filteredScores.reduce((sum, score) => sum + (score.section_ad || 0), 0) / count,
      section_bc: filteredScores.reduce((sum, score) => sum + (score.section_bc || 0), 0) / count,
      total_score: filteredScores.reduce((sum, score) => sum + (score.total_score || 0), 0) / count,
      count,
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium">{testInfos.length}個のテストが登録されています</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm">並べ替え:</span>
          <Select value={sortOption} onValueChange={setSortOption}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="並べ替え" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="student_id">学生ID順</SelectItem>
              <SelectItem value="name">学生名順</SelectItem>
              {isNewStructure ? (
                <>
                  <SelectItem value="section_kanri">管理点数順</SelectItem>
                  <SelectItem value="section_kaibou">解剖点数順</SelectItem>
                  <SelectItem value="section_gakkou">顎口点数順</SelectItem>
                  <SelectItem value="section_rikou">理工点数順</SelectItem>
                  <SelectItem value="section_yushou">有床点数順</SelectItem>
                  <SelectItem value="section_shikan">歯冠点数順</SelectItem>
                  <SelectItem value="section_kyousei">矯正点数順</SelectItem>
                  <SelectItem value="section_shouni">小児点数順</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="section_ad">AD問題点数順</SelectItem>
                  <SelectItem value="section_bc">BC問題点数順</SelectItem>
                </>
              )}
              <SelectItem value="total_score">合計点数順</SelectItem>
              <SelectItem value="judgment">判定順</SelectItem>
              <SelectItem value="rank">順位順</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {testInfos.map((testInfo) => {
          const key = `${testInfo.test_name}_${testInfo.test_date}`
          const testScores = groupedScores.get(key) || []
          
          // 順位を追加
          const scoresWithRank = addRankings(testScores)
          const sortedScores = sortScores(scoresWithRank, sortOption)

          // 全体、昼間部、夜間部の平均点を計算
          const allAverages = isNewStructure ? 
            calculateNewStructureAverages(testScores, "all") :
            calculateAverages(testScores, "all")
          const dayAverages = isNewStructure ? 
            calculateNewStructureAverages(testScores, "day") :
            calculateAverages(testScores, "day")
          const eveningAverages = isNewStructure ? 
            calculateNewStructureAverages(testScores, "evening") :
            calculateAverages(testScores, "evening")

          // 全体、昼間部、夜間部の合格状況を計算
          const allPassingStats = calculatePassingStats(testScores, "all")
          const dayPassingStats = calculatePassingStats(testScores, "day")
          const eveningPassingStats = calculatePassingStats(testScores, "evening")

          return (
            <AccordionItem key={key} value={key}>
              <AccordionTrigger className="hover:bg-muted/50 px-4 py-2 rounded-lg">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-left">
                  <span className="font-medium">{testInfo.test_name}</span>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(testInfo.test_date).toLocaleDateString("ja-JP")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{allAverages.count}名</span>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    合格率 {allPassingStats.passRate}%
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Card className="mt-2">
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm font-medium">試験概要</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <Tabs defaultValue="all" className="mb-4">
                      <TabsList>
                        <TabsTrigger value="all" onClick={() => setViewGroup("all")}>
                          <Users className="h-4 w-4 mr-1" />
                          全体 ({allAverages.count}名)
                        </TabsTrigger>
                        <TabsTrigger value="day" onClick={() => setViewGroup("day")}>
                          <Sun className="h-4 w-4 mr-1" />
                          昼間部 ({dayAverages.count}名)
                        </TabsTrigger>
                        <TabsTrigger value="evening" onClick={() => setViewGroup("evening")}>
                          <Moon className="h-4 w-4 mr-1" />
                          夜間部 ({eveningAverages.count}名)
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="all" className="mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="bg-muted/30 p-3 rounded-md">
                            <div className="text-xs text-muted-foreground mb-1">受験者数</div>
                            <div className="bg-white p-2 rounded-md shadow-sm">
                              <div className="font-medium text-lg">{allAverages.count}名</div>
                            </div>
                          </div>

                          <div className="bg-muted/30 p-3 rounded-md">
                            <div className="text-xs text-muted-foreground mb-1">合格基準</div>
                            <div className="bg-white p-2 rounded-md shadow-sm">
                              <div className="text-xs text-muted-foreground">合計点</div>
                              <div className="font-medium text-primary">{allPassingStats.passingThreshold}点以上 (60%)</div>
                            </div>
                          </div>

                          <div className="bg-muted/30 p-3 rounded-md">
                            <div className="text-xs text-muted-foreground mb-1">合格者状況</div>
                            <div className="bg-white p-2 rounded-md shadow-sm">
                              <div className="font-medium text-green-600">{allPassingStats.passRate}%</div>
                              <div className="text-xs">
                                {allPassingStats.passCount}/{allAverages.count}名
                              </div>
                            </div>
                          </div>
                        </div>

                        {isNewStructure ? (
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                            <div className="bg-muted/50 p-2 rounded-md">
                              <div className="text-xs text-muted-foreground">管理平均</div>
                              <div className="font-medium">{allAverages.section_kanri.toFixed(1)}</div>
                            </div>
                            <div className="bg-muted/50 p-2 rounded-md">
                              <div className="text-xs text-muted-foreground">解剖平均</div>
                              <div className="font-medium">{allAverages.section_kaibou.toFixed(1)}</div>
                            </div>
                            <div className="bg-muted/50 p-2 rounded-md">
                              <div className="text-xs text-muted-foreground">顎口平均</div>
                              <div className="font-medium">{allAverages.section_gakkou.toFixed(1)}</div>
                            </div>
                            <div className="bg-muted/50 p-2 rounded-md">
                              <div className="text-xs text-muted-foreground">理工平均</div>
                              <div className="font-medium">{allAverages.section_rikou.toFixed(1)}</div>
                            </div>
                            <div className="bg-muted/50 p-2 rounded-md">
                              <div className="text-xs text-muted-foreground">有床平均</div>
                              <div className="font-medium">{allAverages.section_yushou.toFixed(1)}</div>
                            </div>
                            <div className="bg-muted/50 p-2 rounded-md">
                              <div className="text-xs text-muted-foreground">歯冠平均</div>
                              <div className="font-medium">{allAverages.section_shikan.toFixed(1)}</div>
                            </div>
                            <div className="bg-muted/50 p-2 rounded-md">
                              <div className="text-xs text-muted-foreground">矯正平均</div>
                              <div className="font-medium">{allAverages.section_kyousei.toFixed(1)}</div>
                            </div>
                            <div className="bg-muted/50 p-2 rounded-md">
                              <div className="text-xs text-muted-foreground">小児平均</div>
                              <div className="font-medium">{allAverages.section_shouni.toFixed(1)}</div>
                            </div>
                            <div className="bg-primary/10 p-2 rounded-md">
                              <div className="text-xs text-muted-foreground">合計平均</div>
                              <div className="font-medium">{allAverages.total_score.toFixed(1)}</div>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 md:grid-cols-7 gap-2 text-sm">
                            <div className="bg-muted/50 p-2 rounded-md">
                              <div className="text-xs text-muted-foreground">A問題</div>
                              <div className="font-medium">{allAverages.section_a.toFixed(1)}</div>
                            </div>
                            <div className="bg-muted/50 p-2 rounded-md">
                              <div className="text-xs text-muted-foreground">B問題</div>
                              <div className="font-medium">{allAverages.section_b.toFixed(1)}</div>
                            </div>
                            <div className="bg-muted/50 p-2 rounded-md">
                              <div className="text-xs text-muted-foreground">C問題</div>
                              <div className="font-medium">{allAverages.section_c.toFixed(1)}</div>
                            </div>
                            <div className="bg-muted/50 p-2 rounded-md">
                              <div className="text-xs text-muted-foreground">D問題</div>
                              <div className="font-medium">{allAverages.section_d.toFixed(1)}</div>
                            </div>
                            <div className="bg-muted/50 p-2 rounded-md">
                              <div className="text-xs text-muted-foreground">AD問題</div>
                              <div className="font-medium">{allAverages.section_ad.toFixed(1)}</div>
                            </div>
                            <div className="bg-muted/50 p-2 rounded-md">
                              <div className="text-xs text-muted-foreground">BC問題</div>
                              <div className="font-medium">{allAverages.section_bc.toFixed(1)}</div>
                            </div>
                            <div className="bg-primary/10 p-2 rounded-md">
                              <div className="text-xs text-muted-foreground">合計</div>
                              <div className="font-medium">{allAverages.total_score.toFixed(1)}</div>
                            </div>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="day" className="mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="bg-muted/30 p-3 rounded-md">
                            <div className="text-xs text-muted-foreground mb-1">
                              <span className="flex items-center">
                                <Sun className="h-4 w-4 mr-1" />
                                昼間部 受験者数
                              </span>
                            </div>
                            <div className="bg-white p-2 rounded-md shadow-sm">
                              <div className="font-medium text-lg">{dayAverages.count}名</div>
                            </div>
                          </div>

                          <div className="bg-muted/30 p-3 rounded-md">
                            <div className="text-xs text-muted-foreground mb-1">昼間部 合格状況</div>
                            <div className="bg-white p-2 rounded-md shadow-sm">
                              <div className="font-medium text-green-600">{dayPassingStats.passRate}%</div>
                              <div className="text-xs">
                                {dayPassingStats.passCount}/{dayAverages.count}名
                              </div>
                            </div>
                          </div>
                        </div>

                        {isNewStructure ? (
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                            <div className="bg-muted/50 p-2 rounded-md">
                              <div className="text-xs text-muted-foreground">管理平均</div>
                              <div className="font-medium">{dayAverages.section_kanri.toFixed(1)}</div>
                            </div>
                            <div className="bg-muted/50 p-2 rounded-md">
                              <div className="text-xs text-muted-foreground">解剖平均</div>
                              <div className="font-medium">{dayAverages.section_kaibou.toFixed(1)}</div>
                            </div>
                            <div className="bg-muted/50 p-2 rounded-md">
                              <div className="text-xs text-muted-foreground">顎口平均</div>
                              <div className="font-medium">{dayAverages.section_gakkou.toFixed(1)}</div>
                            </div>
                            <div className="bg-muted/50 p-2 rounded-md">
                              <div className="text-xs text-muted-foreground">理工平均</div>
                              <div className="font-medium">{dayAverages.section_rikou.toFixed(1)}</div>
                            </div>
                            <div className="bg-muted/50 p-2 rounded-md">
                              <div className="text-xs text-muted-foreground">有床平均</div>
                              <div className="font-medium">{dayAverages.section_yushou.toFixed(1)}</div>
                            </div>
                            <div className="bg-muted/50 p-2 rounded-md">
                              <div className="text-xs text-muted-foreground">歯冠平均</div>
                              <div className="font-medium">{dayAverages.section_shikan.toFixed(1)}</div>
                            </div>
                            <div className="bg-muted/50 p-2 rounded-md">
                              <div className="text-xs text-muted-foreground">矯正平均</div>
                              <div className="font-medium">{dayAverages.section_kyousei.toFixed(1)}</div>
                            </div>
                            <div className="bg-muted/50 p-2 rounded-md">
                              <div className="text-xs text-muted-foreground">小児平均</div>
                              <div className="font-medium">{dayAverages.section_shouni.toFixed(1)}</div>
                            </div>
                            <div className="bg-primary/10 p-2 rounded-md">
                              <div className="text-xs text-muted-foreground">合計平均</div>
                              <div className="font-medium">{dayAverages.total_score.toFixed(1)}</div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-muted-foreground">旧構造データの詳細表示</div>
                        )}
                      </TabsContent>

                      <TabsContent value="evening" className="mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="bg-muted/30 p-3 rounded-md">
                            <div className="text-xs text-muted-foreground mb-1">
                              <span className="flex items-center">
                                <Moon className="h-4 w-4 mr-1" />
                                夜間部 受験者数
                              </span>
                            </div>
                            <div className="bg-white p-2 rounded-md shadow-sm">
                              <div className="font-medium text-lg">{eveningAverages.count}名</div>
                            </div>
                          </div>

                          <div className="bg-muted/30 p-3 rounded-md">
                            <div className="text-xs text-muted-foreground mb-1">夜間部 合格状況</div>
                            <div className="bg-white p-2 rounded-md shadow-sm">
                              <div className="font-medium text-green-600">{eveningPassingStats.passRate}%</div>
                              <div className="text-xs">
                                {eveningPassingStats.passCount}/{eveningAverages.count}名
                              </div>
                            </div>
                          </div>
                        </div>

                        {isNewStructure ? (
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                            <div className="bg-muted/50 p-2 rounded-md">
                              <div className="text-xs text-muted-foreground">管理平均</div>
                              <div className="font-medium">{eveningAverages.section_kanri.toFixed(1)}</div>
                            </div>
                            <div className="bg-muted/50 p-2 rounded-md">
                              <div className="text-xs text-muted-foreground">解剖平均</div>
                              <div className="font-medium">{eveningAverages.section_kaibou.toFixed(1)}</div>
                            </div>
                            <div className="bg-muted/50 p-2 rounded-md">
                              <div className="text-xs text-muted-foreground">顎口平均</div>
                              <div className="font-medium">{eveningAverages.section_gakkou.toFixed(1)}</div>
                            </div>
                            <div className="bg-muted/50 p-2 rounded-md">
                              <div className="text-xs text-muted-foreground">理工平均</div>
                              <div className="font-medium">{eveningAverages.section_rikou.toFixed(1)}</div>
                            </div>
                            <div className="bg-muted/50 p-2 rounded-md">
                              <div className="text-xs text-muted-foreground">有床平均</div>
                              <div className="font-medium">{eveningAverages.section_yushou.toFixed(1)}</div>
                            </div>
                            <div className="bg-muted/50 p-2 rounded-md">
                              <div className="text-xs text-muted-foreground">歯冠平均</div>
                              <div className="font-medium">{eveningAverages.section_shikan.toFixed(1)}</div>
                            </div>
                            <div className="bg-muted/50 p-2 rounded-md">
                              <div className="text-xs text-muted-foreground">矯正平均</div>
                              <div className="font-medium">{eveningAverages.section_kyousei.toFixed(1)}</div>
                            </div>
                            <div className="bg-muted/50 p-2 rounded-md">
                              <div className="text-xs text-muted-foreground">小児平均</div>
                              <div className="font-medium">{eveningAverages.section_shouni.toFixed(1)}</div>
                            </div>
                            <div className="bg-primary/10 p-2 rounded-md">
                              <div className="text-xs text-muted-foreground">合計平均</div>
                              <div className="font-medium">{eveningAverages.total_score.toFixed(1)}</div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-muted-foreground">旧構造データの詳細表示</div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                <div className="overflow-x-auto mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1 -ml-3 font-medium"
                            onClick={() => setSortOption("student_id")}
                          >
                            学生ID
                            {sortOption === "student_id" && <ArrowUpDown className="h-3 w-3" />}
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1 -ml-3 font-medium"
                            onClick={() => setSortOption("name")}
                          >
                            学生名
                            {sortOption === "name" && <ArrowUpDown className="h-3 w-3" />}
                          </Button>
                        </TableHead>
                        {isNewStructure ? (
                          // 新構造のヘッダー
                          <>
                            <TableHead className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-1 -ml-3 font-medium"
                                onClick={() => setSortOption("section_kanri")}
                              >
                                管理
                                {sortOption === "section_kanri" && <ArrowUpDown className="h-3 w-3" />}
                              </Button>
                            </TableHead>
                            <TableHead className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-1 -ml-3 font-medium"
                                onClick={() => setSortOption("section_kaibou")}
                              >
                                解剖
                                {sortOption === "section_kaibou" && <ArrowUpDown className="h-3 w-3" />}
                              </Button>
                            </TableHead>
                            <TableHead className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-1 -ml-3 font-medium"
                                onClick={() => setSortOption("section_gakkou")}
                              >
                                顎口
                                {sortOption === "section_gakkou" && <ArrowUpDown className="h-3 w-3" />}
                              </Button>
                            </TableHead>
                            <TableHead className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-1 -ml-3 font-medium"
                                onClick={() => setSortOption("section_rikou")}
                              >
                                理工
                                {sortOption === "section_rikou" && <ArrowUpDown className="h-3 w-3" />}
                              </Button>
                            </TableHead>
                            <TableHead className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-1 -ml-3 font-medium"
                                onClick={() => setSortOption("section_yushou")}
                              >
                                有床
                                {sortOption === "section_yushou" && <ArrowUpDown className="h-3 w-3" />}
                              </Button>
                            </TableHead>
                            <TableHead className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-1 -ml-3 font-medium"
                                onClick={() => setSortOption("section_shikan")}
                              >
                                歯冠
                                {sortOption === "section_shikan" && <ArrowUpDown className="h-3 w-3" />}
                              </Button>
                            </TableHead>
                            <TableHead className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-1 -ml-3 font-medium"
                                onClick={() => setSortOption("section_kyousei")}
                              >
                                矯正
                                {sortOption === "section_kyousei" && <ArrowUpDown className="h-3 w-3" />}
                              </Button>
                            </TableHead>
                            <TableHead className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-1 -ml-3 font-medium"
                                onClick={() => setSortOption("section_shouni")}
                              >
                                小児
                                {sortOption === "section_shouni" && <ArrowUpDown className="h-3 w-3" />}
                              </Button>
                            </TableHead>
                          </>
                        ) : (
                          // 旧構造のヘッダー（レガシー用）
                          <>
                            <TableHead className="text-right">A問題</TableHead>
                            <TableHead className="text-right">B問題</TableHead>
                            <TableHead className="text-right">C問題</TableHead>
                            <TableHead className="text-right">D問題</TableHead>
                            <TableHead className="text-right">AD問題</TableHead>
                            <TableHead className="text-right">BC問題</TableHead>
                          </>
                        )}
                        <TableHead className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1 -ml-3 font-medium"
                            onClick={() => setSortOption("total_score")}
                          >
                            合計
                            {sortOption === "total_score" && <ArrowUpDown className="h-3 w-3" />}
                          </Button>
                        </TableHead>
                        <TableHead className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1 -ml-3 font-medium"
                            onClick={() => setSortOption("judgment")}
                          >
                            判定
                            {sortOption === "judgment" && <ArrowUpDown className="h-3 w-3" />}
                          </Button>
                        </TableHead>
                        <TableHead className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1 -ml-3 font-medium"
                            onClick={() => setSortOption("rank")}
                          >
                            順位
                            {sortOption === "rank" && <ArrowUpDown className="h-3 w-3" />}
                          </Button>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedScores
                        .filter((score) => viewGroup === "all" || getStudentGroup(score.student_id) === viewGroup)
                        .map((score) => {
                          const { isPassing } = isPassingScore(score)
                          const studentGroup = getStudentGroup(score.student_id)
                          const rank = (score as any).rank

                          return (
                            <TableRow key={score.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-1">
                                  {score.student_id}
                                  {studentGroup === "day" && <Sun className="h-3 w-3 text-amber-500" />}
                                  {studentGroup === "evening" && <Moon className="h-3 w-3 text-blue-500" />}
                                </div>
                              </TableCell>
                              <TableCell>{score.name || "名前なし"}</TableCell>
                              {isNewStructure ? (
                                // 新構造のデータ表示
                                <>
                                  <TableCell className="text-right">{score.section_kanri || "-"}</TableCell>
                                  <TableCell className="text-right">{score.section_kaibou || "-"}</TableCell>
                                  <TableCell className="text-right">{score.section_gakkou || "-"}</TableCell>
                                  <TableCell className="text-right">{score.section_rikou || "-"}</TableCell>
                                  <TableCell className="text-right">{score.section_yushou || "-"}</TableCell>
                                  <TableCell className="text-right">{score.section_shikan || "-"}</TableCell>
                                  <TableCell className="text-right">{score.section_kyousei || "-"}</TableCell>
                                  <TableCell className="text-right">{score.section_shouni || "-"}</TableCell>
                                </>
                              ) : (
                                // 旧構造のデータ表示
                                <>
                                  <TableCell className="text-right">{score.section_a || "-"}</TableCell>
                                  <TableCell className="text-right">{score.section_b || "-"}</TableCell>
                                  <TableCell className="text-right">{score.section_c || "-"}</TableCell>
                                  <TableCell className="text-right">{score.section_d || "-"}</TableCell>
                                  <TableCell className="text-right">{score.section_ad || "-"}</TableCell>
                                  <TableCell className="text-right">{score.section_bc || "-"}</TableCell>
                                </>
                              )}
                              <TableCell className="text-right font-medium">{score.total_score || "-"}</TableCell>
                              <TableCell className="text-center">
                                {isPassing ? (
                                  <Badge className="bg-green-500">合格</Badge>
                                ) : (
                                  <Badge variant="destructive">不合格</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-center font-medium">
                                {rank ? `${rank}位` : "-"}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                    </TableBody>
                  </Table>
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  )
}
