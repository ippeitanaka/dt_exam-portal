import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { checkAdminApiAuth } from "@/lib/auth-utils"

export async function GET(request: Request) {
  // 認証チェック
  const authCheck = await checkAdminApiAuth(request as any)
  if (!authCheck.authenticated) {
    return authCheck.response
  }

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

    // 管理者用のSupabaseクライアント（RLS回避）
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // test_scoresテーブルから全データを取得
    const { data: scores, error } = await supabaseAdmin
      .from("test_scores")
      .select("*")
      .order("test_date", { ascending: false })

    if (error) {
      console.error("成績データ取得エラー:", error)
      return NextResponse.json(
        { error: `成績データの取得に失敗しました: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: scores || [],
      count: scores?.length || 0,
      message: `${scores?.length || 0}件の成績データを取得しました`
    })

  } catch (error) {
    console.error("成績取得API エラー:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "不明なエラー" },
      { status: 500 }
    )
  }
}
