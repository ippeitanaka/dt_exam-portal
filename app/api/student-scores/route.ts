import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    
    if (!studentId) {
      return NextResponse.json(
        { error: "学生IDが必要です" },
        { status: 400 }
      )
    }

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

    // 特定の学生の成績データを取得
    const { data: studentScores, error: scoresError } = await supabaseAdmin
      .from("test_scores")
      .select("*")
      .eq("student_id", studentId)
      .order("test_date", { ascending: false })

    if (scoresError) {
      console.error("学生成績取得エラー:", scoresError)
      return NextResponse.json(
        { error: "成績データの取得に失敗しました" },
        { status: 500 }
      )
    }

    // 全体の成績データも取得（平均計算用）
    const { data: allScores, error: allScoresError } = await supabaseAdmin
      .from("test_scores")
      .select("*")

    if (allScoresError) {
      console.error("全体成績取得エラー:", allScoresError)
    }

    return NextResponse.json({
      success: true,
      studentScores: studentScores || [],
      allScores: allScores || [],
      message: `${studentId}の成績データを取得しました`
    })

  } catch (error) {
    console.error("Student Scores API エラー:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "不明なエラー" },
      { status: 500 }
    )
  }
}
