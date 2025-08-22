import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const testName = searchParams.get('test_name')
    const testDate = searchParams.get('test_date')

    if (!testName || !testDate) {
      return NextResponse.json({ success: false, error: 'test_name と test_date は必須です' }, { status: 400 })
    }

    const supabase = getAdmin()
    const { data, error } = await supabase
      .from('test_scores')
      .select('*')
      .eq('test_name', testName)
      .eq('test_date', testDate)
      .order('total_score', { ascending: false })

    if (error) {
      console.error('[test-rankings] fetch error', error)
      return NextResponse.json({ success: false, error: 'データ取得に失敗しました' }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    // ランク付与（同点同順位対応）
    let lastScore: number | null = null
    let lastRank = 0
    const ranked = data.map((row, idx) => {
      if (lastScore === null || row.total_score !== lastScore) {
        lastRank = idx + 1
        lastScore = row.total_score
      }
      return { ...row, rank: lastRank }
    })

    return NextResponse.json({ success: true, data: ranked })
  } catch (e) {
    console.error('[test-rankings] unexpected error', e)
    return NextResponse.json({ success: false, error: 'サーバーエラー' }, { status: 500 })
  }
}
