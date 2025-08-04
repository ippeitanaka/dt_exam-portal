import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// 管理者用のSupabaseクライアント（RLSをバイパス）
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  console.log("テスト管理API開始")
  
  try {
    // 管理者権限でtest_scoresテーブルからデータを取得
    console.log("テスト一覧取得を開始...")
    
    const { data: testData, error: testError } = await supabaseAdmin
      .from("test_scores")
      .select("test_name, test_date")
      .order("test_date", { ascending: false })
    
    console.log("test_scores データ取得結果:", testData?.length, testError)

    if (testError) {
      console.error("テストデータ取得エラー:", testError)
      return NextResponse.json(
        { error: "テストデータの取得に失敗しました", details: testError.message },
        { status: 500 }
      )
    }

    if (!testData || testData.length === 0) {
      console.log("テストデータが見つかりません")
      return NextResponse.json({
        success: true,
        tests: [],
        message: "テストデータがありません"
      })
    }

    // JavaScriptでデータをグループ化して集計
    const testMap = new Map()
    
    testData.forEach((item: any) => {
      const key = `${item.test_name}|${item.test_date}`
      if (testMap.has(key)) {
        testMap.set(key, {
          ...testMap.get(key),
          count: testMap.get(key).count + 1
        })
      } else {
        testMap.set(key, {
          test_name: item.test_name,
          test_date: item.test_date,
          count: 1
        })
      }
    })

    const aggregatedData = Array.from(testMap.values())
    console.log("集計されたデータ:", aggregatedData.length)
    
    return NextResponse.json({
      success: true,
      tests: aggregatedData,
      total: testData.length
    })

  } catch (error) {
    console.error("テスト管理API エラー:", error)
    return NextResponse.json(
      {
        error: "テスト管理APIでエラーが発生しました",
        details: error instanceof Error ? error.message : "不明なエラー",
      },
      { status: 500 }
    )
  }
}
