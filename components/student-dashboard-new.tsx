"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Medal,
  Award,
  Star,
  AlertCircle,
  BookOpen,
  Activity,
  Calendar,
  CheckCircle,
  Brain,
  Trophy,
  BarChart3,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { TestScoreWithStats } from "@/lib/ranking-utils"
import { motion } from "framer-motion"
import { DentalMascot } from "@/components/paramedic-mascot"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Student = {
  id: string
  name: string
  student_id: string
}

// 問題領域の表示名マッピング
const sectionNames = {
  section_a: "A問題（一般）",
  section_b: "B問題（必修）",
  section_c: "C問題（必修症例）",
  section_d: "D問題（一般症例）",
  section_ad: "AD問題（一般合計）",
  section_bc: "BC問題（必修合計）",
}

// アチーブメントの定義
const achievements = [
  {
    id: 1,
    name: "合格ライン突破",
    description: "合格ラインを超えました",
    icon: <Award className="h-5 w-5" />,
    color: "bg-green-500",
  },
  {
    id: 2,
    name: "トップ10入り",
    description: "ランキングトップ10に入りました",
    icon: <Medal className="h-5 w-5" />,
    color: "bg-blue-500",
  },
  {
    id: 3,
    name: "連続合格",
    description: "3回連続で合格ラインを超えました",
    icon: <Activity className="h-5 w-5" />,
    color: "bg-purple-500",
  },
  {
    id: 4,
    name: "学習マスター",
    description: "全ての分野で平均点以上を獲得",
    icon: <BookOpen className="h-5 w-5" />,
    color: "bg-indigo-500",
  },
]

// AI分析関数
const fetchAiAnalysis = async (scores: TestScoreWithStats[], studentName?: string) => {
  try {
    const response = await fetch('/api/ai-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentScores: scores,
        studentName: studentName || "学生"
      })
    })
    
    const data = await response.json()
    if (data.success) {
      return data.analysis
    }
    return "AI分析エラーが発生しました。"
  } catch (error) {
    console.error("AI分析エラー:", error)
    return "AI分析エラーが発生しました。"
  }
}

