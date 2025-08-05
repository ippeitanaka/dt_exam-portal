"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion } from 'framer-motion'
import { Trophy, Medal, Award, User, TrendingUp, TrendingDown } from 'lucide-react'
import { TestScore } from '@/lib/ranking-utils'

interface DeviationRankingsProps {
  testData: TestScore[]
  testName: string
}

interface StudentWithDeviation extends TestScore {
  deviation_score: number
}

export default function DeviationRankings({ testData, testName }: DeviationRankingsProps) {
  // 偏差値を計算する関数
  const calculateDeviationScores = (): StudentWithDeviation[] => {
    if (!testData || testData.length === 0) return []
    
    const scores = testData.map(student => student.total_score)
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - average, 2), 0) / scores.length
    const standardDeviation = Math.sqrt(variance)
    
    // 標準偏差が0の場合のハンドリング
    const safeSd = standardDeviation === 0 ? 1 : standardDeviation
    
    return testData.map(student => ({
      ...student,
      deviation_score: 50 + ((student.total_score - average) * 10 / safeSd)
    })).sort((a, b) => b.deviation_score - a.deviation_score)
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />
      default:
        return <User className="h-4 w-4 text-gray-400" />
    }
  }

  const getDeviationIcon = (deviation: number) => {
    if (deviation >= 60) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (deviation <= 40) return <TrendingDown className="h-4 w-4 text-red-500" />
    return null
  }

  const getDeviationBadgeVariant = (deviation: number) => {
    if (deviation >= 70) return "default"
    if (deviation >= 60) return "secondary"
    if (deviation >= 50) return "outline"
    if (deviation >= 40) return "destructive"
    return "destructive"
  }

  const getDeviationColor = (deviation: number) => {
    if (deviation >= 70) return 'text-green-600 font-bold'
    if (deviation >= 60) return 'text-blue-600 font-semibold'
    if (deviation >= 50) return 'text-gray-700'
    if (deviation >= 40) return 'text-orange-600'
    return 'text-red-600 font-semibold'
  }

  const studentsWithDeviation = calculateDeviationScores()

  if (studentsWithDeviation.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>偏差値ランキング</CardTitle>
          <CardDescription>偏差値による順位表示</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            データがありません
          </div>
        </CardContent>
      </Card>
    )
  }

  const average = studentsWithDeviation.reduce((sum, student) => sum + student.total_score, 0) / studentsWithDeviation.length

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>偏差値ランキング</CardTitle>
        <CardDescription>
          {testName} の偏差値による順位 (平均点: {Math.round(average * 10) / 10}点)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4 mb-6 text-center">
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600 font-medium">偏差値70以上</p>
              <p className="text-lg font-bold text-green-700">
                {studentsWithDeviation.filter(s => s.deviation_score >= 70).length}名
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">偏差値60以上</p>
              <p className="text-lg font-bold text-blue-700">
                {studentsWithDeviation.filter(s => s.deviation_score >= 60).length}名
              </p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <p className="text-sm text-orange-600 font-medium">偏差値40-50</p>
              <p className="text-lg font-bold text-orange-700">
                {studentsWithDeviation.filter(s => s.deviation_score >= 40 && s.deviation_score < 50).length}名
              </p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <p className="text-sm text-red-600 font-medium">偏差値40未満</p>
              <p className="text-lg font-bold text-red-700">
                {studentsWithDeviation.filter(s => s.deviation_score < 40).length}名
              </p>
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {studentsWithDeviation.map((student, index) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                  index < 3 
                    ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {getRankIcon(index + 1)}
                  <div>
                    <p className="font-medium">{student.name}</p>
                    <p className="text-sm text-muted-foreground">
                      ID: {student.student_id}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold text-lg">{student.total_score}点</p>
                    <p className="text-sm text-muted-foreground">
                      得点: {student.section_ad}+{student.section_bc}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getDeviationIcon(student.deviation_score)}
                    <div className="text-right">
                      <p className={`text-xl font-bold ${getDeviationColor(student.deviation_score)}`}>
                        {Math.round(student.deviation_score * 10) / 10}
                      </p>
                      <p className="text-xs text-muted-foreground">偏差値</p>
                    </div>
                  </div>
                  
                  <Badge variant={getDeviationBadgeVariant(student.deviation_score)}>
                    {index + 1}位
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
