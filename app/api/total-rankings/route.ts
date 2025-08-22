import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// サービスロールクライアント（サーバー専用）
function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

export async function GET() {
  try {
    const supabase = getAdmin()

    // 全スコア取得（列を絞る）
    const { data, error } = await supabase
      .from('test_scores')
      .select('student_id, name, total_score')

    if (error) {
      console.error('[total-rankings] fetch error', error)
      return NextResponse.json({ success: false, error: 'データ取得に失敗しました' }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    // 学生ごとに集計
    const byStudent: Record<string, { student_id: string; name?: string | null; total: number; count: number }> = {}
    for (const row of data) {
      if (!byStudent[row.student_id]) {
        byStudent[row.student_id] = { student_id: row.student_id, name: row.name, total: 0, count: 0 }
      }
      byStudent[row.student_id].total += row.total_score || 0
      byStudent[row.student_id].count += 1
      // 後から名前が埋まる可能性あり（null対策）
      if (!byStudent[row.student_id].name && row.name) byStudent[row.student_id].name = row.name
    }

    // 平均計算
    let aggregated = Object.values(byStudent).map(s => ({
      student_id: s.student_id,
      name: s.name || null,
      avg_score: s.total / s.count,
      test_count: s.count
    }))

    // 並び替え（平均降順）
    aggregated.sort((a, b) => b.avg_score - a.avg_score)

    // 競技順位（同点同順位、次は飛ばす）
    let lastScore: number | null = null
    let lastRank = 0
    aggregated = aggregated.map((row, idx) => {
      if (lastScore === null || row.avg_score !== lastScore) {
        lastRank = idx + 1
        lastScore = row.avg_score
      }
      return { ...row, rank: lastRank }
    })

    return NextResponse.json({ success: true, data: aggregated })
  } catch (e) {
    console.error('[total-rankings] unexpected error', e)
    return NextResponse.json({ success: false, error: 'サーバーエラー' }, { status: 500 })
  }
}
