import { createClient } from "@supabase/supabase-js"

// Service role client for admin operations
const getSupabaseAdmin = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

// Types and interfaces

export type TestScore = {
  id: string
  student_id: string
  name?: string // name列を追加
  test_name: string
  test_date: string
  test_type: '100q' | '80q' // テストタイプ（100問 or 80問）
  section_kanri: number
  section_kaibou: number
  section_gakkou: number
  section_rikou: number
  section_yushou: number
  section_shikan: number
  section_kyousei: number
  section_shouni: number
  total_score: number
  created_at: string
  rank?: number
}

// TestScoreWithStats型にavg_rankプロパティを追加
export type TestScoreWithStats = TestScore & {
  avg_section_kanri: number
  avg_section_kaibou: number
  avg_section_gakkou: number
  avg_section_rikou: number
  avg_section_yushou: number
  avg_section_shikan: number
  avg_section_kyousei: number
  avg_section_shouni: number
  avg_total_score: number
  rank: number
  total_rank: number
  avg_rank?: number
  previous_scores?: {
    section_kanri_change: number
    section_kaibou_change: number
    section_gakkou_change: number
    section_rikou_change: number
    section_yushou_change: number
    section_shikan_change: number
    section_kyousei_change: number
    section_shouni_change: number
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
}

export async function getStudentScoresWithStats(studentId: string): Promise<TestScoreWithStats[]> {
  console.log("Getting scores for student:", studentId)

  try {
    // ローカルストレージから現在の学生情報を取得
    const currentStudent = localStorage.getItem("currentStudent")
    const sessionStudentId = currentStudent ? JSON.parse(currentStudent).student_id : null

    // APIルートを通じてサーバーサイドでデータを取得
    const response = await fetch(`/api/student-scores-secure?student_id=${studentId}`, {
      headers: {
        'x-student-session-id': sessionStudentId || ''
      }
    })
    const result = await response.json()

    if (!result.success) {
      console.error("Student scores API error:", result.error)
      return []
    }

    return result.data || []
  } catch (error) {
    console.error("getStudentScoresWithStats error:", error)
    return []
  }
}

// 特定のテストの全学生の成績と順位を取得
export async function getTestRankings(testName: string, testDate: string): Promise<TestScore[]> {
  // TODO: APIエンドポイント経由でデータを取得するように修正が必要
  console.log(`Getting rankings for test: ${testName}, date: ${testDate}`)
  return []
  /*
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
  */
}

// 総合ランキングを取得
export async function getTotalRankings(): Promise<any[]> {
  // TODO: APIエンドポイント経由でデータを取得するように修正が必要
  console.log("Getting total rankings")
  return []
  /*
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
  */
}

// テスト統計情報を取得
export async function getTestAnalytics(testName: string, testDate: string): Promise<TestAnalytics | null> {
  // TODO: APIエンドポイント経由でデータを取得するように修正が必要
  console.log(`Getting test analytics for ${testName} on ${testDate}`)
  return null
  /*
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
  */
}

// 偏差値付きランキングを取得
export async function getTestRankingsWithDeviation(testName: string, testDate: string): Promise<TestRankingWithDeviation[]> {
  // TODO: APIエンドポイント経由でデータを取得するように修正が必要
  console.log(`Getting test rankings with deviation for ${testName} on ${testDate}`)
  return []
  /*
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
  */
}

// 分野別ランキングを取得（セクション指定）
export async function getSectionRankings(testName: string, testDate: string, section: 'a' | 'b' | 'c' | 'd' | 'ad' | 'bc'): Promise<SectionRanking[]> {
  // TODO: APIエンドポイント経由でデータを取得するように修正が必要
  console.log(`Getting section ${section} rankings for ${testName} on ${testDate}`)
  return []
  /*
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
  */
}

// ヘルパー関数
function avg(arr: number[]): number {
  return arr.reduce((sum, val) => sum + val, 0) / arr.length
}

function stdDev(arr: number[], average: number): number {
  const variance = arr.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / arr.length
  return Math.sqrt(variance)
}

// テストタイプ別の問題数とセクション構成
export const TEST_CONFIGURATIONS = {
  '100q': {
    total_questions: 100,
    passing_rate: 0.6, // 60%
    passing_score: 60,
    sections: {
      section_kanri: { max: 9, name: '管理' },
      section_kaibou: { max: 12, name: '解剖' },
      section_gakkou: { max: 9, name: '顎口' },
      section_rikou: { max: 16, name: '理工' },
      section_yushou: { max: 18, name: '有床' },
      section_shikan: { max: 18, name: '歯冠' },
      section_kyousei: { max: 9, name: '矯正' },
      section_shouni: { max: 9, name: '小児' }
    }
  },
  '80q': {
    total_questions: 80,
    passing_rate: 0.6, // 60%
    passing_score: 48, // 80 * 0.6
    sections: {
      section_kanri: { max: 3, name: '管理' },
      section_kaibou: { max: 10, name: '解剖' },
      section_gakkou: { max: 5, name: '顎口' },
      section_rikou: { max: 14, name: '理工' },
      section_yushou: { max: 20, name: '有床' },
      section_shikan: { max: 18, name: '歯冠' },
      section_kyousei: { max: 5, name: '矯正' },
      section_shouni: { max: 5, name: '小児' }
    }
  }
} as const

export type TestType = keyof typeof TEST_CONFIGURATIONS

// 合格判定関数
export function isPassingScore(score: TestScore): boolean {
  const config = TEST_CONFIGURATIONS[score.test_type || '100q']
  return score.total_score >= config.passing_score
}

// テストタイプに応じた合格点を取得
export function getPassingScore(testType: TestType): number {
  return TEST_CONFIGURATIONS[testType].passing_score
}

// テストタイプに応じた最大点数を取得
export function getMaxScore(testType: TestType): number {
  return TEST_CONFIGURATIONS[testType].total_questions
}

// セクション別の最大点数を取得
export function getSectionMaxScore(testType: TestType, sectionKey: string): number {
  const config = TEST_CONFIGURATIONS[testType]
  return config.sections[sectionKey as keyof typeof config.sections]?.max || 0
}
