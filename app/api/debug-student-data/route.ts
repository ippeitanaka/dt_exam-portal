import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  
  try {
    const url = new URL(request.url)
    const studentId = url.searchParams.get("studentId") || "221017"
    
    console.log(`Debugging data for student: ${studentId}`)
    
    // 1. 学生情報をチェック
    const { data: students, error: studentsError } = await supabase
      .from("students")
      .select("*")
      .eq("student_id", studentId)
    
    // 2. 成績データをチェック
    const { data: scores, error: scoresError } = await supabase
      .from("test_scores")
      .select("*")
      .eq("student_id", studentId)
    
    // 3. 全学生リストを取得
    const { data: allStudents, error: allError } = await supabase
      .from("students")
      .select("student_id, name")
      .limit(10)
    
    // 4. テストスコアのサンプルを取得
    const { data: sampleScores, error: sampleError } = await supabase
      .from("test_scores")
      .select("student_id, test_name, test_date")
      .limit(10)
    
    return NextResponse.json({
      success: true,
      studentId,
      data: {
        targetStudent: students,
        studentScores: scores,
        allStudents,
        sampleScores,
        errors: {
          studentsError,
          scoresError,
          allError,
          sampleError
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
