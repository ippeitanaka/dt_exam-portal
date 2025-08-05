import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export type TestScore = {
  id: string
  student_id: string
  name?: string // name列を追加
  test_name: string
  test_date: string
  section_a: number
  section_b: number
  section_c: number
  section_d: number
  section_ad: number
  section_bc: number
  total_score: number
  created_at: string
  rank?: number
}

// TestScoreWithStats型にavg_rankプロパティを追加
export type TestScoreWithStats = TestScore & {
  avg_section_a: number
  avg_section_b: number
  avg_section_c: number
  avg_section_d: number
  avg_section_ad: number
  avg_section_bc: number
  avg_total_score: number
  rank: number
  total_rank: number
  avg_rank?: number
  previous_scores?: {
    section_a_change: number
    section_b_change: number
    section_c_change: number
    section_d_change: number
    section_ad_change: number
    section_bc_change: number
    total_score_change: number
  }
}

// インターフェース定義
export interface TestAnalytics {
  total_students: number;
  avg_score: number;
  max_score: number;
  min_score: number;
  passing_count: number;
  passing_rate: number;
  avg_section_a: number;
  avg_section_b: number;
  avg_section_c: number;
  avg_section_d: number;
  avg_section_ad: number;
  avg_section_bc: number;
  std_dev: number;
}

export interface TestRankingWithDeviation extends TestScore {
  deviation_score: number;
}

export interface SectionRanking {
  id: string;
  student_id: string;
  name: string;
  score: number;
  rank: number;
}
export async function getStudentScoresWithStats(studentId: string): Promise<TestScoreWithStats[]> {
  const supabase = createClientComponentClient()
  console.log("Getting scores for student:", studentId)

  try {
    // 1. 学生の全テスト結果を取得（name列も含める）
    const { data: studentScores, error: scoresError } = await supabase
      .from("test_scores")
      .select("*")
      .eq("student_id", studentId)
      .order("test_date", { ascending: false })

    if (scoresError || !studentScores) {
      console.error("成績データ取得エラー:", scoresError)
      return []
    }

    console.log(`Found ${studentScores.length} scores for student ${studentId}`)

    // 2. 各テストの平均点を計算
    const testAverages: Record<
      string,
      {
        avg_section_a: number
        avg_section_b: number
        avg_section_c: number
        avg_section_d: number
        avg_section_ad: number
        avg_section_bc: number
        avg_total_score: number
      }
    > = {}

    for (const score of studentScores) {
      try {
        console.log(`Getting averages for test: ${score.test_name}, date: ${score.test_date}`)

        const { data: avgData, error: avgError } = await supabase.rpc("get_test_averages", {
          p_test_name: score.test_name,
          p_test_date: score.test_date,
        })

        if (avgError) {
          console.error("平均点取得エラー:", avgError)
          continue
        }

        if (!avgData || avgData.length === 0) {
          console.warn(`No average data found for test: ${score.test_name}, date: ${score.test_date}`)
          continue
        }

        testAverages[`${score.test_name}_${score.test_date}`] = avgData[0]
      } catch (err) {
        console.error(`Error getting averages for test ${score.test_name}:`, err)
      }
    }

    // 3. 各テストの順位を計算
    const testRankings: Record<string, number> = {}
    for (const score of studentScores) {
      try {
        console.log(`Getting rank for student ${studentId} in test: ${score.test_name}, date: ${score.test_date}`)

        const { data: rankData, error: rankError } = await supabase.rpc("get_student_rank", {
          p_student_id: studentId,
          p_test_name: score.test_name,
          p_test_date: score.test_date,
        })

        if (rankError) {
          console.error("順位取得エラー:", rankError)
          continue
        }

        if (!rankData || rankData.length === 0) {
          console.warn(`No rank data found for student ${studentId} in test: ${score.test_name}`)
          continue
        }

        testRankings[`${score.test_name}_${score.test_date}`] = rankData[0].rank
      } catch (err) {
        console.error(`Error getting rank for test ${score.test_name}:`, err)
      }
    }

    // 4. 総合順位を計算
    let totalRank = 0
    let avgRank = 0
    try {
      console.log(`Getting total rank for student ${studentId}`)

      const { data: totalRankData, error: totalRankError } = await supabase.rpc("get_student_total_rank", {
        p_student_id: studentId,
      })

      if (totalRankError) {
        console.error("総合順位取得エラー:", totalRankError)
      } else if (totalRankData && totalRankData.length > 0) {
        totalRank = totalRankData[0].rank
        avgRank = totalRankData[0].avg_rank
      }
    } catch (err) {
      console.error(`Error getting total rank for student ${studentId}:`, err)
    }

    // 5. 前回のテスト結果との比較
    const sortedScores = [...studentScores].sort(
      (a, b) => new Date(a.test_date).getTime() - new Date(b.test_date).getTime(),
    )
    const previousScores: Record<string, TestScore | undefined> = {}

    for (let i = 1; i < sortedScores.length; i++) {
      previousScores[sortedScores[i].test_name] = sortedScores[i - 1]
    }

    // 6. 結果を組み合わせる
    return studentScores.map((score) => {
      const testKey = `${score.test_name}_${score.test_date}`
      const avgData = testAverages[testKey] || {
        avg_section_a: 0,
        avg_section_b: 0,
        avg_section_c: 0,
        avg_section_d: 0,
        avg_section_ad: 0,
        avg_section_bc: 0,
        avg_total_score: 0,
      }

      const prevScore = previousScores[score.test_name]
      const previousScoreData = prevScore
        ? {
            section_a_change: (score.section_a || 0) - (prevScore.section_a || 0),
            section_b_change: (score.section_b || 0) - (prevScore.section_b || 0),
            section_c_change: (score.section_c || 0) - (prevScore.section_c || 0),
            section_d_change: (score.section_d || 0) - (prevScore.section_d || 0),
            section_ad_change: (score.section_ad || 0) - (prevScore.section_ad || 0),
            section_bc_change: (score.section_bc || 0) - (prevScore.section_bc || 0),
            total_score_change: (score.total_score || 0) - (prevScore.total_score || 0),
          }
        : undefined

      return {
        ...score,
        ...avgData,
        rank: testRankings[testKey] || 0,
        total_rank: totalRank,
        avg_rank: avgRank,
        previous_scores: previousScoreData,
      }
    })
  } catch (error) {
    console.error("getStudentScoresWithStats error:", error)
    return []
  }
}

