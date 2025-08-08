import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { checkAdminApiAuth } from "@/lib/auth-utils"

export async function POST(request: Request) {
  // 認証チェック
  const authCheck = await checkAdminApiAuth(request as any)
  if (!authCheck.authenticated) {
    return authCheck.response
  }

  try {
    // Service roleキーを使用してSupabaseクライアントを作成（DELETE権限が必要）
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { testName, testDate } = await request.json()

    console.log("[削除API] 受信データ - testName:", testName, "testDate:", testDate)

    if (!testName || !testDate) {
      return NextResponse.json({ error: "テスト名と日付が必要です" }, { status: 400 })
    }

    // 指定されたテスト名と日付に一致するすべてのテスト結果を削除
    console.log("[削除API] クエリ実行中...")
    const { data, error, count } = await supabase
      .from("test_scores")
      .delete()
      .eq("test_name", testName)
      .eq("test_date", testDate)
      .select()

    console.log("[削除API] クエリ結果 - data:", data, "error:", error)

    if (error) {
      console.error("テスト結果削除エラー:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `${data?.length || 0}件のテスト結果を削除しました`,
      deletedCount: data?.length || 0,
    })
  } catch (error) {
    console.error("削除エラー:", error)
    return NextResponse.json(
      {
        error: "テスト結果の削除に失敗しました",
        details: error instanceof Error ? error.message : "不明なエラー",
      },
      { status: 500 },
    )
  }
}
