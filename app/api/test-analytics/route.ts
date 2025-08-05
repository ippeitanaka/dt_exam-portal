import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import { isPassingScore, getPassingScore } from "@/lib/ranking-utils"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const testName = searchParams.get("test_name")
    const testDate = searchParams.get("test_date")

    if (!testName || !testDate) {
      return NextResponse.json({
        success: false,
        error: "test_name and test_date are required"
      }, { status: 400 })
    }

    // Service role key でデータを取得
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log(`Getting test analytics for ${testName} on ${testDate}`)

    // テストのデータを取得
    const { data: rawData, error } = await supabase
      .from('test_scores')
      .select('*')
      .eq('test_name', testName)
      .eq('test_date', testDate)

    if (error) {
      console.error("テスト統計情報取得エラー:", error)
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    if (!rawData || rawData.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No test data found"
      }, { status: 404 })
    }

    // テストタイプを判定（最初のレコードから取得）
    const testType = rawData[0].test_type || '100q'
    const passingScore = getPassingScore(testType)

    // 統計情報を計算
    const scores = rawData.map(s => s.total_score)
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length

    // テストタイプに応じた合格判定
    const passCount = rawData.filter(score => isPassingScore(score)).length
    const passRate = (passCount / rawData.length) * 100

    // セクション別平均
    const sectionAverages = {
      avg_section_kanri: rawData.reduce((sum, s) => sum + (s.section_kanri || 0), 0) / rawData.length,
      avg_section_kaibou: rawData.reduce((sum, s) => sum + (s.section_kaibou || 0), 0) / rawData.length,
      avg_section_gakkou: rawData.reduce((sum, s) => sum + (s.section_gakkou || 0), 0) / rawData.length,
      avg_section_rikou: rawData.reduce((sum, s) => sum + (s.section_rikou || 0), 0) / rawData.length,
      avg_section_yushou: rawData.reduce((sum, s) => sum + (s.section_yushou || 0), 0) / rawData.length,
      avg_section_shikan: rawData.reduce((sum, s) => sum + (s.section_shikan || 0), 0) / rawData.length,
      avg_section_kyousei: rawData.reduce((sum, s) => sum + (s.section_kyousei || 0), 0) / rawData.length,
      avg_section_shouni: rawData.reduce((sum, s) => sum + (s.section_shouni || 0), 0) / rawData.length,
    }

    // 標準偏差を計算
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / scores.length
    const stdDev = Math.sqrt(variance)

    const analytics = {
      total_students: rawData.length,
      avg_score: avgScore,
      max_score: Math.max(...scores),
      min_score: Math.min(...scores),
      passing_count: passCount,
      passing_rate: passRate,
      passing_score: passingScore,
      test_type: testType,
      ...sectionAverages,
      std_dev: stdDev
    }

    return NextResponse.json({
      success: true,
      data: analytics
    })

  } catch (error) {
    console.error("Test analytics API error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
