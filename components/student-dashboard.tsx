"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import type { TestScoreWithStats } from "@/lib/ranking-utils"
import { isPassingScore, getPassingScore, TEST_CONFIGURATIONS } from "@/lib/ranking-utils"
import { motion } from "framer-motion"

type Student = {
  id: string
  name: string
  student_id: string
}

// 問題領域の表示名マッピング（新しいスキーマ対応）
const sectionNames = {
  section_kanri: "管理",
  section_kaibou: "解剖",
  section_gakkou: "顎口",
  section_rikou: "理工",
  section_yushou: "有床",
  section_shikan: "歯冠",
  section_kyousei: "矯正",
  section_shouni: "小児",
}

// 各科目の問題数
const sectionQuestionCounts = {
  section_kanri: 9,
  section_kaibou: 12,
  section_gakkou: 9,
  section_rikou: 16,
  section_yushou: 18,
  section_shikan: 18,
  section_kyousei: 9,
  section_shouni: 9,
}

// アチーブメントの定義
const achievements = [
  {
    id: 1,
    name: "合格ライン突破",
    description: "60点以上を獲得",
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
    name: "連続高得点",
    description: "3回連続で高得点を獲得",
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

  // 成績データがない場合の表示を改善
  if (scores.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="card-decorated bg-gradient-to-br from-white to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-500" />
              成績データについて
            </CardTitle>
            <CardDescription>現在の成績情報</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <div className="space-y-2">
                  <p><strong>模擬試験の成績データが利用可能になりました！</strong></p>
                  <p>ページを再読み込みすると、以下の情報が表示されます：</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>詳細な成績表と分野別点数</li>
                    <li>AI による個別学習アドバイス</li>
                    <li>成績推移グラフとレーダーチャート</li>
                    <li>クラス内順位と総合順位</li>
                    <li>学習実績とアチーブメント</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
        
        <Card className="card-decorated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              ダッシュボード機能プレビュー
            </CardTitle>
            <CardDescription>利用可能になる機能</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  <h3 className="font-medium text-blue-900">成績概要</h3>
                </div>
                <p className="text-sm text-blue-700">成績推移や統計データを視覚的に確認</p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-5 w-5 text-green-600" />
                  <h3 className="font-medium text-green-900">詳細成績</h3>
                </div>
                <p className="text-sm text-green-700">模擬試験の詳細な成績表と履歴</p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  <h3 className="font-medium text-purple-900">AI分析</h3>
                </div>
                <p className="text-sm text-purple-700">個別学習アドバイスと成績分析</p>
              </div>
              
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2 mb-2">
                  <Medal className="h-5 w-5 text-yellow-600" />
                  <h3 className="font-medium text-yellow-900">順位情報</h3>
                </div>
                <p className="text-sm text-yellow-700">クラス内順位と総合順位の確認</p>
              </div>
              
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-5 w-5 text-red-600" />
                  <h3 className="font-medium text-red-900">実績</h3>
                </div>
                <p className="text-sm text-red-700">学習実績とアチーブメント獲得</p>
              </div>
              
              <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-5 w-5 text-indigo-600" />
                  <h3 className="font-medium text-indigo-900">目標管理</h3>
                </div>
                <p className="text-sm text-indigo-700">合格ラインとの比較と対策</p>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">お知らせ</h4>
              <p className="text-sm text-gray-700">
                模擬試験の結果データが利用可能です。ページを再読み込みしてご確認ください。
              </p>
              <Button 
                onClick={() => window.location.reload()} 
                className="mt-3"
                size="sm"
              >
                ページを再読み込み
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 最新のスコア
  const latestScore = scores[0]

  // 成績の傾向分析
  const getTrend = () => {
    if (scores.length < 2) return { 
      trend: "neutral", 
      message: "データが1回分のみです。次回の模試で傾向を分析できます。", 
      icon: <Minus className="h-5 w-5 text-blue-500" />
    }

    const sortedScores = [...scores].sort((a, b) => new Date(a.test_date).getTime() - new Date(b.test_date).getTime())
    const recentScores = sortedScores.slice(-3) // 最新の3つのスコア

    // 最新のスコアと1つ前のスコアを比較
    const latestScore = recentScores[recentScores.length - 1].total_score || 0
    const previousScore = recentScores[recentScores.length - 2].total_score || 0

    const difference = latestScore - previousScore
    const passingScore = getPassingScore(recentScores[recentScores.length - 1].test_type || '100q')

    if (difference > 5) {
      return {
        trend: "up",
        message: `前回より${difference}点向上しました！📈 ${latestScore >= passingScore ? '合格ラインを維持しています。' : `合格まであと${passingScore - latestScore}点です。`}`,
        icon: <TrendingUp className="h-5 w-5 text-green-500" />,
      }
    } else if (difference < -5) {
      return {
        trend: "down",
        message: `前回より${Math.abs(difference)}点下降しました。📉 ${latestScore >= passingScore ? '合格ラインは維持していますが、復習を強化しましょう。' : '弱点分野を重点的に学習し、次回の向上を目指しましょう。'}`,
        icon: <TrendingDown className="h-5 w-5 text-red-500" />,
      }
    } else {
      return {
        trend: "neutral",
        message: `成績は安定しています。${latestScore >= passingScore ? '合格ラインを維持しており、さらなる高得点を目指しましょう。' : `合格まであと${passingScore - latestScore}点です。継続的な学習で目標達成を目指しましょう。`}`,
        icon: <Minus className="h-5 w-5 text-blue-500" />,
      }
    }
  }

  const trend = getTrend()

  // テストタイプに応じた合格判定
  const passingScore = getPassingScore(latestScore.test_type || '100q')
  const pointsToPass = Math.max(0, passingScore - (latestScore.total_score || 0))
  const passStatus = isPassingScore(latestScore)
    ? {
        status: "pass",
        pointsToPass: 0,
        message: `現在の成績は合格ライン（${passingScore}点）を${(latestScore.total_score || 0) - passingScore}点上回っています。この調子で頑張りましょう！`,
      }
    : {
        status: "fail", 
        pointsToPass: pointsToPass,
        message: `合格まであと${pointsToPass}点です。${pointsToPass <= 10 ? '集中的な復習で達成可能です！' : '計画的な学習で目標に向かいましょう。'}`,
      }

  // 実績の達成回数を計算
  const calculateAchievementCounts = () => {
    // 合格ライン突破回数
    const passingCount = scores.filter((score) => isPassingScore(score)).length

    // トップ10入り回数
    const top10Count = scores.filter((score) => (score.rank || 999) <= 10).length

    // 連続高得点回数（最大の連続回数を計算）
    let maxConsecutiveHigh = 0
    let currentConsecutive = 0
    const sortedByDate = [...scores].sort((a, b) => new Date(a.test_date).getTime() - new Date(b.test_date).getTime())

    sortedByDate.forEach((score) => {
      if ((score.total_score || 0) >= 70) {
        currentConsecutive++
        maxConsecutiveHigh = Math.max(maxConsecutiveHigh, Math.floor(currentConsecutive / 3))
      } else {
        currentConsecutive = 0
      }
    })

    // 学習マスター回数（全分野で平均以上）
    const masterCount = scores.filter((score) =>
      Object.keys(sectionNames).every((section) => {
        const scoreValue = (score as any)[section] || 0
        const avgValue = (score as any)[`avg_${section}`] || 0
        return scoreValue >= avgValue
      }),
    ).length

    return {
      passingCount,
      top10Count,
      consecutiveHighCount: maxConsecutiveHigh,
      masterCount,
    }
  }

  const achievementCounts = calculateAchievementCounts()

  // 学習レベルの計算（実績達成回数に基づく）
  const totalAchievements =
    achievementCounts.passingCount +
    achievementCounts.top10Count +
    achievementCounts.consecutiveHighCount +
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
      subject: "管理",
      score: latestScore.section_kanri || 0,
      average: latestScore.avg_section_kanri || 0,
      fullMark: 9,
    },
    {
      subject: "解剖",
      score: latestScore.section_kaibou || 0,
      average: latestScore.avg_section_kaibou || 0,
      fullMark: 12,
    },
    {
      subject: "顎口",
      score: latestScore.section_gakkou || 0,
      average: latestScore.avg_section_gakkou || 0,
      fullMark: 9,
    },
    {
      subject: "理工",
      score: latestScore.section_rikou || 0,
      average: latestScore.avg_section_rikou || 0,
      fullMark: 16,
    },
    {
      subject: "有床",
      score: latestScore.section_yushou || 0,
      average: latestScore.avg_section_yushou || 0,
      fullMark: 18,
    },
    {
      subject: "歯冠",
      score: latestScore.section_shikan || 0,
      average: latestScore.avg_section_shikan || 0,
      fullMark: 18,
    },
    {
      subject: "矯正",
      score: latestScore.section_kyousei || 0,
      average: latestScore.avg_section_kyousei || 0,
      fullMark: 9,
    },
    {
      subject: "小児",
      score: latestScore.section_shouni || 0,
      average: latestScore.avg_section_shouni || 0,
      fullMark: 9,
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
                      <div className="flex items-center justify-center mt-1">
                        <p className="text-3xl font-bold">{latestScore.total_score || 0}点</p>
                        <span className="text-lg text-gray-400 ml-1">
                          / {TEST_CONFIGURATIONS[latestScore.test_type || '100q'].total_questions}点
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        合格ライン: {getPassingScore(latestScore.test_type || '100q')}点
                      </p>
                      <div className="mt-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            passStatus.status === "pass"
                              ? "bg-green-100 text-green-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {passStatus.status === "pass" 
                            ? "合格ライン達成" 
                            : `あと${passStatus.pointsToPass}点で合格`}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden border-2 border-accent/20 bg-gradient-to-br from-white to-pink-50">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-500">順位</p>
                      <div className="flex items-center justify-center mt-1">
                        <Medal className="h-5 w-5 text-accent mr-1" />
                        <p className="text-3xl font-bold">{latestScore.rank || "-"}位</p>
                      </div>
                      <div className="mt-2">
                        <span className="text-xs text-muted-foreground">
                          最新テスト順位
                        </span>
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
                    <YAxis domain={[0, 100]} stroke="#888" fontSize={12} />
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
            {/* モバイル表示 - カード形式 */}
            <div className="block md:hidden space-y-4">
              {scores.map((score, index) => {
                const passed = isPassingScore(score)
                const maxScore = TEST_CONFIGURATIONS[score.test_type || '100q'].total_questions

                return (
                  <motion.div
                    key={score.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card className={`overflow-hidden border-l-4 ${passed ? 'border-l-green-500 bg-green-50/30' : 'border-l-red-500 bg-red-50/30'}`}>
                      <CardContent className="p-4">
                        {/* ヘッダー情報 */}
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{score.test_name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {new Date(score.test_date).toLocaleDateString("ja-JP")}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge variant="outline" className={`text-xs ${score.test_type === '80q' ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'}`}>
                              {score.test_type === '80q' ? '80問' : '100問'}
                            </Badge>
                            <Badge variant={passed ? "default" : "destructive"} className={passed ? "bg-green-500" : ""}>
                              {passed ? "合格" : "不合格"}
                            </Badge>
                          </div>
                        </div>

                        {/* 合計点と順位 */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="bg-white p-3 rounded-lg border">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-primary">
                                {score.total_score || 0}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                / {maxScore}点
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                合格ライン: {getPassingScore(score.test_type || '100q')}点
                              </div>
                            </div>
                          </div>
                          <div className="bg-white p-3 rounded-lg border">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-primary">
                                {score.rank || "-"}位
                              </div>
                              <div className="text-sm text-muted-foreground">
                                順位
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 分野別得点 */}
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm text-muted-foreground mb-2">分野別得点</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {Object.entries(sectionNames).map(([key, name]) => {
                              const sectionScore = (score as any)[key] || 0
                              const sectionMax = sectionQuestionCounts[key as keyof typeof sectionQuestionCounts]
                              const percentage = sectionMax > 0 ? (sectionScore / sectionMax) * 100 : 0
                              
                              return (
                                <div key={key} className="flex justify-between items-center py-1 px-2 bg-white rounded border">
                                  <span className="font-medium">{name}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-right">{sectionScore}/{sectionMax}</span>
                                    <div className="w-8 h-2 bg-gray-200 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full rounded-full transition-all duration-300 ${
                                          percentage >= 70 ? 'bg-green-500' : 
                                          percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                        }`}
                                        style={{ width: `${Math.min(percentage, 100)}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>

            {/* デスクトップ表示 - テーブル形式（改善版） */}
            <div className="hidden md:block">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="w-[200px]">試験名</TableHead>
                      <TableHead className="w-[100px]">実施日</TableHead>
                      <TableHead className="w-[80px] text-center">タイプ</TableHead>
                      <TableHead className="w-[60px] text-right">管理</TableHead>
                      <TableHead className="w-[60px] text-right">解剖</TableHead>
                      <TableHead className="w-[60px] text-right">顎口</TableHead>
                      <TableHead className="w-[60px] text-right">理工</TableHead>
                      <TableHead className="w-[60px] text-right">有床</TableHead>
                      <TableHead className="w-[60px] text-right">歯冠</TableHead>
                      <TableHead className="w-[60px] text-right">矯正</TableHead>
                      <TableHead className="w-[60px] text-right">小児</TableHead>
                      <TableHead className="w-[100px] text-right">合計</TableHead>
                      <TableHead className="w-[80px] text-center">順位</TableHead>
                      <TableHead className="w-[80px] text-center">判定</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scores.map((score, index) => {
                      const passed = isPassingScore(score)

                      return (
                        <TableRow
                          key={score.id}
                          className={`hover:bg-blue-50/50 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"} ${passed ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-red-500'}`}
                        >
                          <TableCell className="font-medium">{score.test_name}</TableCell>
                          <TableCell className="text-sm">{new Date(score.test_date).toLocaleDateString("ja-JP")}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={`text-xs ${score.test_type === '80q' ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'}`}>
                              {score.test_type === '80q' ? '80問' : '100問'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-sm">{score.section_kanri || "-"}</TableCell>
                          <TableCell className="text-right text-sm">{score.section_kaibou || "-"}</TableCell>
                          <TableCell className="text-right text-sm">{score.section_gakkou || "-"}</TableCell>
                          <TableCell className="text-right text-sm">{score.section_rikou || "-"}</TableCell>
                          <TableCell className="text-right text-sm">{score.section_yushou || "-"}</TableCell>
                          <TableCell className="text-right text-sm">{score.section_shikan || "-"}</TableCell>
                          <TableCell className="text-right text-sm">{score.section_kyousei || "-"}</TableCell>
                          <TableCell className="text-right text-sm">{score.section_shouni || "-"}</TableCell>
                          <TableCell className="text-right font-medium">
                            <div className="flex flex-col">
                              <span className="text-lg font-bold">{score.total_score || "-"}</span>
                              <span className="text-xs text-gray-400">
                                / {TEST_CONFIGURATIONS[score.test_type || '100q'].total_questions}
                              </span>
                            </div>
                          </TableCell>
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
                    {passStatus.status === "pass" ? "合格ライン達成" : `あと${passStatus.pointsToPass}点`}
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
                  最新テスト順位
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
