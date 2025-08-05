import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // 環境変数の確認
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "環境変数が未設定です" },
        { status: 500 }
      )
    }

    // 管理者用のSupabaseクライアント
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // test_scoresテーブルの全データを取得（最新10件）
    const { data: testScores, error: scoresError } = await supabaseAdmin
      .from("test_scores")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10)

    if (scoresError) {
      console.error("test_scores取得エラー:", scoresError)
    }

    // テーブルの構造も確認
    const { data: tableInfo, error: tableError } = await supabaseAdmin
      .rpc('get_table_info', { table_name: 'test_scores' })
      .single()

    if (tableError) {
      console.log("テーブル情報取得エラー（無視）:", tableError)
    }

    return NextResponse.json({
      success: true,
      testScoresCount: testScores?.length || 0,
      testScoresData: testScores || [],
      tableInfo: tableInfo || null,
      message: `test_scoresテーブルに${testScores?.length || 0}件のデータがあります`
    })

  } catch (error) {
    console.error("Debug API エラー:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "不明なエラー" },
      { status: 500 }
    )
  }
}
