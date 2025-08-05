"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TestAnalytics } from '@/lib/ranking-utils'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Target, Users, Award, BarChart3 } from 'lucide-react'

interface TestAnalyticsCardProps {
  analytics: TestAnalytics | null
  testName: string
}

export default function TestAnalyticsCard({ analytics, testName }: TestAnalyticsCardProps) {
  if (!analytics) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            テスト分析情報
          </CardTitle>
          <CardDescription>
            {testName} の統計データ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">分析データを読み込み中...</p>
        </CardContent>
      </Card>
    )
  }

  const stats = [
    {
      label: "受験者数",
      value: analytics.total_students,
      icon: Users,
      color: "bg-blue-500",
      suffix: "名"
    },
    {
      label: "平均点",
      value: Math.round(analytics.avg_score * 10) / 10,
      icon: Target,
      color: "bg-green-500",
      suffix: "点"
    },
    {
      label: "最高点",
      value: analytics.max_score,
      icon: TrendingUp,
      color: "bg-orange-500",
      suffix: "点"
    },
    {
      label: "最低点",
      value: analytics.min_score,
      icon: TrendingDown,
      color: "bg-red-500",
      suffix: "点"
    },
    {
      label: "合格者数",
      value: analytics.passing_count,
      icon: Award,
      color: "bg-purple-500",
      suffix: "名"
    },
    {
      label: "合格率",
      value: `${Math.round(analytics.passing_rate * 10) / 10}`,
      icon: BarChart3,
      color: "bg-indigo-500",
      suffix: "%"
    }
  ]

  const sectionStats = [
    { name: "分野A", avg: Math.round(analytics.avg_section_a * 10) / 10 },
    { name: "分野B", avg: Math.round(analytics.avg_section_b * 10) / 10 },
    { name: "分野C", avg: Math.round(analytics.avg_section_c * 10) / 10 },
    { name: "分野D", avg: Math.round(analytics.avg_section_d * 10) / 10 },
    { name: "A+D合計", avg: Math.round(analytics.avg_section_ad * 10) / 10 },
    { name: "B+C合計", avg: Math.round(analytics.avg_section_bc * 10) / 10 }
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            テスト分析情報
          </CardTitle>
          <CardDescription>
            {testName} の統計データ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold">
                      {stat.value}{stat.suffix}
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg ${stat.color}`}>
                    <stat.icon className="h-4 w-4 text-white" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>分野別平均点</CardTitle>
          <CardDescription>
            各分野の平均得点
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {sectionStats.map((section, index) => (
              <motion.div
                key={section.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <span className="font-medium">{section.name}</span>
                <Badge variant="secondary" className="ml-2">
                  {section.avg}点
                </Badge>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {analytics.std_dev && (
        <Card>
          <CardHeader>
            <CardTitle>得点分布</CardTitle>
            <CardDescription>
              標準偏差: {Math.round(analytics.std_dev * 10) / 10}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              <p>• 標準偏差が大きい場合、得点のばらつきが大きいことを示します</p>
              <p>• 標準偏差が小さい場合、得点が平均に集中していることを示します</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
