import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("student_id")
    const sessionStudentId = request.headers.get("x-student-session-id")

    if (!studentId) {
      return NextResponse.json({
        success: false,
        error: "student_id is required"
      }, { status: 400 })
    }

    // セッション確認：リクエストされた学生IDがセッション内の学生IDと一致するかチェック
    if (!sessionStudentId || sessionStudentId !== studentId) {
      return NextResponse.json({
        success: false,
        error: "Unauthorized: You can only access your own scores"
      }, { status: 403 })
    }

    // Service role key でRLSをバイパス
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

    console.log("Getting student scores for:", studentId)

    // 学生の成績データを取得
    const { data: studentScores, error: scoresError } = await supabase
      .from("test_scores")
      .select("*")
      .eq("student_id", studentId)
      .order("test_date", { ascending: false })

    if (scoresError) {
      console.error("成績データ取得エラー:", scoresError)
      return NextResponse.json({
        success: false,
        error: scoresError.message
      }, { status: 500 })
    }

    if (!studentScores || studentScores.length === 0) {
      console.log(`No scores found for student ${studentId}`)
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    // 各テストの平均点を計算
    const testAverages: Record<string, any> = {}
    for (const score of studentScores) {
      const { data: avgData, error: avgError } = await supabase
        .from("test_scores")
        .select(`
          test_name,
          test_date,
          section_kanri,
          section_kaibou,
          section_gakkou,
          section_rikou,
          section_yushou,
          section_shikan,
          section_kyousei,
          section_shouni,
          total_score
        `)
        .eq("test_name", score.test_name)
        .eq("test_date", score.test_date)

      if (!avgError && avgData && avgData.length > 0) {
        // 平均値を計算
        const counts = avgData.length
        const averages = {
          avg_section_kanri: avgData.reduce((sum, item) => sum + (item.section_kanri || 0), 0) / counts,
          avg_section_kaibou: avgData.reduce((sum, item) => sum + (item.section_kaibou || 0), 0) / counts,
          avg_section_gakkou: avgData.reduce((sum, item) => sum + (item.section_gakkou || 0), 0) / counts,
          avg_section_rikou: avgData.reduce((sum, item) => sum + (item.section_rikou || 0), 0) / counts,
          avg_section_yushou: avgData.reduce((sum, item) => sum + (item.section_yushou || 0), 0) / counts,
          avg_section_shikan: avgData.reduce((sum, item) => sum + (item.section_shikan || 0), 0) / counts,
          avg_section_kyousei: avgData.reduce((sum, item) => sum + (item.section_kyousei || 0), 0) / counts,
          avg_section_shouni: avgData.reduce((sum, item) => sum + (item.section_shouni || 0), 0) / counts,
          avg_total_score: avgData.reduce((sum, item) => sum + (item.total_score || 0), 0) / counts,
        }
        testAverages[`${score.test_name}_${score.test_date}`] = averages
      }
    }

    // 各テストの順位を計算
    const testRankings: Record<string, number> = {}
    for (const score of studentScores) {
      const { data: rankData, error: rankError } = await supabase
        .from("test_scores")
        .select("student_id, total_score")
        .eq("test_name", score.test_name)
        .eq("test_date", score.test_date)
        .order("total_score", { ascending: false })

      if (!rankError && rankData) {
        const rank = rankData.findIndex(item => item.student_id === studentId) + 1
        testRankings[`${score.test_name}_${score.test_date}`] = rank
      }
    }

    // 結果を組み合わせる
    const scoresWithStats = studentScores.map((score) => {
      const testKey = `${score.test_name}_${score.test_date}`
      const avgData = testAverages[testKey] || {
        avg_section_kanri: 0,
        avg_section_kaibou: 0,
        avg_section_gakkou: 0,
        avg_section_rikou: 0,
        avg_section_yushou: 0,
        avg_section_shikan: 0,
        avg_section_kyousei: 0,
        avg_section_shouni: 0,
        avg_total_score: 0,
      }

      return {
        ...score,
        ...avgData,
        rank: testRankings[testKey] || 0,
        total_rank: null, // 後で総合順位計算
        avg_rank: null,   // 平均順位（未使用）
      }
    })

    // --- 総合順位（平均点ベース）計算を追加 ---
    try {
      // 全学生の総合平均点を取得
      const { data: allScores, error: allError } = await supabase
        .from('test_scores')
        .select('student_id, total_score')

      if (!allError && allScores && allScores.length > 0) {
        const agg: Record<string, { sum: number; count: number }> = {}
        for (const row of allScores) {
          if (!agg[row.student_id]) agg[row.student_id] = { sum: 0, count: 0 }
          agg[row.student_id].sum += row.total_score || 0
          agg[row.student_id].count += 1
        }
        const list = Object.entries(agg).map(([sid, v]) => ({
          student_id: sid,
          avg: v.sum / v.count
        }))
        list.sort((a, b) => b.avg - a.avg)
        let lastScore: number | null = null
        let lastRank = 0
        const rankMap: Record<string, { rank: number; avg: number }> = {}
        list.forEach((item, idx) => {
          if (lastScore === null || item.avg !== lastScore) {
            lastRank = idx + 1
            lastScore = item.avg
          }
          rankMap[item.student_id] = { rank: lastRank, avg: item.avg }
        })

        // 対象学生の平均点
        const self = rankMap[studentId]
        if (self) {
          // scoresWithStats の total_rank と平均点情報を設定
          for (const s of scoresWithStats) {
            s.total_rank = self.rank
            // 総合順位計算用の平均点を新しいフィールドに保存
            ;(s as any).overall_average_score = self.avg
          }
        }
      }
    } catch (e) {
      console.error('総合順位計算エラー:', e)
    }

    return NextResponse.json({
      success: true,
      data: scoresWithStats
    })

  } catch (error) {
    console.error("Student scores API error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