export default function StudentDashboard({
  student,
  scores: propsScores,
}: {
  student: Student
  scores: TestScoreWithStats[]
}) {
  const [activeTab, setActiveTab] = useState("overview")
  const [scores] = useState<TestScoreWithStats[]>(propsScores)
  const [aiAnalysis, setAiAnalysis] = useState<string>("")
  const [analysisLoading, setAnalysisLoading] = useState(false)

  // 成績データがない場合
  if (scores.length === 0) {
    return (
      <Card className="card-decorated">
        <CardHeader>
          <CardTitle>成績データ</CardTitle>
          <CardDescription>現在の成績情報</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              まだ成績データがありません。模擬試験を受けると、ここに結果が表示されます。
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // 最新のスコア
  const latestScore = scores[0]

  // 成績の傾向分析
  const getTrend = () => {
    if (scores.length < 2) return { trend: "neutral", message: "まだ傾向を分析するのに十分なデータがありません" }

    const sortedScores = [...scores].sort((a, b) => new Date(a.test_date).getTime() - new Date(b.test_date).getTime())
    const recentScores = sortedScores.slice(-3) // 最新の3つのスコア

    // 最新のスコアと1つ前のスコアを比較
    const latestScore = recentScores[recentScores.length - 1].total_score || 0
    const previousScore = recentScores[recentScores.length - 2].total_score || 0

    const difference = latestScore - previousScore

    if (difference > 5) {
      return {
        trend: "up",
        message: `前回より${difference.toFixed(1)}点上昇しています。このまま頑張りましょう！`,
        icon: <TrendingUp className="h-5 w-5 text-green-500" />,
      }
    } else if (difference < -5) {
      return {
        trend: "down",
        message: `前回より${Math.abs(difference).toFixed(1)}点下降しています。復習を強化しましょう。`,
        icon: <TrendingDown className="h-5 w-5 text-red-500" />,
      }
    } else {
      return {
        trend: "neutral",
        message: "成績は安定しています。引き続き学習を続けましょう。",
        icon: <Minus className="h-5 w-5 text-blue-500" />,
      }
    }
  }

  const trend = getTrend()

  // 合格ラインに対する状況（新しい判定基準）
  const isPassingScore = (score: TestScoreWithStats) => {
    return (score.section_ad || 0) >= 132 && (score.section_bc || 0) >= 44
  }

  const passStatus = isPassingScore(latestScore)
    ? {
        status: "pass",
        message: "現在の成績は合格ラインを超えています。このまま維持しましょう！",
      }
    : {
        status: "fail",
        message: `合格には、AD問題（一般合計）が${Math.max(0, 132 - (latestScore.section_ad || 0))}点、BC問題（必修合計）が${Math.max(0, 44 - (latestScore.section_bc || 0))}点足りません。もう少し頑張りましょう！`,
      }

  // 実績の達成回数を計算
  const calculateAchievementCounts = () => {
    // 合格ライン突破回数
    const passingCount = scores.filter((score) => isPassingScore(score)).length

    // トップ10入り回数
    const top10Count = scores.filter((score) => score.rank <= 10).length

    // 連続合格回数（最大の連続回数を計算）
    let maxConsecutivePassing = 0
    let currentConsecutive = 0
    const sortedByDate = [...scores].sort((a, b) => new Date(a.test_date).getTime() - new Date(b.test_date).getTime())

    sortedByDate.forEach((score) => {
      if (isPassingScore(score)) {
        currentConsecutive++
        maxConsecutivePassing = Math.max(maxConsecutivePassing, Math.floor(currentConsecutive / 3))
      } else {
        currentConsecutive = 0
      }
    })

    // 学習マスター回数（全分野で平均以上）
    const masterCount = scores.filter((score) =>
      Object.keys(sectionNames).every((section) => (score as any)[section] > (score as any)[`avg_${section}`]),
    ).length

    return {
      passingCount,
      top10Count,
      consecutivePassingCount: maxConsecutivePassing,
      masterCount,
    }
  }

  const achievementCounts = calculateAchievementCounts()

  // 学習レベルの計算（実績達成回数に基づく）
  const totalAchievements =
    achievementCounts.passingCount +
    achievementCounts.top10Count +
    achievementCounts.consecutivePassingCount +
    achievementCounts.masterCount

  const studyLevel = Math.max(1, totalAchievements)

  // AI分析を実行
  const handleAnalysis = async () => {
    setAnalysisLoading(true)
    const analysis = await fetchAiAnalysis(scores, student.name)
    setAiAnalysis(analysis)
    setAnalysisLoading(false)
  }

  // Format data for the chart
  const chartData = scores
    .map((score) => ({
      date: new Date(score.test_date).toLocaleDateString("ja-JP"),
      name: score.test_name,
      score: score.total_score,
      rank: score.rank,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // レーダーチャートのデータ
  const radarData = [
    {
      subject: "A問題\n（一般）",
      score: latestScore.section_a || 0,
      average: latestScore.avg_section_a || 0,
      fullMark: 50,
    },
    {
      subject: "B問題\n（必修）",
      score: latestScore.section_b || 0,
      average: latestScore.avg_section_b || 0,
      fullMark: 50,
    },
    {
      subject: "C問題\n（必修症例）",
      score: latestScore.section_c || 0,
      average: latestScore.avg_section_c || 0,
      fullMark: 50,
    },
    {
      subject: "D問題\n（一般症例）",
      score: latestScore.section_d || 0,
      average: latestScore.avg_section_d || 0,
      fullMark: 50,
    },
    {
      subject: "AD問題\n（一般合計）",
      score: latestScore.section_ad || 0,
      average: latestScore.avg_section_ad || 0,
      fullMark: 150,
    },
    {
      subject: "BC問題\n（必修合計）",
      score: latestScore.section_bc || 0,
      average: latestScore.avg_section_bc || 0,
      fullMark: 50,
    },
  ]

  return (
    <Tabs defaultValue="overview" onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-5 rounded-xl bg-muted/80">
        <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-primary">
          <div className="flex items-center gap-1 md:gap-2">
            <Activity size={14} className="md:h-4 md:w-4" />
            <span className="text-xs md:text-sm">概要</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="details" className="rounded-lg data-[state=active]:bg-primary">
          <div className="flex items-center gap-1 md:gap-2">
            <BookOpen size={14} className="md:h-4 md:w-4" />
            <span className="text-xs md:text-sm">詳細成績</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="analysis" className="rounded-lg data-[state=active]:bg-primary">
          <div className="flex items-center gap-1 md:gap-2">
            <Target size={14} className="md:h-4 md:w-4" />
            <span className="text-xs md:text-sm">成績分析</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="ranking" className="rounded-lg data-[state=active]:bg-primary">
          <div className="flex items-center gap-1 md:gap-2">
            <Medal size={14} className="md:h-4 md:w-4" />
            <span className="text-xs md:text-sm">順位情報</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="achievements" className="rounded-lg data-[state=active]:bg-primary">
          <div className="flex items-center gap-1 md:gap-2">
            <Award size={14} className="md:h-4 md:w-4" />
            <span className="text-xs md:text-sm">実績</span>
          </div>
        </TabsTrigger>
      </TabsList>

      {/* 概要タブ */}
      <TabsContent value="overview" className="mt-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="card-decorated bg-gradient-to-br from-white to-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                成績概要
              </CardTitle>
              <CardDescription>模擬試験の成績推移</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-white to-blue-50">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-500">受験回数</p>
                      <div className="flex items-center justify-center mt-1">
                        <BookOpen className="h-5 w-5 text-primary mr-1" />
                        <p className="text-3xl font-bold">{scores.length}回</p>
                      </div>
                      <div className="mt-2">
                        <div className="inline-block bg-gradient-to-r from-blue-400 to-primary text-white px-2 py-1 rounded-full text-xs">
                          Lv{studyLevel}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden border-2 border-secondary/20 bg-gradient-to-br from-white to-green-50">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-500">最新の点数</p>
                      <div className="flex flex-col items-center justify-center mt-1 gap-3">
                        <div className="flex items-center justify-center gap-2">
                          <div className="flex flex-col">
                            <span className="font-medium text-primary">AD問題（一般）</span>
                            <span className="text-2xl font-bold">{latestScore.section_ad || 0}点</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <div className="flex flex-col">
                            <span className="font-medium text-secondary">BC問題（必修）</span>
                            <span className="text-2xl font-bold">{latestScore.section_bc || 0}点</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            passStatus.status === "pass"
                              ? "bg-green-100 text-green-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {passStatus.status === "pass" ? "合格ライン突破" : "もう少し"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden border-2 border-accent/20 bg-gradient-to-br from-white to-pink-50">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-500">総合順位</p>
                      <div className="flex items-center justify-center mt-1">
                        <Medal className="h-5 w-5 text-accent mr-1" />
                        <p className="text-3xl font-bold">{latestScore.total_rank || "-"}位</p>
                      </div>
                      <div className="mt-2">
                        {latestScore.avg_rank !== undefined && (
                          <span className="text-xs text-muted-foreground">
                            平均順位: {latestScore.avg_rank.toFixed(1)}位
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="h-80 w-full mb-8 bg-white p-4 rounded-xl shadow-sm">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" stroke="#888" fontSize={12} />
                    <YAxis domain={[0, 200]} stroke="#888" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#0ea5e9"
                      strokeWidth={3}
                      dot={{ r: 6, fill: "#0ea5e9", strokeWidth: 2, stroke: "white" }}
                      activeDot={{ r: 8, fill: "#0284c7" }}
                      name="点数"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="h-96 w-full bg-white p-4 rounded-xl shadow-sm">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart outerRadius={120} data={radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <PolarRadiusAxis angle={30} domain={[0, "auto"]} stroke="#94a3b8" />
                    <Radar name="あなたの点数" dataKey="score" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.6} />
                    <Radar name="平均点" dataKey="average" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                    <Legend wrapperStyle={{ paddingTop: "20px" }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </TabsContent>

      {/* 詳細成績タブ */}
      <TabsContent value="details" className="mt-4">
        <Card className="card-decorated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              詳細成績
            </CardTitle>
            <CardDescription>これまでの模擬試験の成績一覧</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>試験名</TableHead>
                    <TableHead>実施日</TableHead>
                    <TableHead className="text-right">A問題</TableHead>
                    <TableHead className="text-right">B問題</TableHead>
                    <TableHead className="text-right">C問題</TableHead>
                    <TableHead className="text-right">D問題</TableHead>
                    <TableHead className="text-right">AD問題</TableHead>
                    <TableHead className="text-right">BC問題</TableHead>
                    <TableHead className="text-right">合計</TableHead>
                    <TableHead className="text-center">順位</TableHead>
                    <TableHead className="text-center">判定</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scores.map((score, index) => {
                    const adPassing = (score.section_ad || 0) >= 132
                    const bcPassing = (score.section_bc || 0) >= 44
                    const passed = adPassing && bcPassing

                    return (
                      <TableRow
                        key={score.id}
                        className={`hover:bg-blue-50/50 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                      >
                        <TableCell className="font-medium">{score.test_name}</TableCell>
                        <TableCell>{new Date(score.test_date).toLocaleDateString("ja-JP")}</TableCell>
                        <TableCell className="text-right">{score.section_a || "-"}</TableCell>
                        <TableCell className="text-right">{score.section_b || "-"}</TableCell>
                        <TableCell className="text-right">{score.section_c || "-"}</TableCell>
                        <TableCell className="text-right">{score.section_d || "-"}</TableCell>
                        <TableCell className={`text-right font-medium ${adPassing ? "bg-green-50 text-green-700" : ""}`}>
                          {score.section_ad || "-"}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${bcPassing ? "bg-green-50 text-green-700" : ""}`}>
                          {score.section_bc || "-"}
                        </TableCell>
                        <TableCell className="text-right font-medium">{score.total_score || "-"}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-blue-50 border-blue-200">
                            {score.rank || "-"}位
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={passed ? "default" : "destructive"} className={passed ? "bg-green-500" : ""}>
                            {passed ? "合格" : "不合格"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* 成績分析タブ */}
      <TabsContent value="analysis" className="mt-4">
        <Card className="card-decorated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              AI成績分析
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button onClick={handleAnalysis} disabled={analysisLoading} size="sm">
                {analysisLoading ? "分析中..." : "分析を開始"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {aiAnalysis ? (
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">{aiAnalysis}</div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                「分析を開始」ボタンを押して、AI による成績分析を受けてください
              </div>
            )}
            
            {/* 傾向分析 */}
            <Card className="mt-6 overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-white to-blue-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    最近の傾向
                  </CardTitle>
                  {trend.icon}
                </div>
              </CardHeader>
              <CardContent>
                <p>{trend.message}</p>
              </CardContent>
            </Card>

            {/* 合格ライン比較 */}
            <Card className="mt-4 overflow-hidden border-2 border-secondary/20 bg-gradient-to-br from-white to-green-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5 text-secondary" />
                    合格ラインとの比較
                  </CardTitle>
                  <Badge
                    variant={passStatus.status === "pass" ? "default" : "outline"}
                    className={passStatus.status === "pass" ? "bg-green-500" : ""}
                  >
                    {passStatus.status === "pass" ? "合格ライン超え" : "もう少し"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p>{passStatus.message}</p>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </TabsContent>

      {/* 順位情報タブ */}
      <TabsContent value="ranking" className="mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                最新模試順位
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{latestScore.rank || "-"}位</div>
                <div className="text-sm text-muted-foreground">
                  {latestScore.total_students || "-"}名中
                </div>
                <div className="mt-2 text-sm">{latestScore.test_name}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                総合順位
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{latestScore.total_rank || "-"}位</div>
                <div className="text-sm text-muted-foreground">
                  全体順位
                </div>
                <div className="mt-2 text-sm">
                  平均点: {latestScore.total_score?.toFixed(1) || "-"}点
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* 実績タブ */}
      <TabsContent value="achievements" className="mt-4">
        <Card className="card-decorated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              学習実績
            </CardTitle>
            <CardDescription>あなたの学習の軌跡</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">受験回数</div>
                <div className="text-2xl font-bold">{scores.length}回</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">合格回数</div>
                <div className="text-2xl font-bold">{achievementCounts.passingCount}回</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">平均点</div>
                <div className="text-2xl font-bold">
                  {scores.length > 0
                    ? (scores.reduce((sum, score) => sum + (score.total_score || 0), 0) / scores.length).toFixed(1)
                    : 0}
                  点
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((achievement, index) => {
                const count = Object.values(achievementCounts)[index] || 0
                const unlocked = count > 0

                return (
                  <Card
                    key={achievement.id}
                    className={`p-4 ${unlocked ? "bg-gradient-to-br from-white to-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${unlocked ? achievement.color : "bg-gray-300"}`}>
                        {achievement.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-medium ${unlocked ? "text-gray-900" : "text-gray-500"}`}>
                          {achievement.name}
                        </h3>
                        <p className={`text-sm ${unlocked ? "text-gray-600" : "text-gray-400"}`}>
                          {achievement.description}
                        </p>
                        {unlocked && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-sm font-medium text-green-600">達成回数: {count}回</span>
                            <div className="flex gap-1">
                              {Array.from({ length: Math.min(count, 5) }).map((_, i) => (
                                <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              ))}
                              {count > 5 && <span className="text-xs text-gray-500">+{count - 5}</span>}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