// 特定のテストの全学生の成績と順位を取得
export async function getTestRankings(testName: string, testDate: string): Promise<TestScore[]> {
  const supabase = createClientComponentClient()
  console.log(`Getting rankings for test: ${testName}, date: ${testDate}`)

  try {
    // 一時的に直接テーブルからデータを取得し、ランキングを計算
    const { data: rawData, error } = await supabase
      .from('test_scores')
      .select('*')
      .eq('test_name', testName)
      .eq('test_date', testDate)
      .order('total_score', { ascending: false })

    if (error) {
      console.error("ランキング取得エラー:", error)
      return []
    }

    if (!rawData || rawData.length === 0) {
      console.warn(`No ranking data found for test: ${testName}, date: ${testDate}`)
      return []
    }

    // ランキングを手動で計算
    const dataWithRanks = rawData.map((item, index) => ({
      ...item,
      rank: index + 1
    }))

    console.log(`Found ${dataWithRanks.length} rankings for test: ${testName}`)
    return dataWithRanks
  } catch (err) {
    console.error(`Error getting rankings for test ${testName}:`, err)
    return []
  }
}

// 総合ランキングを取得
export async function getTotalRankings(): Promise<any[]> {
  const supabase = createClientComponentClient()
  console.log("Getting total rankings")

  try {
    // 一時的に直接テーブルからデータを取得し、平均を計算
    const { data: rawData, error } = await supabase
      .from('test_scores')
      .select('student_id, name, total_score')

    if (error) {
      console.error("総合ランキング取得エラー:", error)
      return []
    }

    if (!rawData || rawData.length === 0) {
      console.warn("No total ranking data found")
      return []
    }

    // 学生ごとに平均点を計算
    const studentStats = rawData.reduce((acc: any, score: any) => {
      if (!acc[score.student_id]) {
        acc[score.student_id] = {
          student_id: score.student_id,
          name: score.name,
          total_scores: [],
          avg_total_score: 0,
          test_count: 0,
          rank: 0,
          avg_rank: 0
        }
      }
      acc[score.student_id].total_scores.push(score.total_score)
      return acc
    }, {})

    // 平均点を計算してランキングを作成
    const averageData = Object.values(studentStats).map((student: any) => ({
      ...student,
      avg_total_score: student.total_scores.reduce((sum: number, score: number) => sum + score, 0) / student.total_scores.length,
      test_count: student.total_scores.length,
      avg_rank: student.total_scores.reduce((sum: number, score: number) => sum + score, 0) / student.total_scores.length
    }))

    // ランキングを計算
    averageData.sort((a: any, b: any) => b.avg_total_score - a.avg_total_score)
    const rankedData = averageData.map((student: any, index: number) => ({
      ...student,
      rank: index + 1
    }))

    console.log(`Found ${rankedData.length} total rankings`)
    return rankedData
  } catch (err) {
    console.error("Error getting total rankings:", err)
    return []
  }
}

