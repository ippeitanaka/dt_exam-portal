"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from 'framer-motion'
import { Trophy, Medal, Award, User } from 'lucide-react'
import { TestScore } from '@/lib/ranking-utils'

interface SectionRankingsProps {
  testData: TestScore[]
  testName: string
}

interface SectionData {
  id: string
  name: string
  section: 'section_a' | 'section_b' | 'section_c' | 'section_d' | 'section_ad' | 'section_bc'
  label: string
  description: string
}

const sections: SectionData[] = [
  { id: 'a', name: '分野A', section: 'section_a', label: 'A', description: '人体の構造と機能・疾病の成り立ち' },
  { id: 'b', name: '分野B', section: 'section_b', label: 'B', description: '歯・口腔の構造と機能・疾病・予防' },
  { id: 'c', name: '分野C', section: 'section_c', label: 'C', description: '歯科診療補助・歯科予防処置' },
  { id: 'd', name: '分野D', section: 'section_d', label: 'D', description: '歯科保健指導・その他' },
  { id: 'ad', name: 'A+D合計', section: 'section_ad', label: 'A+D', description: '分野AとDの合計点' },
  { id: 'bc', name: 'B+C合計', section: 'section_bc', label: 'B+C', description: '分野BとCの合計点' }
]

export default function SectionRankings({ testData, testName }: SectionRankingsProps) {
  const [selectedSection, setSelectedSection] = useState<string>('a')

  const getSectionRankings = (section: SectionData['section']) => {
    const sortedData = [...testData].sort((a, b) => b[section] - a[section])
    return sortedData.map((student, index) => ({
      ...student,
      rank: index + 1,
      score: student[section]
    }))
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

  const getRankBadgeVariant = (rank: number) => {
    if (rank === 1) return "default"
    if (rank <= 3) return "secondary" 
    if (rank <= 10) return "outline"
    return "secondary"
  }

  const currentSection = sections.find(s => s.id === selectedSection)!
  const rankings = getSectionRankings(currentSection.section)

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>分野別ランキング</CardTitle>
        <CardDescription>
          {testName} の分野別順位
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedSection} onValueChange={setSelectedSection}>
          <TabsList className="grid w-full grid-cols-6">
            {sections.map((section) => (
              <TabsTrigger key={section.id} value={section.id} className="text-xs">
                {section.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {sections.map((section) => (
            <TabsContent key={section.id} value={section.id} className="mt-6">
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold">{section.name}</h3>
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {getSectionRankings(section.section).map((student, index) => (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        student.rank <= 3 
                          ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {getRankIcon(student.rank)}
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-muted-foreground">
                            ID: {student.student_id}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="font-bold text-lg">{student.score}点</p>
                        </div>
                        <Badge variant={getRankBadgeVariant(student.rank)}>
                          {student.rank}位
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {rankings.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    データがありません
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
