import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Service role key でテーブル構造を確認
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

    // test_scoresテーブルの構造を確認
    const { data: tableInfo, error: tableError } = await supabase
      .from('test_scores')
      .select('*')
      .limit(1)

    if (tableError) {
      console.error("Table info error:", tableError)
    }

    // test_type列のデータ分布を確認
    const { data: typeDistribution, error: typeError } = await supabase
      .from('test_scores')
      .select('test_type')
      .limit(100)

    const typeCounts = typeDistribution?.reduce((acc: any, item: any) => {
      acc[item.test_type] = (acc[item.test_type] || 0) + 1
      return acc
    }, {}) || {}

    // サンプルデータを確認
    const { data: sampleData, error: sampleError } = await supabase
      .from('test_scores')
      .select('student_id, test_name, test_date, total_score, max_score, test_type')
      .limit(5)

    return NextResponse.json({
      success: true,
      message: "Table structure verified",
      hasTestTypeColumn: tableInfo && 'test_type' in (tableInfo[0] || {}),
      typeCounts,
      sampleData,
      errors: {
        tableError: tableError?.message,
        typeError: typeError?.message,
        sampleError: sampleError?.message
      }
    })

  } catch (error) {
    console.error("Verification error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
