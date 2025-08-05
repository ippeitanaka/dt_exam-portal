import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Service role key でデータを更新
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

    console.log("Updating existing test_scores data with test_type...")

    // 既存のすべてのデータを100問として設定
    const { data: updateResult, error: updateError } = await supabase
      .from('test_scores')
      .update({ test_type: '100q' })
      .neq('id', 'impossible-id') // 全レコード対象

    if (updateError) {
      console.error("Error updating data:", updateError)
      return NextResponse.json({
        success: false,
        error: updateError.message
      }, { status: 500 })
    }

    // 結果を確認
    const { data: testData, error: testError } = await supabase
      .from('test_scores')
      .select('id, student_id, test_type')
      .limit(5)

    return NextResponse.json({
      success: true,
      message: "test_type data updated successfully",
      updateResult,
      sampleData: testData
    })

  } catch (error) {
    console.error("Update error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
