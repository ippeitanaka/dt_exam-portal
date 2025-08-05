import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    console.log("Debug: Checking all tables and their data")

    // 1. test_scoresテーブルの詳細確認
    const { data: testScores, error: testScoresError } = await supabase
      .from("test_scores")
      .select("*")
      .limit(5)

    // 2. studentsテーブルも確認
    const { data: students, error: studentsError } = await supabase
      .from("students")
      .select("*")
      .limit(5)

    // 3. 可能性のある他のテーブル名をテスト
    const possibleTables = ["test_results", "student_scores", "exam_scores", "scores"]
    const tableTests = []
    
    for (const tableName of possibleTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select("*")
          .limit(2)
        
        tableTests.push({
          tableName,
          exists: !error,
          data: data || [],
          error: error?.message
        })
      } catch (e) {
        tableTests.push({
          tableName,
          exists: false,
          data: [],
          error: e instanceof Error ? e.message : "Unknown error"
        })
      }
    }

    // 4. PostgreSQLの情報スキーマから実際のテーブル一覧を取得（可能であれば）
    const { data: tableList, error: tableListError } = await supabase
      .rpc('get_table_list')
      .then(result => result)
      .catch(() => ({ data: null, error: "RPC not available" }))

    return NextResponse.json({
      success: true,
      debug: {
        testScoresTable: {
          data: testScores,
          error: testScoresError
        },
        studentsTable: {
          data: students,
          error: studentsError
        },
        possibleTables: tableTests,
        databaseTables: {
          data: tableList,
          error: tableListError
        }
      }
    })
  } catch (error) {
    console.error("Table debug API error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
