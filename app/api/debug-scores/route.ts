import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("student_id") || "221017"

    console.log("Debug: Checking test_scores table for student:", studentId)

    // 1. テーブル構造を確認
    const { data: tableInfo, error: tableError } = await supabase
      .from("test_scores")
      .select("*")
      .limit(1)

    console.log("Table structure sample:", tableInfo)

    // 2. 学生IDでのクエリをテスト（複数の方法で）
    const queries = [
      // 完全一致
      supabase.from("test_scores").select("*").eq("student_id", studentId),
      // 文字列として
      supabase.from("test_scores").select("*").eq("student_id", String(studentId)),
      // LIKEでの検索
      supabase.from("test_scores").select("*").like("student_id", `%${studentId}%`),
      // 全データから手動フィルタ
      supabase.from("test_scores").select("*").limit(10)
    ]

    const results = await Promise.all(queries.map(q => q.then(result => result)))

    // 3. 全ての学生IDを取得
    const { data: allStudentIds, error: allError } = await supabase
      .from("test_scores")
      .select("student_id")
      .limit(50)

    // 4. 特定の学生IDの完全なデータを取得
    const { data: specificStudent, error: specificError } = await supabase
      .from("test_scores")
      .select("*")
      .eq("student_id", studentId)

    return NextResponse.json({
      success: true,
      debug: {
        targetStudentId: studentId,
        tableStructure: tableInfo,
        queryResults: {
          exactMatch: results[0],
          stringMatch: results[1], 
          likeMatch: results[2],
          sampleData: results[3]
        },
        allStudentIds: allStudentIds?.map(s => s.student_id) || [],
        specificStudentData: specificStudent,
        errors: {
          tableError,
          allError,
          specificError
        }
      }
    })
  } catch (error) {
    console.error("Debug API error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