// テスト統計情報を取得
export async function getTestAnalytics(testName: string, testDate: string): Promise<TestAnalytics | null> {
  const supabase = createClientComponentClient()
  console.log(`Getting test analytics for ${testName} on ${testDate}`)

  try {
    // 一時的に直接テーブルからデータを取得して統計を計算
    const { data: rawData, error } = await supabase
      .from('test_scores')
      .select('*')
      .eq('test_name', testName)
      .eq('test_date', testDate)

    if (error) {
      console.error("テスト統計情報取得エラー:", error)
      return null
    }

    if (!rawData || rawData.length === 0) {
      console.warn("No analytics data found")
      return null
    }

    // 統計情報を計算
    const scores = rawData.map(s => s.total_score)
    const sectionAScores = rawData.map(s => s.section_a)
    const sectionBScores = rawData.map(s => s.section_b)
    const sectionCScores = rawData.map(s => s.section_c)
    const sectionDScores = rawData.map(s => s.section_d)
    const sectionADScores = rawData.map(s => s.section_ad)
    const sectionBCScores = rawData.map(s => s.section_bc)

    const avg = (arr: number[]) => arr.reduce((sum, val) => sum + val, 0) / arr.length
    const stdDev = (arr: number[], mean: number) => Math.sqrt(arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length)

    const avgScore = avg(scores)
    const passCount = rawData.filter(s => s.section_ad >= 132 && s.section_bc >= 44).length

    const analytics: TestAnalytics = {
      total_students: rawData.length,
      avg_score: avgScore,
      max_score: Math.max(...scores),
      min_score: Math.min(...scores),
      passing_count: passCount,
      passing_rate: (passCount / rawData.length) * 100,
      avg_section_a: avg(sectionAScores),
      avg_section_b: avg(sectionBScores),
      avg_section_c: avg(sectionCScores),
      avg_section_d: avg(sectionDScores),
      avg_section_ad: avg(sectionADScores),
      avg_section_bc: avg(sectionBCScores),
      std_dev: stdDev(scores, avgScore)
    }

    console.log("Analytics data calculated:", analytics)
    return analytics
  } catch (err) {
    console.error("Error getting test analytics:", err)
    return null
  }
}

// 偏差値付きランキングを取得
export async function getTestRankingsWithDeviation(testName: string, testDate: string): Promise<TestRankingWithDeviation[]> {
  const supabase = createClientComponentClient()
  console.log(`Getting test rankings with deviation for ${testName} on ${testDate}`)

  try {
    const { data, error } = await supabase.rpc("get_test_rankings_with_deviation", {
      p_test_name: testName,
      p_test_date: testDate
    })

    if (error) {
      console.error("偏差値付きランキング取得エラー:", error)
      return []
    }

    if (!data || data.length === 0) {
      console.warn("No deviation ranking data found")
      return []
    }

    console.log(`Found ${data.length} deviation rankings`)
    return data
  } catch (err) {
    console.error("Error getting deviation rankings:", err)
    return []
  }
}

// 分野別ランキングを取得（セクション指定）
export async function getSectionRankings(testName: string, testDate: string, section: 'a' | 'b' | 'c' | 'd' | 'ad' | 'bc'): Promise<SectionRanking[]> {
  const supabase = createClientComponentClient()
  console.log(`Getting section ${section} rankings for ${testName} on ${testDate}`)

  try {
    const functionName = `get_section_${section}_rankings`
    const { data, error } = await supabase.rpc(functionName, {
      p_test_name: testName,
      p_test_date: testDate
    })

    if (error) {
      console.error(`分野別ランキング取得エラー (${section}):`, error)
      return []
    }

    if (!data || data.length === 0) {
      console.warn(`No section ${section} ranking data found`)
      return []
    }

    // データの正規化
    const normalizedData = data.map((item: any) => ({
      id: item.id,
      student_id: item.student_id,
      name: item.name,
      score: item[`section_${section}`],
      rank: item.rank
    }))

    console.log(`Found ${normalizedData.length} section ${section} rankings`)
    return normalizedData
  } catch (err) {
    console.error(`Error getting section ${section} rankings:`, err)
    return []
  }
}
